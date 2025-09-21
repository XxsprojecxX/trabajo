import { BigQuery } from "@google-cloud/bigquery";

const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
const dataset   = process.env.BQ_DATASET || "analisis_cultural";
const table     = process.env.BQ_TABLE_TOPICOS || "resultados_analizados";
const keyFile   = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json";

if (!projectId) {
  throw new Error("GCP_PROJECT_ID (o GOOGLE_CLOUD_PROJECT_ID) no está definido en .env.local");
}

const bq = new BigQuery({
  projectId,
  keyFilename: keyFile,
});

/** Estructura mínima para pintar Tópicos */
export type Topico = {
  id_conversacion: string;
  url_post: string;
  emocion_dominante: string | null;
  simbolismo_dominante: string | null;
  comentarios_analizados: number;
};

export async function getTopicos(): Promise<Topico[]> {
  // Normalizamos post_url_1 vs post_url para evitar errores de esquema
  const fqtn = `\`${projectId}.${dataset}.${table}\``;

  const sql = `
  WITH base AS (
    SELECT
      IFNULL(post_url_1, post_url) AS post_url,
      sentiment,
      theme
    FROM ${fqtn}
  )
  SELECT
    REGEXP_EXTRACT(post_url, r'([^/]+)/?$') AS id_conversacion,
    post_url AS url_post,
    ANY_VALUE(sentiment) AS emocion_dominante,
    ANY_VALUE(theme) AS simbolismo_dominante,
    COUNT(*) AS comentarios_analizados
  FROM base
  WHERE post_url IS NOT NULL
  GROUP BY post_url
  ORDER BY comentarios_analizados DESC
  LIMIT 1000
  `;

  const [rows] = await bq.query({ query: sql });
  return rows as Topico[];
}
