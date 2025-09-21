// app/api/topicos/route.ts — versión estable sin JOIN (dominio gmx), sin “ALMA”
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

type Intensidad = 'alta' | 'media' | 'baja';

interface Topico {
  id: string;
  nombre: string;
  volumen: number;
  sentimiento: { positivo: number; neutral: number; negativo: number };
  emociones: {
    alegria: number; enojo: number; sorpresa: number; miedo: number; tristeza: number;
    nostalgia: number; ternura: number; orgullo: number; estres: number; culpa: number; cansancio: number;
  };
  engagement: number;
  oportunidad: number;
  x: number; y: number;
  conexiones: string[];
  categoria: string;
  ejesDetectados: string[];
  pilarAsociado: string;
  capitalSimbolicoDetectado: string[];
  nseInferido: string;
  contextoTerritorial: string;
  estadosResonancia: Array<{ estado: string; porcentaje: number; intensidad: Intensidad }>;
}

function normalizePilar(p: any): string {
  if (!p || typeof p !== 'string') return '';
  const k = p.trim().toLowerCase();
  if (k === 'dairy of real moms')   return 'Dairy of Real Moms';
  if (k === 'recipes that hug')     return 'Recipes that Hug';
  if (k === 'real family moments')  return 'Real Family Moments';
  if (k === 'authentic treats')     return 'Authentic Treats';
  return ''; // nunca “ALMA”
}

function mapRowToTopico(r: any, i: number): Topico {
  const likes = Number(r.likes ?? r.like_count ?? 0);
  const comments = Number(r.comments_count ?? r.comment_count ?? 0);
  const volumen = likes + 3 * comments;

  const pos = Math.min(95, Math.round(50 + likes * 0.0001));
  const neg = Math.max(0, 100 - pos - 25);
  const neu = Math.max(0, 100 - pos - neg);

  // pilar_normalizado viene NULL aquí; dejamos vacío (sin inventar)
  const pilar = normalizePilar(r.pilar_normalizado ?? r.pilarAsociado ?? r.pilar ?? '');

  return {
    id: String(r.post_id ?? r.id ?? `post-${i}`),
    nombre: String(r.text ?? r.caption ?? 'Tópico'),
    volumen,
    sentimiento: { positivo: pos, neutral: neu, negativo: neg },
    emociones: {
      alegria: 0, enojo: 0, sorpresa: 0, miedo: 0, tristeza: 0,
      nostalgia: 0, ternura: 0, orgullo: 0, estres: 0, culpa: 0, cansancio: 0,
    },
    engagement: Number((likes + comments) / 1000),
    oportunidad: 90 + ((i * 3) % 10),
    x: 200 + ((i * 120) % 600),
    y: 160 + ((i * 90) % 300),
    conexiones: [],
    categoria: String(r.source ?? 'General'),
    ejesDetectados: [],
    pilarAsociado: pilar, // '' si no hay dato
    capitalSimbolicoDetectado: [],
    nseInferido: 'Mixto',
    contextoTerritorial: String(r.region ?? 'Mixto'),
    estadosResonancia: [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('debug') === '1') {
      return NextResponse.json({ ok: true, route: '/api/topicos' }, { status: 200 });
    }

    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200);

    const { BigQuery } = await import('@google-cloud/bigquery');
    const bq = new BigQuery({
      projectId: 'galletas-piloto-ju-250726',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    });

    const query = `
      SELECT
        post_id,
        text,
        create_time,
        post_url,
        likes,
        comments_count,
        play_count,
        CAST(region AS STRING) AS region,
        source,
        NULL AS pilar_normalizado
      FROM \`galletas-piloto-ju-250726.gmx.vw_social_post_dashboard\`
      ORDER BY create_time DESC
      LIMIT @lim
    `;

    const [rows] = await bq.query({ query, params: { lim: limit }, location: 'US' });
    const data: Topico[] = rows.map((r: any, i: number) => mapRowToTopico(r, i));
    return NextResponse.json({ count: data.length, rows: data }, { status: 200 });

  } catch (e: any) {
    console.error('GMX /api/topicos error:', e?.stack || e);
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
