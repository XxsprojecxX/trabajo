// app/insights/page.tsx (conectado a /api/insights)
import Link from "next/link";

type Row = {
  post_id: string;
  account_id: string;
  nickname: string;
  followers: number | null;
  text: string | null;
  create_time: string | { value: string } | null;
  post_url: string | null;
  likes: number | null;
  comments_count: number | null;
  play_count: number | null;
  post_type: string | null;
  region: string | null;
  source: "instagram" | "tiktok";
  engagement_score_view?: number;
};

type InsightPayload = {
  summary: {
    total: number;
    bySource: Record<string, number>;
    latest_ts: string | { value: string } | null;
  };
  top: Row[];
};

function tsToISO(x: any): string | null {
  if (!x) return null;
  if (typeof x === "string") return x;
  if (typeof x === "object" && x.value) return String(x.value);
  return null;
}

async function getData(): Promise<InsightPayload> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${base}/api/insights?limit=200`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { summary: { total: 0, bySource: {}, latest_ts: null }, top: [] };
  }
  const json = await res.json();
  return json as InsightPayload;
}

export default async function InsightsPage() {
  const { summary, top } = await getData();
  const total = summary?.total ?? 0;
  const bySource = summary?.bySource ?? {};
  const fuentes = Object.keys(bySource).length;
  const latestISO = tsToISO(summary?.latest_ts);
  const latestFmt = latestISO ? new Date(latestISO).toLocaleString() : "—";

  const best = [...top].sort(
    (a, b) => (Number(b.engagement_score_view ?? 0) - Number(a.engagement_score_view ?? 0))
  );
  const mejorEng = best[0]?.engagement_score_view ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="ri-bar-chart-2-line text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-gray-600 hover:text-indigo-600">Inicio</Link>
            <span className="text-indigo-600 font-semibold">Insights</span>
            <Link href="/topicos" className="text-gray-600 hover:text-indigo-600">Tópicos</Link>
            <Link href="/contenidos" className="text-gray-600 hover:text-indigo-600">Contenidos</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Total posts</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-600">{total}</div>
              <i className="ri-file-list-2-line text-2xl text-indigo-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Fuentes</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">{fuentes}</div>
              <i className="ri-apps-2-line text-2xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Mejor engagement</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(Number(mejorEng)).toLocaleString()}
              </div>
              <i className="ri-rocket-2-line text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Última actualización</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-lg font-semibold text-emerald-600">{latestFmt}</div>
              <i className="ri-time-line text-2xl text-emerald-500"></i>
            </div>
          </div>
        </section>

        {/* Distribución por fuente */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Distribución por fuente</h2>
            <div className="text-sm text-gray-500">
              {Object.entries(bySource).map(([k, v]) => `${k}: ${v}`).join("  ·  ") || "—"}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(bySource).map(([src, cnt]) => (
              <div key={src} className="border rounded-lg p-4 bg-white">
                <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 inline-block">
                  {src}
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{cnt}</div>
                <div className="text-xs text-gray-500 mt-1">Posts</div>
              </div>
            ))}
          </div>
        </section>

        {/* Top 10 por engagement */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top 10 por engagement</h2>
            <div className="text-sm text-gray-500">Mostrando {Math.min(10, top.length)} de {top.length}</div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {best.slice(0, 10).map((r) => (
              <a
                key={r.post_id}
                href={r.post_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {r.source}
                  </div>
                  <div className="text-xs text-gray-500">ID: {r.post_id}</div>
                </div>

                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Creadora:</span> <span className="font-mono">{r.nickname}</span></div>
                  <div><span className="font-medium">Tipo:</span> {r.post_type ?? "—"}</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>❤️ {r.likes ?? 0}</div>
                  <div>💬 {r.comments_count ?? 0}</div>
                  <div>▶︎ {r.play_count ?? 0}</div>
                </div>

                <div className="mt-2 text-right text-indigo-600 text-sm font-semibold">
                  Score: {Math.round(Number(r.engagement_score_view ?? 0)).toLocaleString()}
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
