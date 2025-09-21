import { NextResponse } from "next/server";
import { dryRunBQ } from "@/lib/bigquery";

export async function GET() {
  const required = ["GOOGLE_PROJECT_ID", "GOOGLE_DATASET", "GOOGLE_TABLE"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    return NextResponse.json(
      { ok: false, error: `Faltan variables: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const out = await dryRunBQ();
    return NextResponse.json({
      ok: true,
      ping: out,
      info: {
        projectId: process.env.GOOGLE_PROJECT_ID,
        dataset: process.env.GOOGLE_DATASET,
        table: process.env.GOOGLE_TABLE,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
