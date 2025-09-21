import { NextResponse, NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'node:fs';

type EnvCreds = {
  BIGQUERY_PROJECT_ID?: string;
  BIGQUERY_SERVICE_ACCOUNT_JSON?: string;
  BIGQUERY_SERVICE_ACCOUNT_BASE64?: string;
  CONTENIDOS_VIEW?: 'v1'|'v2';
  CONTENIDOS_VIEW_V1_FQN?: string;
  CONTENIDOS_VIEW_V2_FQN?: string;
};

function log(msg: string, meta: Record<string, unknown> = {}) {
  try { fs.appendFileSync('/tmp/next.out', `[${new Date().toISOString()}] /api/contenidos ${msg} ${JSON.stringify(meta)}\n`); } catch {}
}

function getClient(env: EnvCreds) {
  const projectId = env.BIGQUERY_PROJECT_ID;
  const jsonRaw = env.BIGQUERY_SERVICE_ACCOUNT_JSON;
  const b64 = env.BIGQUERY_SERVICE_ACCOUNT_BASE64;

  if (!projectId && !jsonRaw && !b64) {
    return new BigQuery(); // Permite dryrun sin creds; fallará sólo si consultamos
  }
  if (jsonRaw || b64) {
    const jsonStr = jsonRaw ? jsonRaw : Buffer.from(b64!, 'base64').toString('utf8');
    let parsed: any;
    try { parsed = JSON.parse(jsonStr); } catch { throw new Error("CREDENCIAL_INVALIDA: JSON/BASE64"); }
    const { client_email, private_key } = parsed || {};
    if (!client_email || !private_key) throw new Error("CREDENCIAL_INCOMPLETA: client_email/private_key");
    return new BigQuery({ projectId, credentials: { client_email, private_key } });
  }
  return new BigQuery({ projectId }); // ADC con projectId
}

function resolveView(env: EnvCreds) {
  const flag = (env.CONTENIDOS_VIEW ?? 'v1').toLowerCase();
  const v1 = env.CONTENIDOS_VIEW_V1_FQN;
  const v2 = env.CONTENIDOS_VIEW_V2_FQN || v1;
  const chosen = flag === 'v2' ? v2 : v1;
  if (!chosen) throw new Error("VIEW_NO_CONFIGURADA: define CONTENIDOS_VIEW_V1_FQN en .env.local");
  return { active: flag === 'v2' ? 'v2' : 'v1', viewFqn: chosen };
}

export async function GET(req: NextRequest) {
  const env = process.env as unknown as EnvCreds;
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '6', 10)));
  const dryrun = url.searchParams.get('dryrun') === '1';

  if (dryrun) {
    const { active, viewFqn } = (() => {
      try { return resolveView(env); } catch { return { active: 'v1' as const, viewFqn: env.CONTENIDOS_VIEW_V1_FQN || 'UNSET' }; }
    })();
    log('dryrun_fast_ok', { view: viewFqn, active });
    return NextResponse.json({ ok: true, dryrun: true, active, view: viewFqn });
  }

  let client: BigQuery;
  try { client = getClient(env); }
  catch (e: any) { log('credenciales_error', { error: String(e?.message || e) }); return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status: 500 }); }

  let viewFqn: string, active: 'v1'|'v2';
  try { ({ viewFqn, active } = resolveView(env)); }
  catch (e: any) { return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status: 500 }); }

  const fqn = viewFqn; // asumimos FQN completo si no hay BIGQUERY_PROJECT_ID
  try {
    const sql = `SELECT * FROM \`${fqn}\` LIMIT @limit`;
    const [rows] = await client.query({ query: sql, params: { limit } });
    const count = Array.isArray(rows) ? rows.length : 0;
    log('query_ok', { active, view:fqn, count, limit });
    return NextResponse.json({ ok:true, active, view:fqn, count, rows });
  } catch (e: any) {
    log('query_error', { error: String(e?.message || e), view: fqn });
    return NextResponse.json({ ok:false, view:fqn, error:String(e?.message||e) }, { status: 500 });
  }
}
