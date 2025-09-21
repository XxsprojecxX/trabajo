/**
 * Embeddings con cadena de fallbacks: local -> OpenAI -> Gemini
 * NOTA: mantenemos la firma simple: embed(text[]) => number[][]
 * Implementación mínima; si un proveedor no está configurado, se salta sin romper.
 */
import type { NextRequest } from "next/server";

const ORDER = (process.env.EMBEDDINGS_PROVIDER_ORDER || "local,gemini")
  .split(",")
  .map(s => s.trim().toLowerCase());

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.EMBEDDINGS_GEMINI_MODEL || "text-embedding-004";

// --- utilidades básicas ---
function l2norm(v: number[]): number {
  let s = 0; for (const x of v) s += x*x; return Math.sqrt(s);
}
export function cosine(a: number[], b: number[]): number {
  let dot = 0; for (let i=0;i<a.length;i++) dot += (a[i]||0)*(b[i]||0);
  const na = l2norm(a), nb = l2norm(b);
  return na && nb ? dot/(na*nb) : 0;
}

// --- proveedor local (placeholder seguro) ---
async function embedLocal(batch: string[]): Promise<number[][]> {
  // Heurística barata (no-ML) para no bloquear si no hay modelo local:
  // hash n-grams -> 256 dims; suficiente para priorizar Gemini cuando exista.
  function fe(s: string): number[] {
    const d = new Array(256).fill(0);
    const t = (s||"").toLowerCase().replace(/\s+/g," ").slice(0, 2048);
    for (let i=0;i<t.length-2;i++){
      const tri = t.substring(i, i+3);
      let h=0; for (let j=0;j<tri.length;j++) h=(h*31+tri.charCodeAt(j))>>>0;
      d[h%256]+=1;
    }
    const n = l2norm(d); if (n) for (let i=0;i<256;i++) d[i]/=n;
    return d;
  }
  return batch.map(fe);
}

// --- proveedor gemini ---
async function embedGemini(batch: string[]): Promise<number[][]> {
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY missing");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const out: number[][] = [];
  // Gemini no soporta batch directo en todas las cuentas; hacemos mini-batches
  const CHUNK = 32;
  for (let i=0;i<batch.length;i+=CHUNK) {
    const chunk = batch.slice(i, i+CHUNK);
    for (const text of chunk) {
      const r = await model.embedContent({ content: { parts: [{ text }] }});
      const v = r?.embedding?.values || [];
      out.push(v.map(Number));
    }
  }
  return out;
}

// --- proveedor openai (opcional; si no existe, se ignora) ---
async function embedOpenAI(batch: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.EMBEDDINGS_OPENAI_MODEL || "text-embedding-3-small";
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const url = "https://api.openai.com/v1/embeddings";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
    body: JSON.stringify({ input: batch, model })
  });
  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = await res.json();
  return (data?.data || []).map((d:any)=> d.embedding as number[]);
}

// --- cadena de fallbacks ---
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!texts?.length) return [];
  const tries: Record<string, (b:string[])=>Promise<number[][]>> = {
    local: embedLocal,
    openai: embedOpenAI,
    gemini: embedGemini,
  };
  let lastErr: any = null;
  for (const prov of ORDER) {
    const fn = (tries as any)[prov];
    if (!fn) continue;
    try {
      const v = await fn(texts);
      // si un proveedor devolvió vectores vacíos, sigue con el siguiente
      if (!v || !v.length || !Array.isArray(v[0])) throw new Error(`${prov} empty`);
      return v;
    } catch (e:any) {
      lastErr = e;
      continue;
    }
  }
  // fallback final: local siempre da algo
  try { return await embedLocal(texts); } catch(e){ /* no-op */ }
  throw lastErr || new Error("No embedding providers available");
}
