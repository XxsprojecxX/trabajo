 'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/** Mapea “colores lógicos” a clases Tailwind concretas (evita purge). */
const colorClasses = {
  pink:   { bgSoft: 'bg-pink-500/20',  border: 'border-pink-300',  text: 'text-pink-400' },
  blue:   { bgSoft: 'bg-blue-500/20',  border: 'border-blue-300',  text: 'text-blue-400' },
  purple: { bgSoft: 'bg-purple-500/20',border: 'border-purple-300',text: 'text-purple-400' },
  green:  { bgSoft: 'bg-green-500/20', border: 'border-green-300', text: 'text-green-400' },
  orange: { bgSoft: 'bg-orange-500/20',border: 'border-orange-300',text: 'text-orange-400' },
  teal:   { bgSoft: 'bg-teal-500/20',  border: 'border-teal-300',  text: 'text-teal-400' },
} as const;

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const ciudadesPrincipales = [
    { nombre: 'CDMX',        x: '45%', y: '65%', r: 4,  delay: '0s'   },
    { nombre: 'Guadalajara', x: '35%', y: '55%', r: 3,  delay: '0.5s' },
    { nombre: 'Monterrey',   x: '50%', y: '35%', r: 3,  delay: '1s'   },
    { nombre: 'Puebla',      x: '48%', y: '67%', r: 2,  delay: '1.5s' },
    { nombre: 'Tijuana',     x: '15%', y: '20%', r: 2,  delay: '2s'   },
    { nombre: 'Mérida',      x: '70%', y: '75%', r: 2,  delay: '2.5s' },
    { nombre: 'Cancún',      x: '75%', y: '65%', r: 2,  delay: '3s'   },
    { nombre: 'Oaxaca',      x: '50%', y: '80%', r: 2,  delay: '3.5s' },
  ];

  const conexionesNeuronales = [
    { from: { x: '20%', y: '30%' }, to: { x: '45%', y: '65%' }, delay: '0s' },
    { from: { x: '35%', y: '55%' }, to: { x: '50%', y: '35%' }, delay: '1s' },
    { from: { x: '45%', y: '65%' }, to: { x: '70%', y: '75%' }, delay: '2s' },
    { from: { x: '50%', y: '35%' }, to: { x: '75%', y: '65%' }, delay: '3s' },
    { from: { x: '15%', y: '20%' }, to: { x: '35%', y: '55%' }, delay: '4s' },
    { from: { x: '70%', y: '75%' }, to: { x: '50%', y: '80%' }, delay: '5s' },
  ];

  const elementos = [
    { icono: 'ri-heart-pulse-line', texto: 'Análisis Emocional', x: '85%', y: '20%', color: 'pink'   as const },
    { icono: 'ri-map-pin-line',     texto: 'Geolocalización',    x: '15%', y: '25%', color: 'blue'   as const },
    { icono: 'ri-group-line',       texto: 'Capital Social',     x: '80%', y: '80%', color: 'purple' as const },
    { icono: 'ri-brain-line',       texto: 'IA Avanzada',        x: '20%', y: '85%', color: 'green'  as const },
    { icono: 'ri-dna-line',         texto: 'ALMA Sistema',       x: '85%', y: '50%', color: 'orange' as const },
    { icono: 'ri-nodes-line',       texto: 'Red Neuronal',       x: '10%', y: '60%', color: 'teal'   as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ===== HERO ===== (SIN header aquí para no duplicar la barra global) */}
      <section
        className="relative min-h-[88vh] flex items-center bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,.85), rgba(30,41,59,.75)), url('https://readdy.ai/api/search-image?query=Abstract%20neural%20network%20visualization%20with%20maternal%20archetypal%20patterns%20flowing%20through%20interconnected%20nodes,%20emotional%20data%20streams%20in%20warm%20pink%20and%20purple%20gradients%20connecting%20to%20geographic%20Mexican%20territories,%20sophisticated%20AI%20analysis%20interface%20with%20floating%20holographic%20insights%20bubbles,%20maternal%20wisdom%20being%20digitally%20decoded%20into%20actionable%20intelligence,%20soft%20organic%20shapes%20representing%20authentic%20emotions%20merged%20with%20sharp%20analytical%20geometric%20patterns&width=1920&height=1080&seq=hero-maternal-ai&orientation=landscape')`,
        }}
      >
        {/* halo que sigue al mouse */}
        <div
          className="pointer-events-none fixed z-[1]"
          style={{
            left: mousePosition.x - 150,
            top: mousePosition.y - 150,
            width: 300,
            height: 300,
            borderRadius: '9999px',
            background:
              'radial-gradient(closest-side, rgba(99,102,241,0.25), rgba(99,102,241,0) 70%)',
            filter: 'blur(12px)',
          }}
        />

        {/* Contenido principal del hero */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-xl">
            Del Social Listening al
            <br />
            <span className="text-blue-200">Content Insight</span>
          </h1>
          <p className="mt-6 max-w-2xl text-slate-200 text-lg">
            Explora tópicos de conversación, analiza contenidos y obtén insights estratégicos con IA avanzada.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/topicos"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg"
            >
              <i className="ri-search-line" />
              Explorar Tópicos
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
            >
              <i className="ri-dashboard-3-line" />
              Ver Dashboard
            </Link>
          </div>
        </div>

        {/* Mapa de México (SVG) */}
        <div className="absolute top-10 right-10 w-96 h-64 opacity-40 pointer-events-none z-0">
          <svg viewBox="0 0 400 250" className="w-full h-full">
            <defs>
              <linearGradient id="mex" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
                <stop offset="100%" stopColor="rgba(147,197,253,0.6)" />
              </linearGradient>
            </defs>
            <path
              d="M50,120 Q80,100 120,105 Q160,110 200,95 Q240,80 280,85 Q320,90 350,100 Q380,110 390,130 Q385,150 370,170 Q350,190 320,200 Q280,210 240,205 Q200,200 160,195 Q120,190 80,180 Q50,160 45,140 Z"
              stroke="url(#mex)"
              strokeWidth="2"
              fill="rgba(59,130,246,0.1)"
              className="animate-slow-pulse"
            />
            {/* Conexiones animadas */}
            {conexionesNeuronales.map((c, i) => (
              <line
                key={`ln-${i}`}
                x1={Number(c.from.x.replace('%', '')) * 4}
                y1={Number(c.from.y.replace('%', '')) * 2.5}
                x2={Number(c.to.x.replace('%', '')) * 4}
                y2={Number(c.to.y.replace('%', '')) * 2.5}
                stroke="rgba(139,92,246,0.6)"
                strokeWidth="1"
                strokeDasharray="5,5"
                style={{ animationDelay: c.delay }}
                className="animate-pulse"
              />
            ))}
            {/* Ciudades */}
            {ciudadesPrincipales.map((ciudad) => (
              <g key={ciudad.nombre}>
                <circle
                  cx={Number(ciudad.x.replace('%', '')) * 4}
                  cy={Number(ciudad.y.replace('%', '')) * 2.5}
                  r={ciudad.r}
                  fill="#ec4899"
                  className="animate-ping"
                  style={{ animationDelay: ciudad.delay }}
                />
                <text
                  x={Number(ciudad.x.replace('%', '')) * 4 + 8}
                  y={Number(ciudad.y.replace('%', '')) * 2.5 + 2}
                  fill="rgba(255,255,255,0.85)"
                  fontSize="8"
                >
                  {ciudad.nombre}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Elementos interactivos flotantes */}
        {elementos.map((el) => {
          const cc = colorClasses[el.color];
          return (
            <div
              key={el.texto}
              className="absolute transition-transform duration-300 cursor-pointer z-10"
              style={{
                left: el.x,
                top: el.y,
                transform: hovered === el.texto ? 'scale(1.1)' : 'scale(1)',
              }}
              onMouseEnter={() => setHovered(el.texto)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`backdrop-blur-sm ${cc.bgSoft} ${cc.border} border rounded-full p-3 animate-float`}>
                <i className={`${el.icono} ${cc.text} text-xl`} />
              </div>
              {hovered === el.texto && (
                <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded px-2.5 py-1 text-xs text-white animate-fade-in">
                  {el.texto}
                </div>
              )}
            </div>
          );
        })}

        {/* Red neuronal de fondo (nodos grandes) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-20 left-20 w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full animate-pulse opacity-60 shadow-[0_0_40px] shadow-pink-500/40" />
          <div className="absolute top-40 right-32 w-8 h-8 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full animate-ping opacity-50 shadow-[0_0_40px] shadow-purple-500/40" />
          <div className="absolute bottom-32 left-32 w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse opacity-70 shadow-[0_0_40px] shadow-blue-500/40" />
          <div className="absolute bottom-20 right-20 w-7 h-7 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-60 shadow-[0_0_40px] shadow-green-500/40" />
        </div>

        {/* Animaciones del hero */}
        <style jsx>{`
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-fade-in { animation: fade-in 300ms ease forwards; }
          .animate-slow-pulse { animation: slow-pulse 3s ease-in-out infinite; }
          @keyframes float { 0%,100%{transform: translateY(0)} 50%{transform: translateY(-6px)} }
          @keyframes fade-in { from{opacity:0; transform: translateY(4px)} to{opacity:1; transform: translateY(0)} }
          @keyframes slow-pulse { 0%,100%{opacity:.7} 50%{opacity:1} }
        `}</style>
      </section>

      {/* ===== 4 PILARES ===== */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-gray-900">
          Cuatro Pilares de Análisis Inteligente
        </h2>
        <p className="mt-3 text-center text-gray-600 max-w-3xl mx-auto">
          Exploración, análisis, estrategia y optimización de creadoras en un flujo de trabajo intuitivo.
        </p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Tópicos de Conversación',
              desc: 'Descubre qué está diciendo la gente. Universos de conversación con sentimiento y oportunidades.',
              href: '/topicos',
              icon: 'ri-hashtag',
              tint: 'from-blue-50 to-indigo-50',
            },
            {
              title: 'Contenidos Propietarios',
              desc: 'Relaciona tópicos con tus contenidos y detecta vacíos u oportunidades por formato.',
              href: '/contenidos',
              icon: 'ri-movie-2-line',
              tint: 'from-indigo-50 to-purple-50',
            },
            {
              title: 'Banco de Insights Vivo',
              desc: 'Cerebro central que consolida y sugiere recomendaciones dinámicas.',
              href: '/insights',
              icon: 'ri-lightbulb-line',
              tint: 'from-purple-50 to-pink-50',
            },
            {
              title: 'Creadoras & Beats',
              desc: 'Rendimiento de creadoras y optimización de beats creativos bajo ALMA.',
              href: '/creadoras',
              icon: 'ri-user-star-line',
              tint: 'from-pink-50 to-rose-50',
            },
          ].map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className={`rounded-2xl border bg-gradient-to-br ${c.tint} p-6 hover:shadow-lg transition`}
            >
              <div className="w-12 h-12 rounded-xl bg-white grid place-items-center text-indigo-600 shadow">
                <i className={`${c.icon} text-xl`} />
              </div>
              <div className="mt-4 text-xl font-semibold text-gray-900">{c.title}</div>
              <p className="mt-2 text-gray-600 text-sm">{c.desc}</p>
              <div className="mt-4 text-indigo-600 text-sm font-medium">Ir ahora →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FLUJO ===== */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { n: 1, t: 'Explorar', d: 'Tópicos y universos con sentimiento.' },
            { n: 2, t: 'Analizar', d: 'Cruza tópicos con contenidos.' },
            { n: 3, t: 'Estrategia', d: 'Recibe recomendaciones de IA.' },
            { n: 4, t: 'Optimizar', d: 'Maximiza resonancia auténtica.' },
          ].map((s) => (
            <div key={s.n} className="bg-white border rounded-2xl p-6">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center font-bold">
                {s.n}
              </div>
              <div className="mt-4 font-semibold text-gray-900">{s.t}</div>
              <div className="text-gray-600 text-sm mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center text-white">
          <h3 className="text-3xl font-extrabold">Comienza tu Análisis de Contenido Hoy</h3>
          <p className="mt-2 text-blue-100">
            Descubre insights ocultos y optimiza tu estrategia con IA.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/insights" className="px-6 py-3 bg-white text-indigo-700 rounded-lg font-semibold">
              Empezar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 grid place-items-center">
              <i className="ri-brain-line text-white text-sm" />
            </div>
            <span>Content Insight</span>
          </div>
          <span className="text-sm">2024 · Potenciado por IA avanzada.</span>
        </div>
      </footer>
    </div>
  );
}