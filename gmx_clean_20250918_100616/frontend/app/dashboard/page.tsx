'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type InsightRow = {
  post_id: string;
  nickname: string;
  likes: number | null;
  comments_count: number | null;
  play_count: number | null;
  post_type: string | null;
  post_url: string | null;
  source: 'instagram' | 'tiktok';
  engagement_score_view?: number;
};
type InsightPayload = {
  summary: {
    total: number;
    bySource: Record<string, number>;
    latest_ts: string | { value: string } | null;
  };
  top: InsightRow[];
};

type ContenidoRow = {
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
  source: 'instagram' | 'tiktok';
};

type Topico = {
  id: string;
  nombre: string;
  volumen: number;
  oportunidad: number;
  categoria: string;
  pilarAsociado: string;
};

type CreadoraRow = {
  account_id: string;
  nickname: string;
  source: 'instagram' | 'tiktok';
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  plays: number;
  sample_post_url: string | null;
};

function tsToISO(x: any): string | null {
  if (!x) return null;
  if (typeof x === 'string') return x;
  if (typeof x === 'object' && x.value) return String(x.value);
  return null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightPayload | null>(null);
  const [contenidos, setContenidos] = useState<ContenidoRow[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [creadoras, setCreadoras] = useState<CreadoraRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [insRes, contRes, topRes, creRes] = await Promise.all([
          fetch(`${base}/api/insights?limit=200`, { cache: 'no-store' }),
          fetch(`${base}/api/contenidos?limit=400`, { cache: 'no-store' }),
          fetch(`${base}/api/topicos?sinceDays=30&limit=200`, { cache: 'no-store' }),
          fetch(`${base}/api/creadoras?limit=20`, { cache: 'no-store' }),
        ]);

        const insJson = insRes.ok ? await insRes.json() : null;
        const contJson = contRes.ok ? await contRes.json() : null;
        const topJson = topRes.ok ? await topRes.json() : null;
        const creJson = creRes.ok ? await creRes.json() : null;

        if (insJson) setInsights(insJson as InsightPayload);
        if (contJson?.rows) setContenidos(contJson.rows as ContenidoRow[]);
        if (topJson?.rows) setTopicos(topJson.rows as Topico[]);
        if (creJson?.rows) setCreadoras(creJson.rows as CreadoraRow[]);
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPIs
  const totalPosts = insights?.summary?.total ?? 0;
  const fuentes = Object.keys(insights?.summary?.bySource ?? {}).length;

  const totalLikes = useMemo(() => {
    return contenidos.reduce((acc, r) => acc + Number(r.likes ?? 0), 0);
  }, [contenidos]);

  const totalComments = useMemo(() => {
    return contenidos.reduce((acc, r) => acc + Number(r.comments_count ?? 0), 0);
  }, [contenidos]);

  const latestISO = tsToISO(insights?.summary?.latest_ts);
  const latestFmt = latestISO ? new Date(latestISO).toLocaleString() : '—';

  // Listas para tarjetas
  const topTopicos = useMemo(() => {
    // ordena por oportunidad desc, empate por volumen desc
    const arr = [...topicos].sort((a, b) => {
      if (b.oportunidad !== a.oportunidad) return b.oportunidad - a.oportunidad;
      return (b.volumen ?? 0) - (a.volumen ?? 0);
    });
    return arr.slice(0, 6);
  }, [topicos]);

  const topPostsByComments = useMemo(() => {
    const arr = [...contenidos].sort(
      (a, b) => Number(b.comments_count ?? 0) - Number(a.comments_count ?? 0)
    );
    return arr.slice(0, 6);
  }, [contenidos]);

  const topCreadoras = useMemo(() => {
    const arr = [...creadoras].sort(
      (a, b) => Number(b.comments ?? 0) - Number(a.comments ?? 0)
    );
    return arr.slice(0, 5);
  }, [creadoras]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="ri-dashboard-2-line text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-indigo-600 font-semibold">Inicio</span>
            <Link href="/insights" className="text-gray-600 hover:text-indigo-600">Insights</Link>
            <Link href="/topicos" className="text-gray-600 hover:text-indigo-600">Tópicos</Link>
            <Link href="/contenidos" className="text-gray-600 hover:text-indigo-600">Contenidos</Link>
            <Link href="/creadoras" className="text-gray-600 hover:text-indigo-600">Creadoras</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error cargando datos: {error}
          </div>
        ) : null}

        {/* KPIs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Total posts</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-indigo-600">
                {loading ? '—' : totalPosts}
              </div>
              <i className="ri-file-list-2-line text-2xl text-indigo-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Fuentes</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {loading ? '—' : fuentes}
              </div>
              <i className="ri-apps-2-line text-2xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Comentarios totales</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {loading ? '—' : totalComments.toLocaleString()}
              </div>
              <i className="ri-message-3-line text-2xl text-purple-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border">
            <div className="text-sm text-gray-600">Likes totales</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-600">
                {loading ? '—' : totalLikes.toLocaleString()}
              </div>
              <i className="ri-heart-3-line text-2xl text-pink-500"></i>
            </div>
          </div>
        </section>

        {/* Última actualización */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Última actualización
            </h2>
            <div className="text-emerald-600 font-medium">
              {loading ? '—' : latestFmt}
            </div>
          </div>
        </section>

        {/* Top tópicos (oportunidad) */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top tópicos (oportunidad)</h2>
            <Link href="/topicos" className="text-sm text-indigo-600 hover:underline">Ver todos</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topTopicos.map(t => (
              <div key={t.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{t.nombre}</div>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {t.categoria || 'General'}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm text-gray-700">
                  <div>🎯 Oport: <span className="font-semibold">{t.oportunidad}</span></div>
                  <div>📊 Vol: <span className="font-semibold">{t.volumen}</span></div>
                  <div>🏛 Pilar: <span className="font-semibold">{t.pilarAsociado}</span></div>
                </div>
              </div>
            ))}
            {!loading && topTopicos.length === 0 && (
              <div className="text-gray-500">Sin datos.</div>
            )}
          </div>
        </section>

        {/* Top contenidos por comentarios */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top contenidos por comentarios</h2>
            <Link href="/contenidos" className="text-sm text-indigo-600 hover:underline">Ver todos</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPostsByComments.map((c) => (
              <a
                key={c.post_id}
                href={c.post_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {c.source}
                  </div>
                  <div className="text-xs text-gray-500">ID: {c.post_id}</div>
                </div>
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Creadora:</span> <span className="font-mono">{c.nickname}</span></div>
                  <div><span className="font-medium">Tipo:</span> {c.post_type ?? '—'}</div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div>❤️ {c.likes ?? 0}</div>
                  <div>💬 {c.comments_count ?? 0}</div>
                  <div>▶︎ {c.play_count ?? 0}</div>
                </div>
              </a>
            ))}
            {!loading && topPostsByComments.length === 0 && (
              <div className="text-gray-500">Sin datos.</div>
            )}
          </div>
        </section>

        {/* Top creadoras */}
        <section className="bg-white border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top creadoras (por comentarios)</h2>
            <Link href="/creadoras" className="text-sm text-indigo-600 hover:underline">Ver todas</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCreadoras.map((p) => (
              <a
                key={p.account_id}
                href={p.sample_post_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{p.nickname}</div>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {p.source}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>👥 {p.followers?.toLocaleString?.() ?? p.followers}</div>
                  <div>❤️ {p.likes?.toLocaleString?.() ?? p.likes}</div>
                  <div>💬 {p.comments?.toLocaleString?.() ?? p.comments}</div>
                  <div>▶︎ {p.plays?.toLocaleString?.() ?? p.plays}</div>
                </div>
              </a>
            ))}
            {!loading && topCreadoras.length === 0 && (
              <div className="text-gray-500">Sin datos.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
