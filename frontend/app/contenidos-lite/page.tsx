export const dynamic = "force-dynamic";

type Row = Record<string, any>;

async function getRows(): Promise<Row[]> {
  const res = await fetch('/api/contenidos', { cache: 'no-store' });
  if (!res.ok) throw new Error('No pude leer /api/contenidos');
  const json = await res.json();
  return json.rows ?? [];
}

export default async function Page() {
  const rows = await getRows();

  const safe = (r: Row, ...keys: string[]) =>
    keys.reduce<any>((acc, k) => acc ?? r[k], undefined) ?? '';

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Contenidos (LIVE desde Google Sheets)</h1>
      <p className="text-sm opacity-70">Total: {rows.length}</p>

      <div className="grid gap-4">
        {rows.slice(0, 20).map((r, i) => (
          <article key={i} className="rounded-lg border p-4">
            <div className="text-sm opacity-60">{safe(r, 'platform', 'plataforma') || 'IG'}</div>
            <h2 className="font-medium text-lg">
              {safe(r, 'caption', 'titulo', 'title', 'text') || '(sin título)'}
            </h2>
            <div className="text-sm opacity-70">
              @{safe(r, 'creator_username', 'creadora', 'author', 'user')}
            </div>
            <div className="text-sm opacity-70">
              👍 {Number(safe(r, 'like_count', 'likes') || 0)} · 💬 {Number(safe(r, 'comment_count', 'comments') || 0)}
            </div>
            {safe(r, 'post_url', 'url', 'permalink') && (
              <a href={safe(r, 'post_url', 'url', 'permalink')} target="_blank" className="text-blue-600 underline">
                Ver post
              </a>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
