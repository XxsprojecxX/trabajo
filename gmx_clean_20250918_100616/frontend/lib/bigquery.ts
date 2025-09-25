import { BigQuery, BigQueryOptions } from "@google-cloud/bigquery";

export type QueryParameterValue = any;
export type QueryParameterMap = Record<string, QueryParameterValue> | QueryParameterValue[] | undefined;

export interface RunQueryOptions {
  location?: string;
  useLegacySql?: boolean;
  maximumBytesBilled?: number;
  jobTimeoutMs?: number;
  labels?: Record<string, string>;
  defaultDataset?: { projectId?: string; datasetId: string };
  maxResults?: number;
  resultTimeoutMs?: number;
  dryRun?: boolean;
}

let cachedClient: BigQuery | null = null;

function env(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === null) return undefined;
  const trimmed = typeof value === "string" ? value.trim() : String(value);
  return trimmed === "" ? undefined : trimmed;
}

function getDefaultLocation(): string {
  return env("BQ_LOCATION") || "US";
}

function getProjectId(): string | undefined {
  return env("GOOGLE_PROJECT_ID") || env("BIGQUERY_PROJECT_ID") || env("GOOGLE_CLOUD_PROJECT");
}

function decodeServiceAccount(): { client_email: string; private_key: string } | null {
  const raw = env("BIGQUERY_SERVICE_ACCOUNT_JSON");
  const b64 = env("BIGQUERY_SERVICE_ACCOUNT_BASE64");
  if (!raw && !b64) return null;

  const jsonStr = raw ? raw : Buffer.from(String(b64), "base64").toString("utf8");
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error("CREDENCIAL_INVALIDA_JSON");
  }

  const client_email = parsed?.client_email;
  let private_key = parsed?.private_key;
  if (!client_email || !private_key) {
    throw new Error("CREDENCIAL_INCOMPLETA");
  }
  if (typeof private_key === "string") {
    private_key = private_key.replace(/\\n/g, "\n");
  }
  return { client_email, private_key };
}

function buildClient(): BigQuery {
  const options: BigQueryOptions = { location: getDefaultLocation() };
  const projectId = getProjectId();
  if (projectId) {
    options.projectId = projectId;
  }

  try {
    const creds = decodeServiceAccount();
    if (creds) {
      options.credentials = creds;
      return new BigQuery(options);
    }
  } catch (err) {
    throw err;
  }

  const keyFilename = env("GOOGLE_APPLICATION_CREDENTIALS");
  if (keyFilename) {
    options.keyFilename = keyFilename;
    return new BigQuery(options);
  }

  if (Object.keys(options).length > 0) {
    return new BigQuery(options);
  }
  return new BigQuery();
}

function getClient(): BigQuery {
  if (!cachedClient) {
    cachedClient = buildClient();
  }
  return cachedClient;
}

export async function runQuery<T = Record<string, any>>(query: string, params?: QueryParameterMap, options: RunQueryOptions = {}): Promise<T[]> {
  const client = getClient();
  const location = options.location || getDefaultLocation();

  const jobConfig: any = {
    query,
    location,
    useLegacySql: options.useLegacySql ?? false,
  };

  if (params !== undefined) {
    jobConfig.params = params as any;
  }
  if (options.maximumBytesBilled !== undefined) {
    jobConfig.maximumBytesBilled = options.maximumBytesBilled;
  }
  if (options.jobTimeoutMs !== undefined) {
    jobConfig.jobTimeoutMs = options.jobTimeoutMs;
  }
  if (options.labels) {
    jobConfig.labels = options.labels;
  }
  if (options.defaultDataset) {
    jobConfig.defaultDataset = options.defaultDataset;
  }
  if (options.dryRun) {
    jobConfig.dryRun = true;
  }

  const [job] = await client.createQueryJob(jobConfig);
  const [metadata] = await job.getMetadata();
  const error = metadata?.status?.errorResult;
  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }

  if (jobConfig.dryRun) {
    return [] as T[];
  }

  const [rows] = await job.getQueryResults({
    maxResults: options.maxResults,
    timeoutMs: options.resultTimeoutMs,
  });
  return rows as T[];
}

export interface DryRunInfo {
  jobId: string | null;
  location: string;
  totalBytesProcessed: number;
  schemaFieldCount?: number;
  totalSlotMs?: number;
  referencedTables?: Array<{ projectId?: string; datasetId?: string; tableId?: string }>;
  statistics?: any;
}

function buildTableFqn(): string {
  const table = env("GOOGLE_TABLE");
  const dataset = env("GOOGLE_DATASET");
  if (!table || !dataset) {
    throw new Error("GOOGLE_DATASET_O_TABLE_NO_CONFIGURADO");
  }
  const projectId = getProjectId();

  if (table.includes(".")) {
    return table;
  }
  if (dataset.includes(".")) {
    return `${dataset}.${table}`;
  }
  if (!projectId) {
    throw new Error("GOOGLE_PROJECT_ID_NO_CONFIGURADO");
  }
  return `${projectId}.${dataset}.${table}`;
}

export async function dryRunBQ(): Promise<DryRunInfo> {
  const client = getClient();
  const tableFqn = buildTableFqn();
  const [job] = await client.createQueryJob({
    query: `SELECT COUNT(1) AS total FROM \`${tableFqn}\``,
    location: getDefaultLocation(),
    dryRun: true,
    useLegacySql: false,
  });
  const [metadata] = await job.getMetadata();
  const stats = metadata?.statistics?.query;
  return {
    jobId: job.id || null,
    location: metadata?.jobReference?.location || getDefaultLocation(),
    totalBytesProcessed: Number(stats?.totalBytesProcessed ?? 0),
    schemaFieldCount: Array.isArray(stats?.schema?.fields) ? stats!.schema!.fields!.length : undefined,
    totalSlotMs: stats?.totalSlotMs !== undefined ? Number(stats.totalSlotMs) : undefined,
    referencedTables: stats?.referencedTables,
    statistics: stats,
  };
}