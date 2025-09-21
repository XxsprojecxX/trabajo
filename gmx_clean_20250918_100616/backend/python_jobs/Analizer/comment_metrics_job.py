"""Scheduled job/Cloud Function to aggregate social media comments.

The routine pulls recent comments from the ``vw_comments_app_api`` BigQuery view
and relies on :mod:`comment_analizer` to compute aggregated metrics (keywords,
basic sentiment).  The results are stored per post and per creator in a
BigQuery table so they can be served from the Next.js API.
"""

from __future__ import annotations

import json
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence, Tuple

from google.cloud import bigquery


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

from comment_analizer import AggregatedMetrics, analyze_comment_list, save_metrics_to_bigquery


DEFAULT_VIEW_FQN = (
    os.getenv("COMMENTS_VIEW_FQN")
    or "galletas-piloto-ju-250726.gmx_week_2025_09_04_2025_09_11.vw_comments_app_api"
)
DEFAULT_METRICS_TABLE_FQN = (
    os.getenv("COMMENTS_METRICS_TABLE_FQN")
    or "galletas-piloto-ju-250726.gmx_week_2025_09_04_2025_09_11.comment_metrics"
)


def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    value = value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(value)
    except ValueError as exc:  # noqa: PERF203 - explicit error message is helpful here.
        raise ValueError(f"Timestamp '{value}' no tiene formato ISO válido") from exc
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _fetch_comments(
    client: bigquery.Client,
    view_fqn: str,
    *,
    creators: Optional[Sequence[str]] = None,
    start_ts: Optional[datetime] = None,
    end_ts: Optional[datetime] = None,
    limit: Optional[int] = None,
) -> List[Mapping[str, Any]]:
    conditions = ["comment_text IS NOT NULL", "comment_text != ''"]
    params: List[bigquery.ScalarQueryParameter | bigquery.ArrayQueryParameter] = []

    if creators:
        conditions.append("creator_handle IN UNNEST(@creators)")
        params.append(bigquery.ArrayQueryParameter("creators", "STRING", list(creators)))
    if start_ts:
        conditions.append("ts >= @start_ts")
        params.append(bigquery.ScalarQueryParameter("start_ts", "TIMESTAMP", start_ts))
    if end_ts:
        conditions.append("ts <= @end_ts")
        params.append(bigquery.ScalarQueryParameter("end_ts", "TIMESTAMP", end_ts))

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order_clause = "ORDER BY ts DESC" if limit else ""
    limit_clause = "LIMIT @limit" if limit else ""
    if limit:
        params.append(bigquery.ScalarQueryParameter("limit", "INT64", int(limit)))

    sql = f"""
        SELECT creator_handle, platform, post_id, post_url, comment_text, ts
        FROM `{view_fqn}`
        {where_clause}
        {order_clause}
        {limit_clause}
    """

    job_config = bigquery.QueryJobConfig(query_parameters=params)
    rows = client.query(sql, job_config=job_config).result()
    return [dict(row.items()) for row in rows]


def _aggregate_comment_groups(
    rows: Iterable[Mapping[str, Any]],
    *,
    top_n_keywords: int = 10,
) -> List[Tuple[Mapping[str, Any], AggregatedMetrics]]:
    by_post: Dict[Tuple[Optional[str], Optional[str], Optional[str]], List[str]] = defaultdict(list)
    by_creator: Dict[Tuple[Optional[str], Optional[str]], List[str]] = defaultdict(list)
    post_metadata: Dict[Tuple[Optional[str], Optional[str], Optional[str]], Mapping[str, Any]] = {}
    creator_metadata: Dict[Tuple[Optional[str], Optional[str]], Mapping[str, Any]] = {}

    for row in rows:
        text = row.get("comment_text")
        if not text:
            continue

        platform = row.get("platform")
        creator = row.get("creator_handle")
        post_id = row.get("post_id")

        post_key = (platform, creator, post_id)
        creator_key = (platform, creator)

        by_post[post_key].append(text)
        by_creator[creator_key].append(text)

        post_metadata.setdefault(
            post_key,
            {
                "aggregated_type": "post",
                "platform": platform,
                "creator_handle": creator,
                "post_id": post_id,
            },
        )
        creator_metadata.setdefault(
            creator_key,
            {
                "aggregated_type": "creator",
                "platform": platform,
                "creator_handle": creator,
                "post_id": None,
            },
        )

    aggregated: List[Tuple[Mapping[str, Any], AggregatedMetrics]] = []

    for key, comments in by_post.items():
        metadata = post_metadata[key]
        aggregated.append((metadata, analyze_comment_list(comments, top_n=top_n_keywords)))

    for key, comments in by_creator.items():
        metadata = creator_metadata[key]
        aggregated.append((metadata, analyze_comment_list(comments, top_n=top_n_keywords)))

    return aggregated


def _persist_metrics(
    aggregated: Sequence[Tuple[Mapping[str, Any], AggregatedMetrics]],
    table_fqn: str,
    client: bigquery.Client,
) -> None:
    first = True
    for metadata, metrics in aggregated:
        save_metrics_to_bigquery(
            metrics,
            metadata,
            table_fqn,
            client=client,
            create_table_if_needed=first,
        )
        first = False


def run_aggregation(
    *,
    creators: Optional[Sequence[str]] = None,
    view_fqn: str = DEFAULT_VIEW_FQN,
    table_fqn: str = DEFAULT_METRICS_TABLE_FQN,
    start_ts: Optional[datetime] = None,
    end_ts: Optional[datetime] = None,
    limit: Optional[int] = None,
    top_n_keywords: int = 10,
    project: Optional[str] = None,
) -> MutableMapping[str, Any]:
    client = bigquery.Client(project=project) if project else bigquery.Client()

    rows = _fetch_comments(
        client,
        view_fqn,
        creators=creators,
        start_ts=start_ts,
        end_ts=end_ts,
        limit=limit,
    )

    aggregated = _aggregate_comment_groups(rows, top_n_keywords=top_n_keywords)
    if aggregated:
        _persist_metrics(aggregated, table_fqn, client)

    return {
        "fetched_comments": len(rows),
        "aggregated_groups": len(aggregated),
        "table": table_fqn,
        "view": view_fqn,
    }


def aggregate_comments_entry(request: Optional[Any] = None) -> MutableMapping[str, Any]:
    """HTTP entry-point compatible with Cloud Functions."""

    creators_param: Optional[str] = None
    start_param: Optional[str] = None
    end_param: Optional[str] = None
    limit_param: Optional[str] = None
    top_param: Optional[str] = None

    if request is not None:
        if hasattr(request, "args") and request.args:
            creators_param = request.args.get("creators")
            start_param = request.args.get("start_ts")
            end_param = request.args.get("end_ts")
            limit_param = request.args.get("limit")
            top_param = request.args.get("top")
        if hasattr(request, "get_json"):
            payload = request.get_json(silent=True) or {}
            creators_param = creators_param or payload.get("creators")
            start_param = start_param or payload.get("start_ts")
            end_param = end_param or payload.get("end_ts")
            limit_param = limit_param or payload.get("limit")
            top_param = top_param or payload.get("top")

    creators = [c.strip() for c in creators_param.split(",") if c.strip()] if creators_param else None
    start_ts = _parse_timestamp(start_param) if start_param else None
    end_ts = _parse_timestamp(end_param) if end_param else None
    limit = int(limit_param) if limit_param else None
    top_n = int(top_param) if top_param else 10

    summary = run_aggregation(
        creators=creators,
        start_ts=start_ts,
        end_ts=end_ts,
        limit=limit,
        top_n_keywords=top_n,
    )

    return {"ok": True, **summary}


def main() -> None:
    summary = run_aggregation()
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":  # pragma: no cover - manual execution helper
    main()