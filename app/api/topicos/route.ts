import { NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'node:fs';

type EnvCreds = {
  BIGQUERY_PROJECT_ID?: string;
  BIGQUERY_SERVICE_ACCOUNT_JSON?: string;       // JSON en una línea con \n
  BIGQUERY_SERVICE_ACCOUNT_BASE64?: string;     // JSON base64 (alternativa)
  TOPICOS_VIEW?: 'v1' | 'v2';
  TOPICOS_VIEW_V2?: string;                     // (opcional) dataset.vista para v2
};

function log(msg: string, meta: Record<string, unknown> = {}) {
  try {
    const line = `[${new Date().toISOString()}] /api/topicos ${msg} ${JSON.stringify(meta)}\n`;
    fs.appendFileSync('/tmp/next.out', line);
  } catch { /* ignore logging errors */ }
}

function getClient(env: EnvCreds) {
  const projectId = env.BIGQUERY_PROJECT_ID;
  if (!projectId) {
    throw new Error("FALTA_CREDENCIAL: BIGQUERY_PROJECT_ID");
  }

  // Preferimos credenciales por JSON/BASE64 si existen; si no, Application Default Credentials.
  const jsonRaw = env.BIGQUERY_SERVICE_ACCOUNT_JSON;
  const b64 = env.BIGQUERY_SERVICE_ACCOUNT_BASE64;

  if (jsonRaw || b64) {
    let jsonStr = jsonRaw ?? '';
    if (!jsonStr && b64) jsonStr = Buffer.from(b64, 'base64').toString('utf8');

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("CREDENCIAL_INVALIDA: BIGQUERY_SERVICE_ACCOUNT_JSON/BASE64 no es JSON válido");
    }

    const { client_email, private_key } = parsed || {};
    if (!client_email || !private_key) {
      throw new Error("CREDENCIAL_INCOMPLETA: faltan client_email/private_key en Service Account");
    }

    return new BigQuery({
      projectId,
      credentials: { client_email, private_key },
    });
  }

  // ADC (gcloud / variable GOOGLE_APPLICATION_CREDENTIALS)
  return new BigQuery({ projectId });
}

function resolveView(env: EnvCreds) {
  const viewFlag = (env.TOPICOS_VIEW ?? 'v1').toLowerCase();
  const VIEW_V1 = 'gmx.vw_social_post_with_pilar'; // fuente viva congelada (v1)
  // v2 queda configurable por env; si no está definida, cae a v1 (no rompemos nada).
  const VIEW_V2 = env.TOPICOS_VIEW_V2 || VIEW_V1;

  const resolved = viewFlag === 'v2' ? VIEW_V2 : VIEW_V1;
  const active = viewFlag === 'v2' ? 'v2' : 'v1';
  return { active, viewFqn: resolved };
}

export async function GET(request: Request) {
  const env = process.env as unknown as EnvCreds;
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '6', 10)));
  const dryrun = url.searchParams.get('dryrun') === '1';

  let client: BigQuery;
  try {
    client = getClient(env);
  } catch (e: any) {
    log('credenciales_error', { error: String(e?.message || e) });
    return NextResponse.json(
      {
        ok: false,
        source: 'bigquery',
        error: String(e?.message || e),
        hint:
          "Define BIGQUERY_PROJECT_ID y credenciales vía BIGQUERY_SERVICE_ACCOUNT_JSON (una línea) o BIGQUERY_SERVICE_ACCOUNT_BASE64, o usa ADC.",
      },
      { status: 500 }
    );
  }

  const { active, viewFqn } = resolveView(env);

  // Construimos FQN como `project.dataset.vista` si viewFqn viene como dataset.vista
  const projectId = env.BIGQUERY_PROJECT_ID!;
  const hasProjectInView = viewFqn.split('.').length === 3;
  const fqn = hasProjectInView ? viewFqn : `${projectId}.${viewFqn}`;

  try {
    if (dryrun) {
      const drySql = `SELECT 1 AS ok FROM \`${fqn}\` LIMIT 1`;
      await client.query({ query: drySql });
      log('dryrun_ok', { view: fqn });
      return NextResponse.json({ ok: true, dryrun: true, view: fqn, active });
    }

    const sql = `SELECT * FROM \`${fqn}\` LIMIT @limit`;
    const [rows] = await client.query({ query: sql, params: { limit } });
    const count = Array.isArray(rows) ? rows.length : 0;

    log('query_ok', { active, view: fqn, count, limit });

    return NextResponse.json({
      ok: true,
      active,
      view: fqn,
      count,
      rows, // la UI espera acceder a .rows[].pilarAsociado; no tocamos el shape
    });
  } catch (e: any) {
    log('query_error', { error: String(e?.message || e), view: fqn });
    return NextResponse.json(
      {
        ok: false,
        source: 'bigquery',
        view: fqn,
        error: String(e?.message || e),
        hint:
          "Verifica permisos del Service Account y existencia de la vista. Usa ?dryrun=1 para smoke test. Asegura TOPICOS_VIEW='v1' si v2 no está configurada.",
      },
      { status: 500 }
    );
  }
}
