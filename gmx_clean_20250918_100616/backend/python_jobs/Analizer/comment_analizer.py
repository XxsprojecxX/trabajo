"""Utilities to analyse batches of IG/TikTok comments.

This module originally exposed a very small helper that read a JSON file with
comments and returned the top keywords.  The analytics needs have grown and we
now reuse the same logic in a number of places (API, scheduled jobs, ad-hoc
analysis).  The helpers below keep backwards compatibility while providing a
structured interface that works directly with in-memory lists of comments and
can persist the aggregated metrics in BigQuery when required.
"""

from __future__ import annotations

import json

import os
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable, List, Mapping, MutableMapping, Optional, Sequence

try:  # Optional dependency, only needed when persisting metrics.
    from google.api_core.exceptions import NotFound  # type: ignore
    from google.cloud import bigquery  # type: ignore
except Exception:  # pragma: no cover - BigQuery client is optional.
    NotFound = None
    bigquery = None

# ---------------------------------------------------------------------------
# Stopwords and sentiment dictionaries.
# ---------------------------------------------------------------------------

STOPWORDS = {
    "el",
    "la",
    "de",
    "y",
    "que",
    "en",
    "a",
    "un",
    "una",
    "los",
    "las",
    "con",
    "por",
    "para",
    "del",
    "al",
    "se",
    "es",
    "su",
    "lo",
    "muy",
    "me",
    "mi",
    "tu",
    "te",
    "sus",
    "las",
    "los",
    "the",
    "to",
    "of",
    "and",
    "in",
    "for",
    "on",
}

POSITIVE_WORDS = {
    "amor",
    "lindo",
    "linda",
    "bello",
    "bella",
    "cool",
    "nice",
    "amazing",
    "bueno",
    "buena",
    "excelente",
    "genial",
    "feliz",
    "gracias",
    "increíble",
    "perfecto",
    "perfecta",
    "love",
    "cute",
    "awesome",
    "great",
}

NEGATIVE_WORDS = {
    "feo",
    "fea",
    "malo",
    "mala",
    "odio",
    "hate",
    "bad",
    "horrible",
    "triste",
    "wtf",
    "ugly",
    "awful",
    "terrible",
    "asco",
    "fail",
    "furioso",
    "molesto",
    "angry",
}


# ---------------------------------------------------------------------------
# Dataclasses and helpers.
# ---------------------------------------------------------------------------


@dataclass
class AggregatedMetrics:
    """Container for aggregated comment metrics."""

    total_comments: int
    keywords: List[Mapping[str, Any]]
    sentiment: Mapping[str, float]

    def asdict(self) -> MutableMapping[str, Any]:
        """Return a mutable dictionary representation useful for serialization."""

        return {
            "total_comments": self.total_comments,
            "keywords": self.keywords,
            "sentiment": dict(self.sentiment),
        }


def limpiar_texto(texto: str) -> str:
    """Limpia comentarios: elimina símbolos, links y minúsculas."""
    texto = texto.lower()
    texto = re.sub(r"http\S+", "", texto)  # links
    texto = re.sub(r"[^a-záéíóúñ ]", " ", texto)  # solo letras
    texto = re.sub(r"\s+", " ", texto).strip()  # espacios extra
    return texto

def _extract_comment_text(comment: Any) -> Optional[str]:
    """Return the textual content from different comment payload shapes."""

    if comment is None:
        return None
    if isinstance(comment, str):
        return comment
    if isinstance(comment, Mapping):
        for key in ("comment_text", "comment", "text"):
            value = comment.get(key)
            if isinstance(value, str) and value.strip():
                return value
    return None


def _tokenise(comments: Iterable[str]) -> List[str]:
    tokens: List[str] = []
    for raw in comments:
        cleaned = limpiar_texto(raw)
        tokens.extend(t for t in cleaned.split(" ") if t and t not in STOPWORDS)
    return tokens


def _top_keywords(tokens: Sequence[str], top_n: int) -> List[Mapping[str, Any]]:
    if not tokens:
        return []

    counter = Counter(tokens)
    total = sum(counter.values())
    resultados = []
    for palabra, freq in counter.most_common(top_n):
        percentage = round((freq / total) * 100, 2) if total else 0.0
        resultados.append(
            {
                "keyword": palabra,
                "percentage": percentage,
                "porcentaje": percentage,
            }
        )
    return resultados


def _sentiment_for_comment(comment: str) -> str:
    tokens = limpiar_texto(comment).split(" ")
    positives = sum(1 for token in tokens if token in POSITIVE_WORDS)
    negatives = sum(1 for token in tokens if token in NEGATIVE_WORDS)
    if positives > negatives:
        return "positive"
    if negatives > positives:
        return "negative"
    return "neutral"


def _sentiment_breakdown(comments: Sequence[str]) -> Mapping[str, float]:
    if not comments:
        return {"positive": 0.0, "neutral": 0.0, "negative": 0.0}

    counts = defaultdict(int)
    for comment in comments:
        counts[_sentiment_for_comment(comment)] += 1

    total = float(len(comments))
    return {
        "positive": round((counts.get("positive", 0) / total) * 100, 2) if total else 0.0,
        "neutral": round((counts.get("neutral", 0) / total) * 100, 2) if total else 0.0,
        "negative": round((counts.get("negative", 0) / total) * 100, 2) if total else 0.0,
    }


def analyze_comment_list(comments: Iterable[Any], top_n: int = 10) -> AggregatedMetrics:
    """Compute aggregated metrics (keywords + sentiment) from a comment list."""

    extracted = [_extract_comment_text(c) for c in comments]
    extracted = [c for c in extracted if c]

    tokens = _tokenise(extracted)
    keywords = _top_keywords(tokens, top_n)
    sentiment = _sentiment_breakdown(extracted)

    return AggregatedMetrics(
        total_comments=len(extracted),
        keywords=keywords,
        sentiment=sentiment,
    )


def analizar_comentarios(ruta_json: str, top_n: int = 10) -> Mapping[str, Any]:
    """Legacy helper kept for backwards compatibility.

    The function now delegates to :func:`analyze_comment_list` so existing
    scripts that relied on reading a ``comments.json`` file keep working.
    """
    
    if not os.path.exists(ruta_json):
        raise FileNotFoundError(f"No se encontró el archivo: {ruta_json}")


    with open(ruta_json, "r", encoding="utf-8") as fh:
        payload = json.load(fh)

    metrics = analyze_comment_list(payload, top_n=top_n)
    return {"temas": metrics.keywords, **metrics.asdict()}


def save_metrics_to_bigquery(
    metrics: AggregatedMetrics,
    metadata: Mapping[str, Any],
    table_fqn: str,
    client: Optional[Any] = None,
    create_table_if_needed: bool = True,
) -> None:
    """Persist aggregated metrics to a BigQuery table.

    Parameters
    ----------
    metrics:
        Metrics calculated with :func:`analyze_comment_list`.
    metadata:
        Additional fields to store alongside the metrics (for example the
        ``post_id`` or ``creator_handle``).
    table_fqn:
        Fully qualified table name in the form ``project.dataset.table``.
    client:
        Optional BigQuery client.  When ``None`` the function will try to
        instantiate one.
    create_table_if_needed:
        When ``True`` (default) the function will attempt to create the table
        with an appropriate schema if it does not exist.
    """

    if bigquery is None:
        raise ImportError("google-cloud-bigquery is required to persist metrics")
   
    if not table_fqn or table_fqn.count(".") != 2:
        raise ValueError("table_fqn debe tener el formato 'proyecto.dataset.tabla'")

    client = client or bigquery.Client()


    if create_table_if_needed:
            _ensure_metrics_table(client, table_fqn)

    row = {**metadata, **metrics.asdict(), "aggregated_at": datetime.now(timezone.utc).isoformat()}
    errors = client.insert_rows_json(table_fqn, [row])
    if errors:
        raise RuntimeError(f"Errores al insertar métricas en BigQuery: {errors}")

def _ensure_metrics_table(client: Any, table_fqn: str) -> None:
    if bigquery is None:
        return
    assert bigquery is not None  # For type-checkers.

    project, dataset_id, table_id = table_fqn.split(".")
    dataset_ref = bigquery.DatasetReference(project, dataset_id)
    table_ref = dataset_ref.table(table_id)

    try:
        client.get_table(table_ref)
        return
    except Exception as exc:  # pragma: no cover - network call
        if NotFound is None or not isinstance(exc, NotFound):
            raise

    schema = [
        bigquery.SchemaField("aggregated_at", "TIMESTAMP", mode="REQUIRED"),
        bigquery.SchemaField("aggregated_type", "STRING"),
        bigquery.SchemaField("creator_handle", "STRING"),
        bigquery.SchemaField("post_id", "STRING"),
        bigquery.SchemaField("platform", "STRING"),
        bigquery.SchemaField("total_comments", "INT64"),
        bigquery.SchemaField(
            "keywords",
            "RECORD",
            mode="REPEATED",
            fields=[
                bigquery.SchemaField("keyword", "STRING"),
                bigquery.SchemaField("percentage", "FLOAT64"),
                bigquery.SchemaField("porcentaje", "FLOAT64"),
            ],
        ),
        bigquery.SchemaField(
            "sentiment",
            "RECORD",
            fields=[
                bigquery.SchemaField("positive", "FLOAT64"),
                bigquery.SchemaField("neutral", "FLOAT64"),
                bigquery.SchemaField("negative", "FLOAT64"),
            ],
        ),
    ]


    table = bigquery.Table(table_ref, schema=schema)
    client.create_table(table)  # pragma: no cover - network call

if __name__ == "__main__":  # pragma: no cover - manual smoke test
    ruta = "backend/data/comments_instagram.json"  # ejemplo
    try:
        print(analizar_comentarios(ruta))
    except Exception as e:  # noqa: BLE001 - simple script
        print(f"Error: {e}")
