import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";

const VIEW_FQN = process.env.TOPICOS_VIEW_V2 || "gmx.vw_topicos_v2";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || "30")));
    const dryrun = searchParams.get("dryrun");

    if (dryrun) {
      return NextResponse.json({ ok: true, view: VIEW_FQN, note: "dryrun only" });
    }

    // contrato minimal requerido por /topicos
    const sql = `
      SELECT
        CAST(id AS STRING)         AS id,
        CAST(nombre AS STRING)     AS nombre,
        CAST(volumen AS INT64)     AS volumen,
        CAST(categoria AS STRING)  AS categoria,
        TIMESTAMP(last_ts)         AS last_ts
      FROM \`${VIEW_FQN}\`
      ORDER BY volumen DESC, last_ts DESC
      LIMIT ${limit}
    `;

    const rows = await runQuery(sql, { limit: { name: "limit", parameterType: { type: "INT64" }, parameterValue: { value: String(limit) } } });
    return NextResponse.json({ ok: true, view: VIEW_FQN, count: rows.length, items: rows });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
