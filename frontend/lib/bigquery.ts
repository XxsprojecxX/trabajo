// lib/bigquery.ts
import { BigQuery, QueryParameter } from "@google-cloud/bigquery";

type CredMode =
  | { keyFilename: string }
  | { credentials: any }
  | Record<string, never>;

let _bq: BigQuery | null = null;

function getCreds(): CredMode {
  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const raw = process.env.GOOGLE_CREDENTIALS_JSON?.trim();
  const b64 = process.env.GOOGLE_CREDENTIALS_B64?.trim();

  if (raw) {
    try {
      return { credentials: JSON.parse(raw) };
    } catch {
      throw new Error("GOOGLE_CREDENTIALS_JSON no es JSON válido");
    }
  }
  if (b64) {
    try {
      const json = Buffer.from(b64, "base64").toString("utf8");
      return { credentials: JSON.parse(json) };
    } catch {
      throw new Error("GOOGLE_CREDENTIALS_B64 no es base64/JSON válido");
    }
  }
  if (file) return { keyFilename: file };
  // ADC (Application Default Credentials) como último recurso
  return {};
}

export function getBigQuery(): BigQuery {
  if (_bq) return _bq;
  const projectId = process.env.GOOGLE_PROJECT_ID;
  if (!projectId) throw new Error("Falta GOOGLE_PROJECT_ID");
  _bq = new BigQuery({ projectId, ...getCreds() });
  return _bq;
}

export async function runQuery<T = any>(
  sql: string,
  params?: Record<string, QueryParameter>
): Promise<T[]> {
  const bq = getBigQuery();
  const options: any = { query: sql, location: "US" };
  if (params) options.params = params;
  const [job] = await bq.createQueryJob(options);
  const [rows] = await job.getQueryResults();
  return rows as T[];
}

/** Prueba de humo: confirma conexión y permisos de lectura */
export async function dryRunBQ() {
  const rows = await runQuery<{ ok: number; ts: string }>(
    `SELECT 1 AS ok, CAST(CURRENT_TIMESTAMP() AS STRING) AS ts`
  );
  return rows?.[0] ?? null;
}
