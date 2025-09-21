// app/contenidos/page.tsx
export default function ContenidosPage() {
  // Placeholder visual. Después lo conectamos a BigQuery (piezas, formatos, KPIs).
  const contenidos = [
    { formato: "Podcast", kpi: "Retención", valor: 72 },
    { formato: "Tutorial largo", kpi: "Engagement", valor: 15 },
    { formato: "Stories interactivas", kpi: "Participación", valor: 28 },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Contenidos</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contenidos.map((c, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{c.formato}</div>
                  <div className="text-sm text-gray-600">{c.kpi}</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700
                                flex items-center justify-center font-bold">
                  {c.valor}%
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 h-2 rounded-full">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                     style={{ width: `${c.valor}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
