export const dynamic = 'force-dynamic';

async function getJSON<T>(path: string): Promise<T> {
  // En RSC se puede usar fetch relativo y desactivar cache:
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

export async function getTopicos() {
  const data = await getJSON<{ rows: any[] }>('/api/topicos');
  return data.rows ?? [];
}

export async function getContenidos() {
  const data = await getJSON<{ rows: any[] }>('/api/contenidos');
  return data.rows ?? [];
}

export async function getInsights() {
  return getJSON<any>('/api/insights');
}
