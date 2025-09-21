'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg grid place-items-center">
            <i className="ri-brain-line text-white text-xl" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Content Insight</h1>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[15px]">
          <Link href="/"           className="text-gray-600 hover:text-blue-600">Inicio</Link>
          <Link href="/insights"   className="text-gray-600 hover:text-blue-600">Insights</Link>
          <Link href="/topicos"    className="text-gray-600 hover:text-blue-600">Tópicos</Link>
          <Link href="/contenidos" className="text-gray-600 hover:text-blue-600">Contenidos</Link>
          <Link href="/creadoras"  className="text-gray-600 hover:text-blue-600">Creadoras</Link>
        </nav>
      </div>
    </header>
  );
} 