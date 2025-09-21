'use client';

export type Analisis = {
  id_conversacion: string;
  post_url: string;
  analisis_fuente_principal?: {
    emociones?: { emocion_dominante?: string };
    simbolismos?: { simbolismo_dominante?: string };
  };
  metadata_procesamiento?: { comentarios_analizados?: number | string };
};

export default function BigQueryStrip({ resultados }: { resultados: Analisis[] }) {
  const emociónCls = (e?: string) => {
    const k = (e ?? '').toLowerCase();
    if (k === 'positivo') return 'bg-green-100 text-green-800 ring-1 ring-green-200';
    if (k === 'negativo') return 'bg-red-100 text-red-800 ring-1 ring-red-200';
    if (k === 'neutral')  return 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
    return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200';
  };

  const cardGrad = (s?: string) => {
    const k = (s ?? '').toLowerCase();
    const base = 'bg-gradient-to-br border';
    if (k === 'consejo')  return `${base} from-indigo-50 to-indigo-100 border-indigo-100`;
    if (k === 'familia')  return `${base} from-amber-50 to-amber-100 border-amber-100`;
    if (k === 'comunidad')return `${base} from-emerald-50 to-emerald-100 border-emerald-100`;
    return `${base} from-slate-50 to-slate-100 border-slate-100`;
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Insights desde BigQuery</h2>
      <p className="text-sm text-gray-500 mb-4">
        {resultados.length} registros | Fuente: /api/insights
      </p>

      {resultados.length === 0 ? (
        <div className="rounded-xl border p-6 text-gray-600 bg-white">
          No hay datos disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resultados.map((row) => {
            const emocion = row.analisis_fuente_principal?.emociones?.emocion_dominante ?? '—';
            const simbolismo = row.analisis_fuente_principal?.simbolismos?.simbolismo_dominante ?? '—';
            const comentarios = Number(row.metadata_procesamiento?.comentarios_analizados ?? 0);

            return (
              <article
                key={`${row.id_conversacion}-${row.post_url}`}
                className={`rounded-2xl ${cardGrad(simbolismo)} p-5 shadow-sm hover:shadow-md transition`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-bold leading-tight">{row.id_conversacion}</h3>
                  <a
                    href={row.post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline"
                    title="Ver post original"
                  >
                    Ver Post ↗
                  </a>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${emociónCls(emocion)}`}>
                    <span className="inline-block h-2 w-2 rounded-full bg-current opacity-60" />
                    Emoción: <span className="capitalize">{emocion}</span>
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-800 ring-1 ring-violet-200">
                    <span className="inline-block h-2 w-2 rounded-full bg-current opacity-60" />
                    Simbolismo: <span className="capitalize">{simbolismo}</span>
                  </span>
                </div>

                <div className="rounded-lg bg-white/70 backdrop-blur-sm border border-white p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Comentarios</dt>
                      <dd className="text-lg font-bold">{isNaN(comentarios) ? '—' : comentarios.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">ID Conversación</dt>
                      <dd className="font-medium truncate">{row.id_conversacion}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}