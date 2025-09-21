import { NextRequest } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

export const dynamic = "force-dynamic";

function getBQ() {
  return new BigQuery({
    projectId: process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
    // GOOGLE_APPLICATION_CREDENTIALS ya está en el .env.local con ruta absoluta
    location: process.env.BQ_LOCATION || "US",
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const creatorsParam = url.searchParams.get("creators") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "30", 10), 200);

    const creators = creatorsParam
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const viewFQN = process.env.COMMENTS_VIEW_FQN || "galletas-piloto-ju-250726.gmx_week_2025_09_04_2025_09_11.vw_comments_app_api";

    const bq = getBQ();

    // Consulta parametrizada
    const sql = `
      SELECT creator_handle, platform, post_id, post_url, profile_url, comment_id, comment_text, ts, likes
      FROM \`${viewFQN}\`
      ${creators.length ? "WHERE creator_handle IN UNNEST(@creators)" : ""}
      ORDER BY ts DESC
      LIMIT @limit
    `;

    const options: any = {
      query: sql,
      params: {
        creators: creators.length ? creators : undefined,
        limit,
      },
    };

    const [rows] = await bq.query(options);
    return Response.json({ ok: true, count: rows.length, items: rows }, { status: 200 });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || "unknown_error" }, { status: 500 });
  }
}
