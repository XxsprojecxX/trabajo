import { NextRequest, NextResponse } from 'next/server'
import { BigQuery } from '@google-cloud/bigquery'
import { clusterTopicos } from "@/lib/universes"; // Importamos la función de clustering

export const runtime = 'nodejs'
export const dynamic = "force-dynamic";


// --- DEFINICIÓN DE TIPOS PARA MAYOR CLARIDAD Y SEGURIDAD ---

type Env = {
  TOPICOS_VIEW?: 'v1' | 'v2' | 'api'
  TOPICOS_VIEW_V1_FQN?: string
  TOPICOS_VIEW_V2_FQN?: string
  GOOGLE_PROJECT_ID?: string
  BIGQUERY_PROJECT_ID?: string
  BIGQUERY_SERVICE_ACCOUNT_JSON?: string
  BIGQUERY_SERVICE_ACCOUNT_BASE64?: string
}

// Interface para el tipo de dato que esperamos de la fila de BigQuery
interface BigQueryRow {
  id: string;
  nombre: string;
  volumen: number;
  volume: number;
  sentimiento: any; // El tipo puede ser más específico si se conoce la estructura
  emociones: any;
  engagement: number;
  oportunidad: number;
  categoria: string;
  ejesDetectados: any[];
  capitalSimbolicoDetectado: any;
  pilar: string;
  pilarAsociado: string;
  nseInferido: string;
  contextoTerritorial: string;
  estadosResonancia: any[];
  coords: { x: number; y: number };
  x: number;
  y: number;
  conexiones: any;
  fuente: any;
  last_ts: string; // BigQuery devuelve las fechas como objetos especiales, pero las manejaremos como string en la API
}

// Interface para el objeto final que devolverá la API por cada tópico
interface ApiTopicItem {
  id: string;
  nombre: string;
  volumen: number;
  categoria: string;
  last_ts: string;
  ejesDetectados: any[];
  estadosResonancia: any[];
  // Campos opcionales añadidos por el clustering
  universeId?: string | null;
  universeLabel?: string;
  universePilar?: string;
  universeConfianza?: number;
}

// Interface para la estructura de un universo
interface Universe {
  id: string;
  label: string;
  pilar: string;
  confianza: number;
}


// --- FUNCIONES AUXILIARES ---

function env(name: string, fallback = ''): string {
  const v = process.env[name]
  return (v === undefined || v === null || v === '') ? fallback : String(v)
}

function getProjectId(): string {
  return env('GOOGLE_PROJECT_ID', env('BIGQUERY_PROJECT_ID', ''))
}

function resolveView(env: Env) {
  const flag = String(env.TOPICOS_VIEW || 'v2').toLowerCase() as 'v1' | 'v2' | 'api'
  const project = getProjectId()
  const v1 = env.TOPICOS_VIEW_V1_FQN || `${project}.gmx.vw_social_post_with_pilar`
  const v2 = env.TOPICOS_VIEW_V2_FQN || v1
  const api = `${project}.content_insight.api_topicos`
  const viewFqn = flag === 'api' ? api : (flag === 'v2' ? v2 : v1)
  return { active: flag, viewFqn }
}

function getClient() {
  const projectId = getProjectId()
  const raw = env('BIGQUERY_SERVICE_ACCOUNT_JSON')
  const b64 = env('BIGQUERY_SERVICE_ACCOUNT_BASE64')

  if (raw || b64) {
    const jsonStr = raw ? raw : Buffer.from(String(b64), 'base64').toString('utf8')
    const creds = JSON.parse(jsonStr)
    const { client_email, private_key } = creds
    if (!client_email || !private_key) throw new Error('CREDENCIAL_INCOMPLETA')
    return new BigQuery({ projectId, credentials: { client_email, private_key } })
  }
  
  return new BigQuery({ projectId, keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS })
}

// --- LÓGICA DEL ENDPOINT ---

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitRaw = Number(searchParams.get('limit') || '60')
    const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 60))
    const dryrun = searchParams.get('dryrun') === '1'

    const { active, viewFqn } = resolveView(process.env as Env)

    if (dryrun) {
      return NextResponse.json({ ok: true, dryrun: true, active, view: viewFqn })
    }

    const bq = getClient()

    // La query es la misma, pero la mantenemos bien formateada para legibilidad.
    // Los CASTs son una buena práctica para asegurar los tipos de datos desde BigQuery.
    const query = `
      SELECT
        CAST(id AS STRING)            AS id,
        CAST(nombre AS STRING)        AS nombre,
        CAST(volumen AS INT64)        AS volumen,
        CAST(volume AS INT64)         AS volume,
        sentimiento,
        emociones,
        CAST(engagement AS FLOAT64)   AS engagement,
        CAST(oportunidad AS INT64)    AS oportunidad,
        CAST(categoria AS STRING)     AS categoria,
        ejesDetectados,
        capitalSimbolicoDetectado,
        CAST(pilar AS STRING)         AS pilar,
        CAST(pilarAsociado AS STRING) AS pilarAsociado,
        CAST(nseInferido AS STRING)   AS nseInferido,
        CAST(contextoTerritorial AS STRING) AS contextoTerritorial,
        estadosResonancia,
        coords,
        CAST(coords.x AS FLOAT64)     AS x,
        CAST(coords.y AS FLOAT64)     AS y,
        conexiones,
        fuente,
        TIMESTAMP(last_ts)            AS last_ts
      FROM \`${viewFqn}\`
      ORDER BY volumen DESC, last_ts DESC
      LIMIT @limit
    `

    const [job] = await bq.createQueryJob({ query, location: 'US', params: { limit } })
    const [rows] = await job.getQueryResults() as [BigQueryRow[]]

    // Mapeo inicial para construir el contrato base de la API
    const baseItems: ApiTopicItem[] = rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      volumen: r.volumen,
      categoria: r.categoria,
      last_ts: r.last_ts,
      ejesDetectados: r.ejesDetectados,
      estadosResonancia: r.estadosResonancia
    }));

    // === INICIO DEL PARCHE: AGRUPACIÓN ALMA -> UNIVERSOS (server-only) ===
    try {
      const { universos, asignacion } = await clusterTopicos(baseItems);

      // OPTIMIZACIÓN: Crear un mapa de universos para búsqueda O(1) en lugar de O(n)
      const universosMap = new Map<string, Universe>(universos.map((u: Universe) => [u.id, u]));

      // Enriquecer los items con los datos del universo de forma inmutable (creando un nuevo array)
      const enrichedItems = baseItems.map(item => {
        const universeId = asignacion[item.id] || null;
        if (universeId) {
          const meta = universosMap.get(universeId);
          if (meta) {
            return {
              ...item,
              universeId,
              universeLabel: meta.label,
              universePilar: meta.pilar,
              universeConfianza: meta.confianza,
            };
          }
        }
        return item; // Devuelve el item sin cambios si no hay universo
      });
      
      // La UI puede usar `universos` para dibujar las zonas de los clusters
      return NextResponse.json({ ok: true, view: viewFqn, count: enrichedItems.length, items: enrichedItems, universos });

    } catch (e: any) {
      console.warn(`El clustering de tópicos falló: ${e.message}. Se devolverán los datos sin enriquecer.`);
      // Si el clustering falla, la API no se rompe. Devolvemos los items base.
      // Esto se conoce como "degradación elegante" (graceful degradation).
      return NextResponse.json({ ok: true, view: viewFqn, count: baseItems.length, items: baseItems, universos: [] });
    }
    // === FIN DEL PARCHE ===

  } catch (e: any) {
    console.error(`Error crítico en la API de tópicos: ${e.message}`);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: String(e?.message || e) },
      { status: 500 }
    )
  }
}
