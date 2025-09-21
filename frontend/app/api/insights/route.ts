// app/api/insights/route.ts (BigQuery + SA)
import { NextResponse, NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

type Row = {
  post_id: string;
  account_id: string;
  nickname: string;
  followers: number | null;
  text: string | null;
  create_time: string;
  post_url: string | null;
  likes: number | null;
  comments_count: number | null;
  play_count: number | null;
  post_type: string | null;
  region: string | null;
  source: 'instagram' | 'tiktok';
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);

    const bq = new BigQuery({
      projectId: 'galletas-piloto-ju-250726',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    });

    const query = `
      SELECT
        post_id, account_id, nickname, followers,
        text, create_time, post_url,
        likes, comments_count, play_count,
        post_type, CAST(region AS STRING) AS region, source
      FROM \`galletas-piloto-ju-250726.gmx.vw_social_post_dashboard\`
      ORDER BY create_time DESC
      LIMIT @lim
    `;

    const [rows] = await bq.query({ query, params: { lim: limit }, location: 'US' });
    const data = rows as Row[];

    const total = data.length;
    const bySource = data.reduce((acc: Record<string, number>, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1;
      return acc;
    }, {});

    const scored = data.map((r) => ({
      ...r,
      engagement_score_view:
        (Number(r.likes ?? 0) +
          3 * Number(r.comments_count ?? 0) +
          Number(r.play_count ?? 0) / 100) || 0,
    }));
    scored.sort((a, b) => (b.engagement_score_view ?? 0) - (a.engagement_score_view ?? 0));

    return NextResponse.json(
      {
        summary: { total, bySource, latest_ts: data[0]?.create_time ?? null },
        top: scored.slice(0, 10),
      },
      { status: 200 },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 200 });
  }
}
