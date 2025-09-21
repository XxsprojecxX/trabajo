// app/creadoras/page.tsx
import Link from "next/link";

type Creadora = {
  account_id: string;
  nickname: string | null;
  source: 'instagram' | 'tiktok';
  followers: number | null;
  posts: number;
  likes: number | null;
  comments: number | null;
  plays: number | null;
  sample_post_url: string | null;
};

async function getData(): Promise<Creadora[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res  = await fetch(`${base}/api/creadoras?limit=60`, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.rows ?? []) as Creadora[];
}

export default async function CreadorasPage() {
  const data = await getData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="ri-user-star-line text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Creadoras</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-indigo-600">Inicio</Link>
            <Link href="/insights" className="text-gray-600 hover:text-indigo-600">Insights</Link>
            <Link href="/topicos" className="text-gray-600 hover:text-indigo-600">Tópicos</Link>
            <Link href="/contenidos" className="text-gray-600 hover:text-indigo-600">Contenidos</Link>
            <span className="text-indigo-600 font-semibold">Creadoras</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Total creadoras</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-600">{data.length}</div>
              <i className="ri-team-line text-2xl text-indigo-500"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Plataformas</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {new Set(data.map(d => d.source)).size}
              </div>
              <i className="ri-apps-2-line text-2xl text-blue-500"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Comentarios totales</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {data.reduce((s, d) => s + Number(d.comments ?? 0), 0).toLocaleString()}
              </div>
              <i className="ri-chat-3-line text-2xl text-purple-500"></i>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Likes totales</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-600">
                {data.reduce((s, d) => s + Number(d.likes ?? 0), 0).toLocaleString()}
              </div>
              <i className="ri-heart-3-line text-2xl text-pink-500"></i>
            </div>
          </div>
        </section>

        {/* Grid de creadoras */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Creadoras</h2>
            <div className="text-sm text-gray-500">Mostrando {Math.min(60, data.length)} de {data.length}</div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.slice(0, 60).map((c) => (
              <a
                key={c.account_id}
                href={c.sample_post_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 bg-white hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {c.source}
                  </div>
                  <div className="text-xs text-gray-500">ID: {c.account_id}</div>
                </div>

                <div className="text-gray-800">
                  <div className="font-semibold text-sm">{c.nickname ?? '—'}</div>
                  <div className="text-xs text-gray-500">
                    Followers: {Number(c.followers ?? 0).toLocaleString()}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>📄 {c.posts}</div>
                  <div>❤️ {Number(c.likes ?? 0).toLocaleString()}</div>
                  <div>💬 {Number(c.comments ?? 0).toLocaleString()}</div>
                  <div>▶︎ {Number(c.plays ?? 0).toLocaleString()}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
