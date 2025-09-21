import Link from "next/link";

type Topico = {
  id_conversacion: string;
  url_post: string;
  emocion_dominante: string | null;
  simbolismo_dominante: string | null;
  comentarios_analizados: number;
};

async function getData(): Promise<Topico[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/topicos`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data ?? []) as Topico[];
}

export default async function TopicosPage() {
  const data = await getData();
  const total = data.length;
  const top5 = data.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <i className="ri-database-2-line text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tópicos</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Inicio</Link>
            <Link href="/insights" className="text-gray-600 hover:text-blue-600">Insights</Link>
            <span className="text-blue-600 font-semibold">Tópicos</span>
            <Link href="/contenidos" className="text-gray-600 hover:text-blue-600">Contenidos</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Resumen */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Registros</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">{total}</div>
              <i className="ri-database-line text-2xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Con emoción</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-600">
                {data.filter(d => d.emocion_dominante).length}
              </div>
              <i className="ri-emotion-line text-2xl text-pink-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Con simbolismo</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {data.filter(d => d.simbolismo_dominante).length}
              </div>
              <i className="ri-shape-2-line text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Suma comentarios</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-emerald-600">
                {data.reduce((acc, d) => acc + (d.comentarios_analizados || 0), 0).toLocaleString()}
              </div>
              <i className="ri-chat-3-line text-2xl text-emerald-500"></i>
            </div>
          </div>
        </section>

        {/* Top 5 tarjetas */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="ri-medal-2-line text-yellow-500 mr-2"></i>
            Top 5 por volumen
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {top5.map((t) => (
              <div key={t.url_post} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900 truncate max-w-[70%]">
                    {t.id_conversacion || "sin_id"}
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {t.comentarios_analizados.toLocaleString()} com.
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Emoción:{" "}
                  <span className="font-medium text-pink-600">{t.emocion_dominante ?? "N/A"}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  Simbolismo:{" "}
                  <span className="font-medium text-purple-600">{t.simbolismo_dominante ?? "N/A"}</span>
                </div>
                <a
                  href={t.url_post}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver post original
                </a>
              </div>
            ))}
            {top5.length === 0 && (
              <div className="text-gray-600">No hay datos para mostrar aún.</div>
            )}
          </div>
        </section>

        {/* Tabla completa */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="ri-table-line text-blue-500 mr-2"></i>
            Todas las filas (máx 1000)
          </h2>

          <div className="overflow-auto bg-white border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">ID Conversación</th>
                  <th className="text-left px-4 py-2 font-medium">URL</th>
                  <th className="text-left px-4 py-2 font-medium">Emoción</th>
                  <th className="text-left px-4 py-2 font-medium">Simbolismo</th>
                  <th className="text-right px-4 py-2 font-medium">Comentarios</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.url_post} className="border-t">
                    <td className="px-4 py-2 font-mono">{t.id_conversacion || "—"}</td>
                    <td className="px-4 py-2 max-w-[420px] truncate">
                      <a href={t.url_post} className="text-blue-600 hover:underline" target="_blank">
                        {t.url_post}
                      </a>
                    </td>
                    <td className="px-4 py-2">{t.emocion_dominante ?? "N/A"}</td>
                    <td className="px-4 py-2">{t.simbolismo_dominante ?? "N/A"}</td>
                    <td className="px-4 py-2 text-right">{t.comentarios_analizados}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
                      Sin resultados. Revisa permisos/consulta de BigQuery.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
