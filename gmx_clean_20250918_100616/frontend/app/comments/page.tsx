"use client";
import { useEffect, useState } from "react";
type TimestampLike = string | { value: string } | null | undefined;

type Row = {
  creator_handle: string;
  platform: string;
  comment_text: string;
  ts: TimestampLike;
  post_url?: string;
  likes?: number;
};

type KeywordMetric = {
  keyword: string;
  percentage?: number | string;
  porcentaje?: number | string;
};

type SentimentMetric = {
  positive?: number | string;
  neutral?: number | string;
  negative?: number | string;
};

type AggregateRow = {
  aggregated_type: "post" | "creator";
  creator_handle: string;
  platform?: string;
  post_id?: string | null;
  aggregated_at?: TimestampLike;
  total_comments?: number | string;
  keywords?: KeywordMetric[];
  sentiment?: SentimentMetric;
};

type AggregatesPayload = {
  by_post: AggregateRow[];
  by_creator: AggregateRow[];
};

function toIso(ts: TimestampLike) {
  if (!ts) return "";
  if (typeof ts === "string") return ts;
  if (typeof ts === "object" && "value" in ts) return String(ts.value);
  return "";
}
function formatPercent(value: unknown) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? parseFloat(value)
      : undefined;
  if (typeof num === "number" && Number.isFinite(num)) {
    return `${num.toFixed(1)}%`;
  }
  return "0.0%";
}

function safeTotal(value: unknown) {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? parseInt(value, 10)
      : undefined;
  return Number.isFinite(num as number) ? (num as number) : 0;
}

export default function CommentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [aggregates, setAggregates] = useState<AggregatesPayload>({ by_post: [], by_creator: [] });
  const [loading, setLoading] = useState(true);
  const creators = ["papa.de.cuatro", "giannacristante", "mamiabordo"].join(",");

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/comments/v1?creators=${creators}&limit=60`, { cache: "no-store" });
        const json = await res.json();
        setRows(Array.isArray(json.items) ? json.items : []);
        if (json.aggregates) {
          setAggregates({
            by_post: Array.isArray(json.aggregates.by_post) ? json.aggregates.by_post : [],
            by_creator: Array.isArray(json.aggregates.by_creator) ? json.aggregates.by_creator : [],
          });
        } else {
          setAggregates({ by_post: [], by_creator: [] });
        }
      } finally {
        setLoading(false);
      }
    }
    run();

  }, [creators]);


  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Comentarios (semana 04–11 Sep)</h1>
      {loading && <div>Cargando…</div>}
      {!loading && rows.length === 0 && <div>Sin comentarios</div>}
      {!loading && aggregates.by_creator.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Resumen por creadora</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {aggregates.by_creator.map((agg, idx) => {
              const iso = toIso(agg.aggregated_at);
              const when = iso ? new Date(iso).toLocaleString() : "";
              return (
                <div key={`${agg.creator_handle}-${idx}`} className="rounded-2xl border p-4 shadow-sm">
                  <div className="text-sm opacity-70">{when ? `Actualizado: ${when}` : ""}</div>
                  <div className="font-semibold">@{agg.creator_handle}</div>
                  <div className="text-sm opacity-80">Plataforma: {agg.platform?.toUpperCase?.() || ""}</div>
                  <div className="text-sm">Comentarios analizados: {safeTotal(agg.total_comments)}</div>

                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-semibold">Sentimiento</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="opacity-70">Positivos</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.positive)}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Neutros</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.neutral)}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Negativos</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.negative)}</div>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(agg.keywords) && agg.keywords.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-semibold">Top palabras</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {agg.keywords.slice(0, 5).map((kw, i) => (
                          <li key={`${kw.keyword}-${i}`} className="flex items-baseline justify-between gap-2">
                            <span className="truncate">{kw.keyword}</span>
                            <span className="font-semibold">{formatPercent(kw.percentage ?? kw.porcentaje)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!loading && aggregates.by_post.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Resumen por post</h2>
          <div className="grid gap-3">
            {aggregates.by_post.map((agg, idx) => {
              const iso = toIso(agg.aggregated_at);
              const when = iso ? new Date(iso).toLocaleString() : "";
              return (
                <div key={`${agg.creator_handle}-${agg.post_id}-${idx}`} className="rounded-2xl border p-4 shadow-sm">
                  <div className="text-sm opacity-70">{when ? `Actualizado: ${when}` : ""}</div>
                  <div className="font-semibold">
                    @{agg.creator_handle}
                    {agg.platform ? ` · ${agg.platform.toUpperCase?.()}` : ""}
                  </div>
                  <div className="text-sm">Post: {agg.post_id || "s/d"}</div>
                  <div className="text-sm">Comentarios analizados: {safeTotal(agg.total_comments)}</div>

                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-semibold">Sentimiento</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="opacity-70">Positivos</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.positive)}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Neutros</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.neutral)}</div>
                      </div>
                      <div>
                        <div className="opacity-70">Negativos</div>
                        <div className="font-semibold">{formatPercent(agg.sentiment?.negative)}</div>
                      </div>
                    </div>
                  </div>

                  {Array.isArray(agg.keywords) && agg.keywords.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-semibold">Top palabras</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {agg.keywords.slice(0, 5).map((kw, i) => (
                          <li key={`${kw.keyword}-${i}`} className="flex items-baseline justify-between gap-2">
                            <span className="truncate">{kw.keyword}</span>
                            <span className="font-semibold">{formatPercent(kw.percentage ?? kw.porcentaje)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-3">
        {rows.map((r, i) => {
          const iso = toIso(r.ts);
          const when = iso ? new Date(iso).toLocaleString() : "";
          return (
            <div key={i} className="rounded-2xl p-4 shadow border">
              <div className="text-sm opacity-70">{when}</div>
              <div className="font-medium">@{r.creator_handle} · {r.platform?.toUpperCase?.()}</div>
              <div className="mt-2 whitespace-pre-wrap">{r.comment_text}</div>
              <div className="mt-1 text-sm opacity-70">
                {typeof r.likes === "number" ? `Likes: ${r.likes}` : null}
                {r.post_url ? <> · <a className="underline" href={r.post_url} target="_blank">Ver post</a></> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
