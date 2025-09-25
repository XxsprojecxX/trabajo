"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const links: NavLink[] = [
  { href: "/", label: "Inicio", icon: "ri-home-5-line" },
  { href: "/topicos", label: "Tópicos", icon: "ri-bubble-chart-line" },
  { href: "/contenidos", label: "Contenidos", icon: "ri-play-list-line" },
  { href: "/creadoras", label: "Creadoras", icon: "ri-women-line" },
  { href: "/dashboard", label: "Dashboard", icon: "ri-dashboard-3-line" },
  { href: "/insights", label: "Insights", icon: "ri-lightbulb-line" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-800 transition hover:text-indigo-600"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
            <i className="ri-brain-line text-xl" aria-hidden />
          </span>
          ALMA Insights
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-3 py-2 transition-all ${
                  active
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-indigo-600"
                }`}
              >
                <i className={`${link.icon} text-base`} aria-hidden />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-700"
          >
            <i className="ri-pulse-line text-base" aria-hidden />
            Panel Vivo
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Abrir menú de navegación"
        >
          <i className={mobileOpen ? "ri-close-line text-2xl" : "ri-menu-line text-2xl"} aria-hidden />
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-200/70 bg-white/95 px-4 pb-4 pt-2 shadow-sm md:hidden">
          <ul className="flex flex-col gap-2">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-100/70 hover:text-indigo-600"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <i className={`${link.icon} text-base`} aria-hidden />
                      {link.label}
                    </span>
                    {active && <i className="ri-arrow-right-up-line" aria-hidden />}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110"
                onClick={() => setMobileOpen(false)}
              >
                <i className="ri-pulse-line text-base" aria-hidden />
                Ir al Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}