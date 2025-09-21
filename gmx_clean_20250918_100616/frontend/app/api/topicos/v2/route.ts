import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";

const VIEW_FQN = process.env.TOPICOS_VIEW_V2 || "gmx.vw_topicos_v2";
type QueryRow = { payload: string | null };

type Sentimiento = { positivo?: number; neutral?: number; negativo?: number };
type Emociones = Record<string, number>;
type EstadoResonancia = { estado: string; porcentaje?: number; intensidad?: "alta" | "media" | "baja" };

type Topico = {
  id?: string;
  nombre?: string;
  volumen?: number;
  volume?: number;
  categoria?: string;
  last_ts?: string;
  sentimiento?: Sentimiento;
  emociones?: Emociones;
  conexiones?: string[];
  coords?: { x?: number; y?: number };
  x?: number;
  y?: number;
  ejesDetectados?: string[];
  capitalSimbolicoDetectado?: string[];
  nseInferido?: string;
  contextoTerritorial?: string;
  estadosResonancia?: EstadoResonancia[];
  oportunidad?: number;
  engagement?: number;
  pilar?: string;
  pilarAsociado?: string;
  universeId?: string;
  universeLabel?: string;
  universePilar?: string;
  universeConfianza?: number;
  universeColor?: string;
  universeSize?: number;
  [key: string]: any;
};

type UniverseSummary = {
  id: string;
  label?: string;
  pilar?: string;
  confianza?: number;
  color?: string;
  size?: number;
  topicIds: string[];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || "60")));
    const dryrun = searchParams.get("dryrun");

    if (dryrun) {
      return NextResponse.json({ ok: true, view: VIEW_FQN, note: "dryrun only" });
    }


    const sql = `
     WITH ordered AS (
        SELECT
          TO_JSON_STRING(t) AS payload,
          SAFE_CAST(t.volumen AS INT64) AS orden_volumen,
          SAFE_CAST(t.last_ts AS TIMESTAMP) AS orden_ts
        FROM \`${VIEW_FQN}\` AS t
      )
      SELECT payload
      FROM ordered
      ORDER BY orden_volumen DESC NULLS LAST, orden_ts DESC NULLS LAST
      LIMIT @limit
    `;

  const rows = await runQuery<QueryRow>(sql, {
      limit: {
        name: "limit",
        parameterType: { type: "INT64" },
        parameterValue: { value: String(limit) },
      },
    });

    const items = rows.map((row, idx) => normalizeRow(row.payload, idx));
    const universes = buildUniverses(items);

    return NextResponse.json({ ok: true, view: VIEW_FQN, count: items.length, items, universes });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
function normalizeRow(payload: string | null, idx: number): Topico {
  const raw = parsePayload(payload);
  const cleaned = sanitizeTopico(raw);

  if (!cleaned.id) {
    cleaned.id = `topico_${idx + 1}`;
  }
  if (!cleaned.nombre) {
    cleaned.nombre = cleaned.id;
  }

  return cleaned;
}

function parsePayload(payload: string | null | undefined): Record<string, any> {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function sanitizeTopico(raw: Record<string, any>): Topico {
  const result: Topico = {};

  assignIfDefined(result, "id", stringFrom(raw.id ?? raw.id_topico ?? raw.topic_id ?? raw.pk));
  assignIfDefined(result, "nombre", stringFrom(raw.nombre ?? raw.topic ?? raw.name));

  const volumen = numberFrom(raw.volumen ?? raw.volume_total ?? raw.total_volume ?? raw.totalVolumen);
  if (volumen !== undefined) {
    result.volumen = volumen;
  }

  const volume = numberFrom(raw.volume ?? raw.volumen_total ?? raw.volumenTotal);
  if (volume !== undefined) {
    result.volume = volume;
  }

  assignIfDefined(result, "categoria", stringFrom(raw.categoria ?? raw.category ?? raw.categoria_topico));
  assignIfDefined(result, "fuente", stringFrom(raw.fuente ?? raw.source));

  const lastTs = normalizeTimestamp(
    raw.last_ts ?? raw.lastSeen ?? raw.last_seen ?? raw.updated_at ?? raw.last_update ?? raw.lastUpdate
  );
  if (lastTs) {
    result.last_ts = lastTs;
  }

  const sentimiento = parseSentimiento(
    raw.sentimiento ?? raw.sentiment ?? raw.sentimiento_json ?? raw.sentimiento_obj ?? raw.sentiment_json ?? raw.sentiments
  );
  if (sentimiento) {
    result.sentimiento = sentimiento;
  }

  const emociones = parseEmociones(raw.emociones ?? raw.emotions ?? raw.emociones_json ?? raw.emociones_obj);
  if (emociones) {
    result.emociones = emociones;
  }

  const conexiones = parseConexiones(raw.conexiones ?? raw.connections ?? raw.connection_ids ?? raw.conexiones_ids);
  if (conexiones) {
    result.conexiones = conexiones;
  }

  const coords = parseCoords(raw.coords ?? raw.coord ?? raw.coordinates, raw.x, raw.y);
  if (coords) {
    result.coords = coords;
    if (coords.x !== undefined) result.x = coords.x;
    if (coords.y !== undefined) result.y = coords.y;
  }

  const ejes = parseStringArray(raw.ejesDetectados ?? raw.ejes_detectados ?? raw.ejes ?? raw.axes);
  if (ejes) {
    result.ejesDetectados = ejes;
  }

  const capital = parseStringArray(
    raw.capitalSimbolicoDetectado ??
      raw.capital_simbolico_detectado ??
      raw.capitalSimbolico ??
      raw.symbolic_capital ??
      raw.capital
  );
  if (capital) {
    result.capitalSimbolicoDetectado = capital;
  }

  const estados = parseEstadosResonancia(
    raw.estadosResonancia ?? raw.resonancia_estados ?? raw.resonance_states ?? raw.estados ?? raw.resonancia
  );
  if (estados) {
    result.estadosResonancia = estados;
  }

  const oportunidad = numberFrom(raw.oportunidad ?? raw.opportunity ?? raw.oportunidad_score ?? raw.oportunidadIndex);
  if (oportunidad !== undefined) {
    result.oportunidad = oportunidad;
  }

  const engagement = numberFrom(raw.engagement ?? raw.engagement_rate ?? raw.engagement_pct ?? raw.tasa_engagement);
  if (engagement !== undefined) {
    result.engagement = engagement;
  }

  assignIfDefined(result, "nseInferido", stringFrom(raw.nseInferido ?? raw.nse_inferido ?? raw.nse));
  assignIfDefined(result, "contextoTerritorial", stringFrom(raw.contextoTerritorial ?? raw.contexto_territorial ?? raw.territorio ?? raw.contexto));
  assignIfDefined(result, "pilar", stringFrom(raw.pilar ?? raw.pillar));
  assignIfDefined(result, "pilarAsociado", stringFrom(raw.pilarAsociado ?? raw.pilar_asociado));

  const universoMeta = parseUniverseMeta(raw);
  if (universoMeta?.id) {
    result.universeId = universoMeta.id;
  }
  if (universoMeta?.label) {
    result.universeLabel = universoMeta.label;
  }
  if (universoMeta?.pilar) {
    result.universePilar = universoMeta.pilar;
  }
  if (universoMeta?.confianza !== undefined) {
    result.universeConfianza = universoMeta.confianza;
  }
  if (universoMeta?.color) {
    result.universeColor = universoMeta.color;
  }
  if (universoMeta?.size !== undefined) {
    result.universeSize = universoMeta.size;
  }
  if (!result.conexiones && universoMeta?.conexiones) {
    result.conexiones = universoMeta.conexiones;
  }
  if (!result.coords && universoMeta?.coords) {
    result.coords = universoMeta.coords;
    if (universoMeta.coords.x !== undefined) result.x = universoMeta.coords.x;
    if (universoMeta.coords.y !== undefined) result.y = universoMeta.coords.y;
  }

  return { ...raw, ...result };
}

function buildUniverses(items: Topico[]): UniverseSummary[] {
  const map = new Map<string, UniverseSummary>();

  for (const item of items) {
    const id = stringFrom(item.universeId ?? (item as any)?.universe_id ?? (item as any)?.universo_id);
    if (!id) continue;

    if (!map.has(id)) {
      map.set(id, {
        id,
        label: stringFrom(item.universeLabel ?? (item as any)?.universe_label ?? (item as any)?.universo_label ?? item.nombre),
        pilar: stringFrom(item.universePilar ?? (item as any)?.universe_pilar ?? (item as any)?.universo_pilar),
        confianza: numberFrom(item.universeConfianza ?? (item as any)?.universe_confianza ?? (item as any)?.universo_confianza),
        color: stringFrom(item.universeColor ?? (item as any)?.universe_color ?? (item as any)?.universo_color),
        size: numberFrom(item.universeSize ?? (item as any)?.universe_size ?? (item as any)?.universo_size),
        topicIds: [],
      });
    }

    const meta = map.get(id)!;
    if (!meta.label) {
      meta.label = stringFrom(item.universeLabel ?? (item as any)?.universe_label ?? (item as any)?.universo_label ?? item.nombre);
    }
    if (!meta.pilar) {
      meta.pilar = stringFrom(item.universePilar ?? (item as any)?.universe_pilar ?? (item as any)?.universo_pilar);
    }
    if (meta.confianza === undefined) {
      meta.confianza = numberFrom(item.universeConfianza ?? (item as any)?.universe_confianza ?? (item as any)?.universo_confianza);
    }
    if (!meta.color) {
      meta.color = stringFrom(item.universeColor ?? (item as any)?.universe_color ?? (item as any)?.universo_color);
    }

    const sizeCandidate = numberFrom(item.universeSize ?? (item as any)?.universe_size ?? (item as any)?.universo_size);
    if (sizeCandidate !== undefined) {
      meta.size = meta.size ? Math.max(meta.size, sizeCandidate) : sizeCandidate;
    }

    if (item.id) {
      meta.topicIds.push(item.id);
    }
  }

  return Array.from(map.values()).map((meta) => ({
    ...meta,
    size: meta.size ?? meta.topicIds.length,
  }));
}

function assignIfDefined<T extends object, K extends keyof any>(target: T, key: K, value: any) {
  if (value !== undefined && value !== null) {
    (target as any)[key] = value;
  }
}

function numberFrom(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(/[%]/g, "").replace(/,/g, "");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : undefined;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return undefined;
}

function stringFrom(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return undefined;
}

function normalizeTimestamp(value: any): string | undefined {
  const str = stringFrom(value);
  if (!str) return undefined;
  const ts = new Date(str);
  if (!Number.isNaN(ts.getTime())) {
    return ts.toISOString();
  }
  return str;
}

function parseMaybeJSON(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (value instanceof Uint8Array) {
    try {
      return JSON.parse(Buffer.from(value).toString("utf8"));
    } catch {
      return null;
    }
  }
  return null;
}

function parseMaybeObject(value: any): Record<string, any> | null {
  const parsed = parseMaybeJSON(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, any>) : null;
}

function parseMaybeArray(value: any): any[] | null {
  const parsed = parseMaybeJSON(value);
  return Array.isArray(parsed) ? parsed : null;
}

function parseSentimiento(value: any): Sentimiento | undefined {
  const obj = parseMaybeObject(value);
  if (!obj) return undefined;

  const out: Sentimiento = {};
  const pos = numberFrom(obj.positivo ?? obj.positive ?? obj.pos ?? obj.favorable);
  if (pos !== undefined) out.positivo = clampPercentage(pos);
  const neu = numberFrom(obj.neutral ?? obj.neutro ?? obj.mid);
  if (neu !== undefined) out.neutral = clampPercentage(neu);
  const neg = numberFrom(obj.negativo ?? obj.negative ?? obj.neg ?? obj.desfavorable);
  if (neg !== undefined) out.negativo = clampPercentage(neg);

  return Object.keys(out).length ? out : undefined;
}

function clampPercentage(num: number): number {
  if (!Number.isFinite(num)) return num;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

function parseEmociones(value: any): Emociones | undefined {
  const obj = parseMaybeObject(value);
  if (!obj) return undefined;
  const out: Emociones = {};
  for (const [key, val] of Object.entries(obj)) {
    const num = numberFrom(val);
    if (num !== undefined) {
      out[key] = clampPercentage(num);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function parseConexiones(value: any): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const arr = parseMaybeArray(value);
  if (arr) {
    const list = arr.map((v) => stringFrom(v)).filter((v): v is string => !!v);
    return list.length ? Array.from(new Set(list)) : [];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseConexiones(parsed) ?? [];
      }
    } catch {
      // no-op
    }
    const list = trimmed
      .split(/[,;|]/)
      .map((part) => part.trim())
      .filter(Boolean);
    return list.length ? Array.from(new Set(list)) : [];
  }
  return undefined;
}

function parseStringArray(value: any): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const arr = parseMaybeArray(value);
  if (arr) {
    const list = arr.map((v) => stringFrom(v)).filter((v): v is string => !!v);
    return list.length ? Array.from(new Set(list)) : [];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parseStringArray(parsed) ?? [];
      }
    } catch {
      // ignore
    }
    return Array.from(new Set(trimmed.split(/[,;|]/).map((part) => part.trim()).filter(Boolean)));
  }
  return undefined;
}

function parseCoords(value: any, fallbackX?: any, fallbackY?: any): { x?: number; y?: number } | undefined {
  const parsed = parseMaybeJSON(value);
  let x: number | undefined;
  let y: number | undefined;

  if (Array.isArray(parsed)) {
    x = numberFrom(parsed[0]);
    y = numberFrom(parsed[1]);
  } else if (parsed && typeof parsed === "object") {
    x = numberFrom(parsed.x ?? parsed.lon ?? parsed.lng ?? parsed.longitude ?? parsed[0]);
    y = numberFrom(parsed.y ?? parsed.lat ?? parsed.latitude ?? parsed[1]);
  }

  if (x === undefined && y === undefined) {
    x = numberFrom(fallbackX);
    y = numberFrom(fallbackY);
  }

  if (x === undefined && y === undefined) return undefined;
  const coords: { x?: number; y?: number } = {};
  if (x !== undefined) coords.x = x;
  if (y !== undefined) coords.y = y;
  return coords;
}

function parseEstadosResonancia(value: any): EstadoResonancia[] | undefined {
  const arr = parseMaybeArray(value);
  if (!arr) return undefined;

  const out: EstadoResonancia[] = [];
  for (const entry of arr) {
    const obj = parseMaybeObject(entry) ?? (typeof entry === "string" ? { estado: entry } : null);
    if (!obj) continue;

    const estado = stringFrom(obj.estado ?? obj.state ?? obj.nombre ?? obj.label);
    const porcentaje = numberFrom(obj.porcentaje ?? obj.percent ?? obj.pct ?? obj.valor ?? obj.value);
    const intensidadRaw = stringFrom(obj.intensidad ?? obj.intensity ?? obj.nivel ?? obj.level)?.toLowerCase();
    const intensidad = intensidadRaw ? normalizeIntensity(intensidadRaw) : undefined;

    if (estado || porcentaje !== undefined || intensidad) {
      out.push({
        estado: estado ?? "—",
        ...(porcentaje !== undefined ? { porcentaje } : {}),
        ...(intensidad ? { intensidad } : {}),
      });
    }
  }

  return out.length ? out : undefined;
}

type UniverseMeta = {
  id?: string;
  label?: string;
  pilar?: string;
  confianza?: number;
  color?: string;
  size?: number;
  conexiones?: string[];
  coords?: { x?: number; y?: number };
};

function parseUniverseMeta(raw: Record<string, any>): UniverseMeta | undefined {
  const candidates = [
    raw.universe,
    raw.universo,
    raw.universe_meta,
    raw.universo_meta,
    raw.universeInfo,
    raw.universe_data,
    raw.cluster,
    raw.cluster_meta,
    raw.universeSummary,
  ];

  const meta = candidates.map(parseMaybeObject).find((obj): obj is Record<string, any> => !!obj);

  const id = stringFrom(
    raw.universe_id ?? raw.universo_id ?? raw.universeId ?? raw.universoId ?? raw.cluster_id ?? raw.clusterId ?? meta?.id ?? meta?.universe_id ?? meta?.cluster_id
  );
  const label = stringFrom(
    raw.universe_label ?? raw.universo_label ?? raw.universo_nombre ?? raw.universeName ?? meta?.label ?? meta?.nombre ?? meta?.name
  );
  const pilar = stringFrom(raw.universe_pilar ?? raw.universo_pilar ?? meta?.pilar ?? meta?.pillar);
  const confianza = numberFrom(raw.universe_confianza ?? raw.universo_confianza ?? meta?.confianza ?? meta?.confidence);
  const color = stringFrom(raw.universe_color ?? raw.universo_color ?? meta?.color);
  const size = numberFrom(raw.universe_size ?? raw.universo_size ?? meta?.size ?? meta?.tamano ?? meta?.count ?? meta?.topics);
  const conexiones = parseConexiones(raw.universe_conexiones ?? meta?.conexiones ?? meta?.connections);
  const coords = parseCoords(meta?.coords ?? meta?.coordinates ?? meta?.posicion ?? meta?.position);

  if (!id && !label && !pilar && confianza === undefined && !color && size === undefined && !conexiones && !coords) {
    return undefined;
  }

  return { id, label, pilar, confianza, color, size, conexiones, coords };
}

function normalizeIntensity(value: string): "alta" | "media" | "baja" | undefined {
  if (value.includes("alta") || value.includes("high")) return "alta";
  if (value.includes("media") || value.includes("mid") || value.includes("medium")) return "media";
  if (value.includes("baja") || value.includes("low")) return "baja";
  return undefined;
}
