import { NextResponse, NextRequest } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'node:fs';

type EnvCreds = {
  BIGQUERY_PROJECT_ID?: string;
  BIGQUERY_SERVICE_ACCOUNT_JSON?: string;
  BIGQUERY_SERVICE_ACCOUNT_BASE64?: string;
  CREATORAS_VIEW?: 'v1'|'v2';
  CREATORAS_VIEW_V1_FQN?: string;
  CREATORAS_VIEW_V2_FQN?: string;
};

function log(msg: string, meta: Record<string, unknown> = {}) {
  try { fs.appendFileSync('/tmp/next.out', `[${new Date().toISOString()}] /api/creadoras ${msg} ${JSON.stringify(meta)}\n`); } catch {}
}

function getClient(env: EnvCreds) {
  const projectId = env.BIGQUERY_PROJECT_ID;
  const jsonRaw = env.BIGQUERY_SERVICE_ACCOUNT_JSON;
  const b64 = env.BIGQUERY_SERVICE_ACCOUNT_BASE64;

  if (!projectId && !jsonRaw && !b64) {
    // Permitir arranque sin creds cuando no se hará query real (p.ej. dryrun)
    return new BigQuery(); // ADC / auto-detect si existe; si no, fallará solo al consultar
  }

  if (jsonRaw || b64) {
    const jsonStr = jsonRaw ? jsonRaw : Buffer.from(b64!, 'base64').toString('utf8');
    let parsed: any;
    try { parsed = JSON.parse(jsonStr); } catch { throw new Error("CREDENCIAL_INVALIDA: JSON/BASE64"); }
    const { client_email, private_key } = parsed || {};
    if (!client_email || !private_key) throw new Error("CREDENCIAL_INCOMPLETA: client_email/private_key");
    return new BigQuery({ projectId: projectId, credentials: { client_email, private_key } });
  }
  return new BigQuery({ projectId }); // con projectId, usando ADC
}

function resolveView(env: EnvCreds) {
  const flag = (env.CREATORAS_VIEW ?? 'v1').toLowerCase();
  const v1 = env.CREATORAS_VIEW_V1_FQN;
  const v2 = env.CREATORAS_VIEW_V2_FQN || v1;
  const chosen = flag === 'v2' ? v2 : v1;
  if (!chosen) throw new Error("VIEW_NO_CONFIGURADA: define CREATORAS_VIEW_V1_FQN en .env.local");
  return { active: flag === 'v2' ? 'v2' : 'v1', viewFqn: chosen };
}

const DEFAULT_HANDLES_TIKTOK = ['@papas.de.cuatro','@giannacristante','@mamiabordo'];
const DEFAULT_HANDLES_IG     = ['@papa.de.cuatro','@giannacristante','@mami.a.bordo'];

export async function GET(req: NextRequest) {
  const env = process.env as unknown as EnvCreds;
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '6', 10)));
  const dryrun = url.searchParams.get('dryrun') === '1';

  // Respuesta inmediata para smoke test sin tocar BigQuery
  if (dryrun) {
    const { active, viewFqn } = (() => {
      try { return resolveView(env); } catch { return { active: 'v1' as const, viewFqn: env.CREATORAS_VIEW_V1_FQN || 'UNSET' }; }
    })();
    log('dryrun_fast_ok', { view: viewFqn, active });
    return NextResponse.json({ ok: true, dryrun: true, active, view: viewFqn });
  }

  const handlesParam = url.searchParams.get('handles');
  const platformsParam = url.searchParams.get('platforms');
  const platforms = (platformsParam ? platformsParam.split(',') : ['instagram','tiktok'])
    .map(s => s.trim().toLowerCase()).filter(Boolean);

  const fromParam = handlesParam ? handlesParam.split(',').map(s => s.trim()).filter(Boolean) : [];
  const defaultHandles = [
    ...DEFAULT_HANDLES_IG.map(h => `instagram:${h}`),
    ...DEFAULT_HANDLES_TIKTOK.map(h => `tiktok:${h}`),
  ];

  const requested = fromParam.length
    ? fromParam.map(h => (h.includes(':') ? h : `any:${h.startsWith('@')?h:`@${h}`}`))
    : defaultHandles;

  let client: BigQuery;
  try { client = getClient(env); }
  catch (e: any) { log('credenciales_error', { error: String(e?.message || e) }); return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status: 500 }); }

  let viewFqn: string, active: 'v1'|'v2';
  try { ({ viewFqn, active } = resolveView(env)); }
  catch (e: any) { return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status: 500 }); }

  // Si no hay project en env, asumimos que CREATORAS_VIEW_* viene **totalmente calificado** (project.dataset.view)
  const fqn = viewFqn;

  try {
    const sql = `
      SELECT * FROM \`${fqn}\`
      WHERE (@useFilter = FALSE)
         OR CONCAT(LOWER(COALESCE(platform,'')), ':', LOWER(COALESCE(handle, user_handle, ''))) IN UNNEST(@ph)
         OR LOWER(COALESCE(handle, user_handle, '')) IN UNNEST(@h)
      LIMIT @limit
    `;
    const ph: string[] = [];
    const h: string[] = [];
    for (const item of requested) {
      const [maybePlat, maybeHandle] = item.includes(':') ? item.split(':',2) : ['any', item];
      const handle = maybeHandle.startsWith('@') ? maybeHandle.toLowerCase() : `@${maybeHandle.toLowerCase()}`;
      const plat = maybePlat.toLowerCase();
      if (plat === 'any') { h.push(handle); }
      else if (platforms.includes(plat)) { ph.push(`${plat}:${handle}`); }
    }
    const useFilter = ph.length > 0 || h.length > 0;

    const [rows] = await client.query({ query: sql, params: { ph, h, useFilter, limit } });
    const count = Array.isArray(rows) ? rows.length : 0;
    log('query_ok', { active, view:fqn, count, limit });
    return NextResponse.json({ ok:true, active, view:fqn, count, rows });
  } catch (e: any) {
    log('query_error', { error: String(e?.message || e), view: fqn });
    return NextResponse.json({ ok:false, view:fqn, error:String(e?.message||e) }, { status: 500 });
  }
}
