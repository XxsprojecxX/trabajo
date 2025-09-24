import { NextRequest } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import { aggregateMetricsFromRows } from "./metrics";

export const dynamic = "force-dynamic";

function getBQ() {
  return new BigQuery({
    projectId: process.env.GOOGLE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
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
    const metricsTable = process.env.COMMENTS_METRICS_TABLE_FQN;
    let aggregates: { by_post: any[]; by_creator: any[] } = { by_post: [], by_creator: [] };
    let shouldComputeFallback = true;

    if (metricsTable) {
      const metricsSql = `
        WITH ranked AS (
          SELECT
            aggregated_type,
            creator_handle,
            platform,
            post_id,
            aggregated_at,
            total_comments,
            keywords,
            sentiment,
            ROW_NUMBER() OVER (
              PARTITION BY aggregated_type, IFNULL(post_id, ''), creator_handle, platform
              ORDER BY aggregated_at DESC
            ) AS rn
          FROM \`${metricsTable}\`
          WHERE aggregated_type IN ('post', 'creator')
          ${creators.length ? "AND creator_handle IN UNNEST(@creators)" : ""}
        )
        SELECT aggregated_type, creator_handle, platform, post_id, aggregated_at, total_comments, keywords, sentiment
        FROM ranked
        WHERE rn = 1
      `;

      const metricOptions: any = {
        query: metricsSql,
        params: {
          creators: creators.length ? creators : undefined,
        },
      };

      try {
        const [metricRows] = await bq.query(metricOptions);
        if (Array.isArray(metricRows) && metricRows.length > 0) {
          aggregates = {
            by_post: metricRows.filter((row: any) => row.aggregated_type === "post"),
            by_creator: metricRows.filter((row: any) => row.aggregated_type === "creator"),
          };
          shouldComputeFallback = false;
        }
      } catch (metricError) {
        console.error("Error leyendo métricas agregadas", metricError);
      }
    }

    if (shouldComputeFallback) {
      aggregates = aggregateMetricsFromRows(Array.isArray(rows) ? rows : []);
    }

    return Response.json(
      { ok: true, count: rows.length, items: rows, aggregates },
      { status: 200 },
    );

  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || "unknown_error" }, { status: 500 });
  }
}