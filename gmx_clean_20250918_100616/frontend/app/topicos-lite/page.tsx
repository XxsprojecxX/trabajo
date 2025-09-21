 export const dynamic = "force-dynamic";

type Topico = {
  id: string;
  titulo: string;
  tema?: string;
  fecha?: string;
  creadora?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  url?: string;
  plataforma?: string;
};

async function getTopicos(): Promise<Topico[]> {
  const res = await fetch("http://localhost:3000/api/topicos?limit=20", { cache: "no-store" });
  if (!res.ok) throw new Error("No pude leer /api/topicos");
  const json = await res.json();

  const rows = json.rows ?? json.items ?? [];

  // 🔄 Normalizamos aquí los campos de la API a los del tipo Topico
  return rows.map((r: any) => ({
    id: String(r.id ?? ""),
    titulo: r.nombre ?? "(sin nombre)",
    tema: r.pilarAsociado || r.pilar || "",
    fecha: r.last_ts ? new Date(r.last_ts).toLocaleDateString("es-MX") : "",
    creadora: r.autor ?? "",
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    shares: r.shares ?? 0,
    url: r.url ?? "",
    plataforma: r.categoria ?? "IG",
  }));
}

export default async function Page() {
  const topicos = await getTopicos();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tópicos (LIVE desde BigQuery)</h1>
      <p className="text-sm opacity-70">Total: {topicos.length}</p>

      <div className="grid gap-4">
        {topicos.slice(0, 20).map((t) => (
          <article key={t.id} className="rounded-lg border p-4">
            <div className="text-sm opacity-60">{t.plataforma}</div>
            <h2 className="font-medium text-lg">{t.titulo}</h2>
            <div className="text-sm opacity-70">
              {t.creadora && <>Creadora: {t.creadora} · </>}
              {t.tema && <>Tema: {t.tema} · </>}
              {t.fecha && <>Fecha: {t.fecha}</>}
            </div>
            <div className="text-sm opacity-70">
              👍 {t.likes} · 💬 {t.comments} · 🔁 {t.shares}
            </div>
            {t.url && (
              <a href={t.url} target="_blank" className="text-blue-600 underline">
                Ver post
              </a>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
