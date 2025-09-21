'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

type Topico = {
  id_conversacion: string;
  titulo: string;
  url_post: string;
  sentimiento?: "positivo" | "negativo" | "neutral";
  volumen?: number;
};

export default function TopicosExplorer({ initialData }: { initialData: Topico[] }) {
  const [q, setQ] = useState("");
  const [sent, setSent] = useState<"todos" | "positivo" | "negativo" | "neutral">("todos");

  const data = useMemo(() => {
    const t = q.trim().toLowerCase();
    return initialData.filter((tpc) => {
      const matchTexto =
        !t ||
        tpc.titulo.toLowerCase().includes(t) ||
        tpc.id_conversacion.toLowerCase().includes(t);
      const matchSent = sent === "todos" || tpc.sentimiento === sent;
      return matchTexto && matchSent;
    });
  }, [q, sent, initialData]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar tópico por título o id…"
          className="flex-1 px-4 py-2 rounded-lg border outline-none focus:ring-2 ring-indigo-500"
        />
        <select
          value={sent}
          onChange={(e) => setSent(e.target.value as any)}
          className="px-4 py-2 rounded-lg border"
        >
          <option value="todos">Todos los sentimientos</option>
          <option value="positivo">Positivo</option>
          <option value="neutral">Neutral</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((t) => (
          <div
            key={t.id_conversacion}
            className="rounded-2xl border bg-white p-5 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t.titulo}</h3>
              <span
                className={
                  "text-xs px-2 py-1 rounded-full " +
                  (t.sentimiento === "positivo"
                    ? "bg-green-100 text-green-700"
                    : t.sentimiento === "negativo"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700")
                }
              >
                {t.sentimiento ?? "—"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">ID: {t.id_conversacion}</p>
            {typeof t.volumen === "number" && (
              <p className="text-sm text-gray-600">Volumen: {t.volumen}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              {/* Hacia el banco de insights con el tópico */}
              <Link
                href={`/insights?topic=${encodeURIComponent(t.id_conversacion)}`}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                Ver insights
              </Link>

              {/* Enlace de referencia (si es externo usar <a target="_blank">) */}
              <a
                href={t.url_post}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Fuente
              </a>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-sm text-gray-500">No hay resultados para tu búsqueda.</div>
      )}
    </div>
  );
}
