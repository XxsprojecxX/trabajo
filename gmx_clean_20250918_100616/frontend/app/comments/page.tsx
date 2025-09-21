"use client";
import { useEffect, useState } from "react";

type Row = {
  creator_handle: string;
  platform: string;
  comment_text: string;
  ts: string | { value: string };
  post_url?: string;
  likes?: number;
};

function tsToIso(ts: Row["ts"]) {
  if (!ts) return "";
  if (typeof ts === "string") return ts;
  if (typeof ts === "object" && "value" in ts) return String(ts.value);
  return "";
}

export default function CommentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const creators = ["papa.de.cuatro", "giannacristante", "mamiabordo"].join(",");

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/comments/v1?creators=${creators}&limit=60`, { cache: "no-store" });
        const json = await res.json();
        setRows(Array.isArray(json.items) ? json.items : []);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Comentarios (semana 04–11 Sep)</h1>
      {loading && <div>Cargando…</div>}
      {!loading && rows.length === 0 && <div>Sin comentarios</div>}

      <div className="grid gap-3">
        {rows.map((r, i) => {
          const iso = tsToIso(r.ts);
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
