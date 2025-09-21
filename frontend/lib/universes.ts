import { embedBatch, cosine } from "./embeddings";

export type TopicoLite = {
  id: string;
  nombre: string;
  volumen?: number | null;
  categoria?: string | null;
  // señales ALMA opcionales
  ejesDetectados?: string[];       // ['Emocional','Narrativo',...]
  estadosResonancia?: { estado: string }[];
  last_ts?: any;
};

export type Universo = {
  id: string;
  label: string;
  size: number;
  centroid: number[];
  ejesDominantes: string[];
  estados: string[];
  confianza: number;  // 0..1
  pilar: 'DIARY OF REAL MOMS'|'RECIPES THAT HUG'|'REAL FAMILY MOMENTS'|'AUTHENTIC TREATS';
  members: string[];  // ids de tópicos
};

const SIM_THRESHOLD = Number(process.env.ALMACLUST_SIM || 0.82);
const MIN_CLUSTER = Number(process.env.ALMACLUST_MIN || 24);     // a nivel UI (no 157k)
const AXIS_MIN = 3;

function pillarHeuristics(u: Universo): Universo["pilar"] {
  const text = u.label.toLowerCase();
  const eje = u.ejesDominantes.map(e=>e.toLowerCase());
  if (eje.includes("sensorial") && /cocina|receta|comer|sabor/.test(text)) return "RECIPES THAT HUG";
  if (eje.includes("sensorial") && /placer|antojo|capricho|consuelo/.test(text)) return "AUTHENTIC TREATS";
  if (eje.some(e=>["simbólico","comunitario","territorial"].includes(e))) return "REAL FAMILY MOMENTS";
  return "DIARY OF REAL MOMS";
}

function axesFrom(topico: TopicoLite): string[] {
  // Normaliza de los datos entrantes
  const raw = (topico.ejesDetectados || []).map(e => e.trim());
  // si viniera vacío: heurística suave por nombre/categoría
  if (raw.length) return raw;
  const n = (topico.nombre || "").toLowerCase() + " " + (topico.categoria||"").toLowerCase();
  const out = new Set<string>();
  if (/(lloro|lloré|culpa|tierno|nostal|ansied|estrés|cansancio)/.test(n)) out.add("Emocional");
  if (/(cuento|historia|diario|confieso|vs|realidad)/.test(n)) out.add("Narrativo");
  if (/(familia|abue|tradici|ritual|hered|juntos)/.test(n)) { out.add("Simbólico"); out.add("Comunitario"); }
  if (/(cocina|receta|comer|sabor|pan|galleta|leche|aroma)/.test(n)) out.add("Sensorial");
  if (/(cdmx|jalisco|puebla|nuevo león|edomex|oaxaca)/.test(n)) out.add("Territorial");
  return Array.from(out);
}

function isValidUniverse(members: TopicoLite[], centroid: number[], label: string) {
  // Reglas ALMA compactadas para UI:
  const axesCount = new Set(members.flatMap(axesFrom)).size;
  const estados = new Set<string>();
  members.forEach(m => (m.estadosResonancia||[]).forEach(e => estados.add(e.estado)));
  const ok =
    members.length >= MIN_CLUSTER &&
    axesCount >= AXIS_MIN;
  return { ok, axesCount, estados: Array.from(estados) };
}

export async function clusterTopicos(rows: TopicoLite[]): Promise<{ universos: Universo[], asignacion: Record<string,string> }> {
  if (!rows?.length) return { universos: [], asignacion: {} };

  // 1) Embeddings (fallback auto) — usamos solo 'nombre'
  const texts = rows.map(r => r.nombre || "");
  const vecs = await embedBatch(texts);

  // 2) Grafo de similitud por umbral
  const N = rows.length;
  const adj: number[][] = Array.from({length:N},()=>[]);
  for (let i=0;i<N;i++){
    for (let j=i+1;j<N;j++){
      const s = cosine(vecs[i], vecs[j]);
      if (s >= SIM_THRESHOLD) { adj[i].push(j); adj[j].push(i); }
    }
  }

  // 3) Componentes conexas (Union-Find / DFS)
  const seen = new Array<boolean>(N).fill(false);
  const comps: number[][] = [];
  const dfs = (i:number, acc:number[]) => {
    seen[i]=true; acc.push(i);
    for (const j of adj[i]) if (!seen[j]) dfs(j, acc);
  };
  for (let i=0;i<N;i++){
    if (!seen[i]){ const acc:number[]=[]; dfs(i, acc); comps.push(acc); }
  }

  // 4) Reducimos “ruido” (clusters pequeños) fusionándolos al centroide más cercano
  const big: number[][] = [], small: number[][] = [];
  comps.forEach(c=> (c.length>=Math.max(6, Math.floor(MIN_CLUSTER/3)) ? big : small).push(c));

  // Centroides preliminares de clusters grandes
  const centroids = big.map(c=>{
    const m = new Array(vecs[0].length).fill(0);
    c.forEach(idx => {
      const v = vecs[idx];
      for (let k=0;k<m.length;k++) m[k]+=v[k]||0;
    });
    for (let k=0;k<m.length;k++) m[k]/=c.length;
    return m;
  });

  // Asignar “small” al centroide más cercano
  for (const c of small){
    // centroide del pequeño
    const tmp = new Array(vecs[0].length).fill(0);
    c.forEach(idx=>{ const v=vecs[idx]; for (let k=0;k<tmp.length;k++) tmp[k]+=v[k]||0; });
    for (let k=0;k<tmp.length;k++) tmp[k]/=c.length;
    // elegir destino
    let best = 0, bestSim = -1;
    for (let i=0;i<centroids.length;i++){
      const s = cosine(tmp, centroids[i]);
      if (s>bestSim){ bestSim=s; best=i; }
    }
    if (!big[best]) big[best]=[];
    big[best].push(...c);
  }

  // 5) Construir universos + validación ALMA
  const universos: Universo[] = [];
  const asignacion: Record<string,string> = {};

  big.forEach((idxs, uidx) => {
    // centroide final
    const m = new Array(vecs[0].length).fill(0);
    idxs.forEach(ix=>{ const v=vecs[ix]; for (let k=0;k<m.length;k++) m[k]+=v[k]||0; });
    for (let k=0;k<m.length;k++) m[k]/=idxs.length;

    const members = idxs.map(i => rows[i]);
    const axesAll = new Set(members.flatMap(axesFrom));
    const { ok, axesCount, estados } = isValidUniverse(members, m, "");

    // etiqueta rápida (usamos el n-gram más frecuente de nombres)
    const label = (() => {
      const bag = new Map<string,number>();
      members.forEach(x => {
        const t = (x.nombre||"").toLowerCase().split(/[^a-záéíóúñ0-9]+/).filter(Boolean);
        for (const w of t) bag.set(w, (bag.get(w)||0)+1);
      });
      return Array.from(bag.entries()).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k).join(" ");
    })() || `Universo ${uidx+1}`;

    const u: Universo = {
      id: `U${uidx+1}`,
      label,
      size: members.length,
      centroid: m,
      ejesDominantes: Array.from(axesAll),
      estados,
      confianza: Math.min(1, (axesCount/6)*0.4 + Math.min(1, members.length/120)*0.6),
      pilar: "DIARY OF REAL MOMS",
      members: members.map(m => m.id),
    };
    u.pilar = pillarHeuristics(u);

    // aplicar reglas ALMA mínimas para UI; si no pasa, igual lo devolvemos (confianza baja)
    universos.push(u);
    u.members.forEach(id => asignacion[id] = u.id);
  });

  return { universos, asignacion };
}
