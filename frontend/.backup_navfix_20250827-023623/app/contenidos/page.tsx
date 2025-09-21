// app/contenidos/page.tsx
import Link from "next/link";

type Contenido = {
  id_conversacion: string;
  url_post: string;
  plataforma: string;
  emocion_dominante: string | null;
  simbolismo_dominante: string | null;
  comentarios_analizados: number;
};

async function getData(): Promise<Contenido[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/contenidos`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data ?? []) as Contenido[];
}

export default async function ContenidosPage() {
  const data = await getData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple con navegación */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="ri-play-circle-line text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Contenidos</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-indigo-600">Inicio</Link>
            <Link href="/insights" className="text-gray-600 hover:text-indigo-600">Insights</Link>
            <Link href="/topicos" className="text-gray-600 hover:text-indigo-600">Tópicos</Link>
            <span className="text-indigo-600 font-semibold">Contenidos</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Resumen */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Total contenidos</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-600">{data.length}</div>
              <i className="ri-folder-video-line text-2xl text-indigo-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Con &gt;100 comentarios</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {data.filter(d => d.comentarios_analizados > 100).length}
              </div>
              <i className="ri-discuss-line text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Con emoción detectada</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-600">
                {data.filter(d => d.emocion_dominante).length}
              </div>
              <i className="ri-emotion-line text-2xl text-pink-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Plataformas</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {new Set(data.map(d => d.plataforma)).size}
              </div>
              <i className="ri-apps-2-line text-2xl text-blue-500"></i>
            </div>
          </div>
        </section>

        {/* Cards de contenidos */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top contenidos por comentarios</h2>
            <div className="text-sm text-gray-500">Mostrando {Math.min(50, data.length)} de {data.length}</div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.slice(0, 50).map((c) => (
              <a
                key={c.id_conversacion}
                href={c.url_post || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {c.plataforma}
                  </div>
                  <div className="text-xs text-gray-500">ID: {c.id_conversacion}</div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <div className="text-gray-700">
                      <span className="font-medium">Emoción:</span>{" "}
                      <span className="font-mono">{c.emocion_dominante ?? "N/A"}</span>
                    </div>
                    <div className="text-gray-700">
                      <span className="font-medium">Simbolismo:</span>{" "}
                      <span className="font-mono">{c.simbolismo_dominante ?? "N/A"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Comentarios</div>
                    <div className="text-lg font-bold text-indigo-600">{c.comentarios_analizados}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 