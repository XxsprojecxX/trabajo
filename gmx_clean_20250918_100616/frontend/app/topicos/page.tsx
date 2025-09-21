 'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

// ===================================================================================
// AJUSTE: INICIO DE LAS NUEVAS UTILIDADES ALMA
// ===================================================================================

// === ALMA: clustering sin cambiar el diseño de burbujas ======================
type AxisKey = 'emocional'|'narrativo'|'simbolico'|'territorial'|'comunitario'|'sensorial';

type AlmaVector = {
  id: string;
  text: string;
  axesActive: Partial<Record<AxisKey, number>>; // 0..1 por eje
  tfidf: Map<string, number>;
  vol: number;
};

type AlmaCluster = {
  id: string;
  topicIds: string[];
  axesScore: Partial<Record<AxisKey, number>>;
  confidence: number;     // 0..1
};

const AXES: AxisKey[] = ['emocional','narrativo','simbolico','territorial','comunitario','sensorial'];

const norm = (v:number)=> (isFinite(v)?Math.max(0,Math.min(1,v)):0);

// Heurística: inferir activación de ejes cuando no venga explícito
function inferAxesFromTopico(t: Topico): Partial<Record<AxisKey, number>> {
  const txt = (t.nombre ?? '').toLowerCase();
  const ejes = (t.ejesDetectados ?? []).map(e=>e.toLowerCase());

  const has = (k:string)=> ejes.some(e=>e.includes(k)) || txt.includes(k);

  return {
    emocional:  has('ternura')||has('nostalgia')||has('culpa')||has('emocion') ? 0.9 : 0.4,
    narrativo:  has('historia')||has('cuento')||has('story')||has('diario') ? 0.9 : 0.5,
    simbolico:  has('capital')||has('estatus')||has('cultural')||has('social') ? 0.8 : 0.4,
    territorial: has('cdmx')||has('jalisco')||has('edo')||has('puebla')||has('nl')||has('oaxaca') ? 0.9 : 0.3,
    comunitario: has('comunidad')||has('familia')||has('red')||has('tribu') ? 0.8 : 0.4,
    sensorial:  has('olor')||has('sabor')||has('textura')||has('receta')||has('cocina') ? 0.9 : 0.3,
  };
}

// Tokenizador sencillo español (para TF-IDF)
function tokensES(s:string){
  return (s||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s#@]/gi,' ')
    .split(/\s+/).filter(w=>w.length>2 && !STOP_ES.has(w));
}
const STOP_ES = new Set(['con','las','los','una','unos','unas','que','del','por','para','pero','como','nos','mis','sus','tan','muy','asi','más','mas','sin','este','esta','aun','aún','ese','esa','aqui','aquí','de','la','el','en','y','o','u','al','se','tu','te','me','es']);

// TF-IDF local (fallback cuando no haya embeddings)
function buildTfidf(rows: Topico[]): {vecs: AlmaVector[], vocab: Map<string, number>} {
  const docs = rows.map(r => (r.nombre ?? ''));
  const vocab = new Map<string, number>();
  const docTokens = docs.map(tokensES);
  // DF
  const df = new Map<string, number>();
  docTokens.forEach(set => {
    new Set(set).forEach(tok=>{
      df.set(tok, (df.get(tok)??0)+1);
    });
  });
  // TF-IDF
  const N = docs.length || 1;
  const vecs: AlmaVector[] = rows.map((t, i) => {
    const tf = new Map<string, number>();
    docTokens[i].forEach(tok=> tf.set(tok, (tf.get(tok)??0)+1));
    const tfidf = new Map<string, number>();
    tf.forEach((f, tok)=>{
      const idf = Math.log( (N + 1) / ((df.get(tok)??1) + 1) ) + 1;
      tfidf.set(tok, f*idf);
      if(!vocab.has(tok)) vocab.set(tok, vocab.size);
    });
    return {
      id: t.id,
      text: docs[i],
      axesActive: inferAxesFromTopico(t),
      tfidf,
      vol: Number(t.volumen ?? t.volume ?? 0)
    };
  });
  return { vecs, vocab };
}

// Coseno entre TF-IDF con ponderación por ejes (similitud ALMA)
function almaCosine(a: AlmaVector, b: AlmaVector): number {
  // TF-IDF dot
  let dot = 0, na = 0, nb = 0;
  a.tfidf.forEach((va, k)=>{
    const vb = b.tfidf.get(k) ?? 0;
    dot += va*vb; na += va*va;
  });
  b.tfidf.forEach(vb=> { nb += vb*vb; });
  const cos = dot / (Math.sqrt(na||1)*Math.sqrt(nb||1));

  // Ejes: promedio de coincidencias (refuerza similitud)
  let axesDot = 0; let axesN = 0;
  AXES.forEach(ax=>{
    const va = norm(a.axesActive[ax] ?? 0);
    const vb = norm(b.axesActive[ax] ?? 0);
    axesDot += 1 - Math.abs(va - vb); // más parecido => más alto
    axesN++;
  });
  const axesSim = axesDot / (axesN||1); // 0..1

  // Ponderación final (ajustable)
  return 0.7*cos + 0.3*axesSim;
}

// Clustering jerárquico simple con validación de ALMA
function clusterALMA(rows: Topico[]): AlmaCluster[] {
  const { vecs } = buildTfidf(rows);

  // matriz de similitud (sólo si N <= 400 por performance en cliente)
  const N = vecs.length;
  const SIM_TH = 0.62;          // ~>85% coseno cuando ejes empujan (tu umbral)
  const MIN_CLUSTER = 5;      // luego validamos >= 500 conversaciones por cluster (volumen agregado)
  const links: [number,number][] = [];

  for(let i=0;i<N;i++){
    for(let j=i+1;j<N;j++){
      if (almaCosine(vecs[i], vecs[j]) >= SIM_TH) links.push([i,j]);
    }
  }

  // Unión de componentes (Union-Find)
  const parent = Array.from({length:N}, (_,i)=>i);
  const find = (x:number)=> parent[x]===x?x:(parent[x]=find(parent[x]));
  const unite = (a:number,b:number)=> { a=find(a); b=find(b); if(a!==b) parent[b]=a; };
  links.forEach(([i,j])=>unite(i,j));

  const groups = new Map<number, number[]>();
  for (let i=0;i<N;i++){
    const r = find(i);
    if(!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }

  // Validación ALMA (>=3 ejes activos, coherencia y volumen total)
  const clusters: AlmaCluster[] = [];
  Array.from(groups.values()).forEach(indexes=>{
    if(indexes.length < MIN_CLUSTER) return;

    const topicIds = indexes.map(k=> vecs[k].id);
    const axesScore: Partial<Record<AxisKey, number>> = {};
    AXES.forEach(ax=>{
      const m = indexes.reduce((s,k)=> s + norm(vecs[k].axesActive[ax] ?? 0), 0)/indexes.length;
      axesScore[ax]=m;
    });
    const numAxesActive = AXES.filter(ax => (axesScore[ax]??0) >= 0.6).length;

    // coherencia semántica (promedio de similitudes internas)
    let sims = 0, cnt = 0;
    for (let a=0;a<indexes.length;a++){
      for (let b=a+1;b<indexes.length;b++){
        sims += almaCosine(vecs[indexes[a]], vecs[indexes[b]]);
        cnt++;
      }
    }
    const coherence = cnt? sims/cnt : 0;

    // volumen agregado (proxy conversaciones)
    const totalVol = indexes.reduce((s,k)=> s + (vecs[k].vol || 0), 0);

    const passes = numAxesActive>=3 && coherence>0.8 && totalVol>=500;
    if (!passes) return;

    clusters.push({
      id: `u_${clusters.length+1}`,
      topicIds,
      axesScore,
      confidence: Math.min(1, (0.4*coherence) + (0.2*(numAxesActive/6)) + (0.4*Math.min(1, totalVol/5000)))
    });
  });

  // Si quedó todo suelto, crear 6 “universos semilla” por eje dominante (fallback)
  if (!clusters.length && N>0){
    const buckets: Record<AxisKey, string[]> = {emocional:[],narrativo:[],simbolico:[],territorial:[],comunitario:[],sensorial:[]};
    vecs.forEach(v=>{
      const best = AXES.map(ax=>[ax, v.axesActive[ax]??0] as const).sort((a,b)=>b[1]-a[1])[0][0];
      buckets[best].push(v.id);
    });
    AXES.forEach((ax, i)=>{
      const ids = buckets[ax];
      if(ids.length>=MIN_CLUSTER){
        clusters.push({ id:`u_${i+1}`, topicIds:ids, axesScore:{[ax]:0.85}, confidence:0.72 });
      }
    });
  }

  return clusters;
}

// ===================================================================================
// FIN DE LAS NUEVAS UTILIDADES ALMA
// ===================================================================================


// === Agrupación visual por universos (si el backend ya los adjuntó) ===
function layoutPorUniversos(items: any[], ancho: number, alto: number) {
  const computeFallback = () => {
    if (!items.length || !ancho || !alto) {
      const cx = ancho ? ancho / 2 : 0;
      const cy = alto ? alto / 2 : 0;
      return items.map((it) => ({ ...it, px: cx, py: cy, size: 60 }));
    }

    const groups = new Map<string, any[]>();
    for (const it of items) {
      const g = it.universeId || "U?";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(it);
    }

    const ids = Array.from(groups.keys());
    const cols = Math.ceil(Math.sqrt(ids.length || 1));
    const rows = Math.ceil(ids.length / cols);
    const pad = 80;
    const cellW = Math.max(320, (ancho - pad * 2) / cols);
    const cellH = Math.max(240, (alto - pad * 2) / rows);
    const centers = new Map<string, { cx: number; cy: number }>();
    ids.forEach((id, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      centers.set(id, { cx: pad + c * cellW + cellW / 2, cy: pad + r * cellH + cellH / 2 });
    });

    const out: any[] = [];
    for (const [gid, arr] of groups) {
      const center = centers.get(gid)!;
      const sorted = [...arr].sort((a, b) => (Number(b.volumen ?? b.volume ?? 0) - Number(a.volumen ?? a.volume ?? 0)));
      let placed = 0;
      let ring = 0;
      while (placed < sorted.length) {
        const k = ring === 0 ? 1 : Math.min(sorted.length - placed, 6 + ring * 4);
        const rad = ring * 60;
        for (let i = 0; i < k; i++) {
          const itemIndex = placed + i;
          if (itemIndex >= sorted.length) break;
          const angle = k > 1 ? (2 * Math.PI * (i / k) + ring * 0.35) : 0;
          const x = center.cx + Math.cos(angle) * rad;
          const y = center.cy + Math.sin(angle) * rad;
          const currentItem = sorted[itemIndex];
          const volumeValue = Math.max(0, Number(currentItem.volume ?? currentItem.volumen ?? 0));
          const size = Math.max(48, Math.min(120, Math.sqrt(volumeValue) * 10 || 48));
          out.push({ ...currentItem, px: x, py: y, size });
        }
        placed += k;
        ring++;
        if (ring > 8) break;
      }
    }
    return out;
  };

  const fallback = computeFallback();
  const coordItems = items.filter((it) => isFiniteNumber(it?.coords?.x) && isFiniteNumber(it?.coords?.y));
  if (!coordItems.length) {
    return fallback;
  }
  const xs = coordItems.map((it) => Number(it.coords!.x));
  const ys = coordItems.map((it) => Number(it.coords!.y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;
  const pad = 60;
  const innerW = Math.max(0, ancho - pad * 2);
  const innerH = Math.max(0, alto - pad * 2);
  const mapById = new Map(items.map((it: any) => [it.id, it]));

  return fallback.map((node) => {
    const original = mapById.get(node.id);
    const c = original?.coords;
    if (c && isFiniteNumber(c.x) && isFiniteNumber(c.y)) {
      const nx = (Number(c.x) - minX) / rangeX;
      const ny = (Number(c.y) - minY) / rangeY;
      const px = pad + nx * innerW;
      const py = pad + ny * innerH;
      const v = Math.max(0, Number(original?.volumen ?? original?.volume ?? 0));
      const size = Math.max(48, Math.min(140, Math.sqrt(v) * 10 || 48));
      return { ...node, px, py, size };
    }
    return node;
  });
}


/** Tipado laxo y opcional: nada rompe si falta */
type Sentimiento = { positivo?: number; neutral?: number; negativo?: number };
type Emociones = Partial<Record<
  | 'alegria' | 'enojo' | 'sorpresa' | 'miedo' | 'tristeza'
  | 'nostalgia' | 'ternura' | 'orgullo' | 'estres' | 'culpa' | 'cansancio',
  number
>>;
type EstadoResonancia = { estado: string; porcentaje: number; intensidad: 'alta'|'media'|'baja' };

export interface Topico {
  id: string;
  nombre?: string;
  volumen?: number;    // fuente BigQuery v2
  volume?: number;     // otras fuentes
  sentimiento?: Sentimiento;
  emociones?: Emociones;
  engagement?: number;
  oportunidad?: number;
  categoria?: string;
  ejesDetectados?: string[];
  pilarAsociado?: string; // mayúsculas
  pilar?: string;         // variantes
  capitalSimbolicoDetectado?: string[];
  nseInferido?: string;
  contextoTerritorial?: string;
  estadosResonancia?: EstadoResonancia[];
  coords?: { x?: number; y?: number };
  x?: number;
  y?: number;
  conexiones?: string[];
  universeId?: string; // Campo añadido por el backend
   universeLabel?: string;
  universePilar?: string;
  universeConfianza?: number;
  universeColor?: string;
  universeSize?: number;
}
type GraphDisplayNode = Topico & { x: number; y: number; radius: number };
type GraphDisplayLink = { source: string; target: string };

type SimNode = {
  id: string;
  topico: Topico;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type SimLink = { source: SimNode; target: SimNode };

type SentimentKey = 'positivo' | 'neutral' | 'negativo';

const SENTIMENT_LABELS: Record<SentimentKey, string> = {
  positivo: 'Positivo',
  neutral: 'Neutral',
  negativo: 'Negativo',
};

function getTopicoVolume(topico: Topico): number {
  const raw = Number(topico.volumen ?? topico.volume ?? 0);
  return Number.isFinite(raw) ? Math.max(0, raw) : 0;
}

function computeNodeRadius(volume: number, width: number, maxVolume: number): number {
  const responsive = width < 640 ? 0.75 : width < 1024 ? 0.9 : 1;
  const minRadius = 18 * responsive;
  const maxRadius = 58 * responsive;
  if (!maxVolume || maxVolume <= 0) return minRadius;
  const ratio = Math.sqrt(Math.max(0, volume) / maxVolume);
  const size = minRadius + ratio * (maxRadius - minRadius);
  return Math.max(minRadius, Math.min(maxRadius, size));
}

function wrapLabel(text: string | undefined, maxChars: number): string[] {
  if (!text) return ['Sin nombre'];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else if (candidate.length > maxChars) {
      lines.push(word);
      current = '';
    } else {
      current = candidate;
    }
  });

  if (current) lines.push(current);

  return lines.slice(0, 3);
}

function sentimentPalette(label: SentimentKey): { fill: string; stroke: string } {
  switch (label) {
    case 'positivo':
      return { fill: 'rgba(52, 211, 153, 0.18)', stroke: '#34d399' };
    case 'negativo':
      return { fill: 'rgba(248, 113, 113, 0.18)', stroke: '#f87171' };
    default:
      return { fill: 'rgba(251, 191, 36, 0.2)', stroke: '#f59e0b' };
  }
}

function dominantSentiment(topico: Topico): { label: SentimentKey; value: number } {
  const data = topico.sentimiento ?? {};
  const entries: { label: SentimentKey; value: number }[] = [
    { label: 'positivo', value: Number(data.positivo ?? 0) },
    { label: 'neutral', value: Number(data.neutral ?? 0) },
    { label: 'negativo', value: Number(data.negativo ?? 0) },
  ];
  entries.sort((a, b) => b.value - a.value);
  const best = entries[0];
  return { label: best.label, value: Math.max(0, Math.round(best.value)) };
}

function runForceSimulation(nodes: SimNode[], links: SimLink[], width: number, height: number) {
  if (!nodes.length) return;

  const iterations = 240;
  const repulsionStrength = 2400;
  const linkStrength = 0.018;
  const damping = 0.88;
  const maxVelocity = 5.5;
  const margin = 14;
  const viewSize = Math.max(120, Math.min(width, height));
  const baseLinkDistance = Math.max(140, Math.min(viewSize * 0.45, 280));

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        let dx = nodeB.x - nodeA.x;
        let dy = nodeB.y - nodeA.y;
        let distSq = dx * dx + dy * dy;
        if (distSq === 0) {
          const jitterX = (Math.random() - 0.5) * 0.5;
          const jitterY = (Math.random() - 0.5) * 0.5;
          dx = jitterX;
          dy = jitterY;
          distSq = dx * dx + dy * dy;
        }
        let dist = Math.sqrt(distSq);
        const minDist = nodeA.radius + nodeB.radius + 18;
        if (dist < minDist) dist = minDist;
        const force = repulsionStrength / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;
      }
    }

    links.forEach((link) => {
      const source = link.source;
      const target = link.target;
      let dx = target.x - source.x;
      let dy = target.y - source.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const ideal = baseLinkDistance + (source.radius + target.radius) * 0.5;
      const diff = dist - ideal;
      const fx = (dx / dist) * diff * linkStrength;
      const fy = (dy / dist) * diff * linkStrength;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    nodes.forEach((node) => {
      node.vx += ((width / 2) - node.x) * 0.005;
      node.vy += ((height / 2) - node.y) * 0.005;

      node.vx *= damping;
      node.vy *= damping;

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > maxVelocity) {
        const scale = maxVelocity / speed;
        node.vx *= scale;
        node.vy *= scale;
      }

      node.x += node.vx;
      node.y += node.vy;

      const limit = node.radius + margin;
      node.x = Math.max(limit, Math.min(width - limit, node.x));
      node.y = Math.max(limit, Math.min(height - limit, node.y));
    });
  }
}

function buildGraphLayout(topicos: Topico[], width: number, height: number): { nodes: GraphDisplayNode[]; links: GraphDisplayLink[] } {
  const volumes = topicos.map(getTopicoVolume);
  const maxVolume = volumes.reduce((max, vol) => (vol > max ? vol : max), 0) || 1;
  const baseRadius = Math.min(width, height) / 2.6;

  const nodes: SimNode[] = topicos.map((topico, index) => {
    const radius = computeNodeRadius(volumes[index], width, maxVolume);
    const angle = (index / Math.max(1, topicos.length)) * Math.PI * 2;
    return {
      id: topico.id,
      topico,
      radius,
      x: width / 2 + Math.cos(angle) * baseRadius * 0.6 + (Math.random() - 0.5) * 40,
      y: height / 2 + Math.sin(angle) * baseRadius * 0.6 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
    };
  });

  const nodeIndex = new Map(nodes.map((node) => [node.id, node]));
  const links: GraphDisplayLink[] = [];
  const seen = new Set<string>();

  nodes.forEach((node) => {
    (node.topico.conexiones ?? []).forEach((targetId) => {
      if (!nodeIndex.has(targetId)) return;
      const key = node.id < targetId ? `${node.id}|${targetId}` : `${targetId}|${node.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({ source: node.id, target: targetId });
    });
  });

  const simLinks: SimLink[] = links.map((link) => ({
    source: nodeIndex.get(link.source)!,
    target: nodeIndex.get(link.target)!,
  }));

  runForceSimulation(nodes, simLinks, width, height);

  const graphNodes: GraphDisplayNode[] = nodes.map((node) => ({
    ...node.topico,
    x: node.x,
    y: node.y,
    radius: node.radius,
  }));

  return { nodes: graphNodes, links };
}

function useForceGraph(topicos: Topico[], width: number, height: number) {
  return useMemo(() => {
    if (!topicos.length || width <= 0 || height <= 0) {
      return { nodes: [] as GraphDisplayNode[], links: [] as GraphDisplayLink[] };
    }
    return buildGraphLayout(topicos, width, height);
  }, [topicos, width, height]);
}


/** ====== Metadatos de Pilares (4 fijos) ====== */
type PilarMeta = {
  nombre: string;
  descripcion: string;
  ejes: string[];
  kpis: string[];
  estado: 'Activo' | 'Oportunidad' | 'Emergente';
  activacion: number; // %
};

const PILARES: Record<string, PilarMeta> = {
  'DIARY OF REAL MOMS': {
    nombre: 'DIARY OF REAL MOMS',
    descripcion: 'Contenido enfocado en experiencia personal, anécdotas, confesiones y testimonios de la maternidad.',
    ejes: ['Narrativo', 'Emocional'],
    kpis: ['Testimonios auténticos', 'Engagement emocional', 'Storytime resonance'],
    estado: 'Activo',
    activacion: 85,
  },
  'RECIPES THAT HUG': {
    nombre: 'RECIPES THAT HUG',
    descripcion: 'Cocina emocional + intuitiva + gestión familiar. Pilar emergente de alta resonancia.',
    ejes: ['Sensorial', 'Emocional', 'Narrativo'],
    kpis: ['Cocina emocional (91%)', 'Intuitiva (88%)', 'Gestión familiar (90%)'],
    estado: 'Emergente',
    activacion: 78,
  },
  'REAL FAMILY MOMENTS': {
    nombre: 'REAL FAMILY MOMENTS',
    descripcion: 'Interacciones y rituales familiares donde el producto está presente.',
    ejes: ['Simbólico', 'Comunitario', 'Territorial'],
    kpis: ['Rituales familiares', 'Tradiciones heredadas', 'Conexión intergeneracional'],
    estado: 'Oportunidad',
    activacion: 72,
  },
  'AUTHENTIC TREATS': {
    nombre: 'AUTHENTIC TREATS',
    descripcion: 'El producto como elemento de placer, consuelo o recompensa consciente.',
    ejes: ['Sensorial', 'Emocional'],
    kpis: ['Experiencia sensorial', 'Momentos de placer', 'Confort emocional'],
    estado: 'Activo',
    activacion: 68,
  },
};

/** Helpers de normalización/labels (solo 4 pilares) */
function PilarLabel(p?: string) {
  if (!p) return '';
  const k = p.trim().toLowerCase();
  if (k.includes('diary') || k.includes('real moms')) return 'DIARY OF REAL MOMS';
  if (k.includes('recipes that hug') || k.includes('recipes')) return 'RECIPES THAT HUG';
  if (k.includes('real family')) return 'REAL FAMILY MOMENTS';
  if (k.includes('authentic treats') || k.includes('treat')) return 'AUTHENTIC TREATS';
  return '';
}

/** Heurística: decide pilar a partir de ejes/categoría si no hay label confiable */
function resolvePilar(t: Topico): 'DIARY OF REAL MOMS' | 'RECIPES THAT HUG' | 'REAL FAMILY MOMENTS' | 'AUTHENTIC TREATS' {
  const direct = PilarLabel(t.pilarAsociado ?? t.pilar ?? '');
  if (direct && PILARES[direct]) return direct as keyof typeof PILARES;

  const ejes = (t.ejesDetectados || []).map(e => e.toLowerCase());
  const cat = (t.categoria || '').toLowerCase();
  const has = (k: string) => ejes.some(e => e.includes(k));
  const esCocina = /cocina|recipe|receta|culinari/.test(cat) || (t.nombre || '').toLowerCase().includes('cocina');

  if (has('sensorial')) {
    if (esCocina || has('narrativo') || has('comunitario')) return 'RECIPES THAT HUG';
    return 'AUTHENTIC TREATS';
  }
  if (has('territorial') || has('simbólico') || has('comunitario')) return 'REAL FAMILY MOMENTS';
  if (has('narrativo') || has('emocional')) return 'DIARY OF REAL MOMS';
  return 'DIARY OF REAL MOMS';
}

function getPilarMeta(p?: string): PilarMeta | null {
  const key = PilarLabel(p || '');
  return PILARES[key] ?? null;
}

/** Fórmula reproducible de oportunidad si falta (no pisa datos reales) */
function deriveOportunidad(t: Topico) {
  const s = t.sentimiento ?? {};
  const emo = t.emociones ?? {};
  const pos = s.positivo ?? 0;
  const ternura = emo.ternura ?? 0;
  const nostalgia = emo.nostalgia ?? 0;
  const stressInv = 100 - (emo.estres ?? 0);
  const eng = t.engagement ?? 0;
  const engPct = eng > 1 ? eng : eng * 10;
  const score = (pos * 0.55) + ((ternura + nostalgia) * 0.15) + (stressInv * 0.1) + (engPct * 0.2);
  return Math.round(score);
}
const isFiniteNumber = (value: any): value is number => typeof value === 'number' && Number.isFinite(value);

function coerceNumber(value: any): number | undefined {
  if (isFiniteNumber(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(/[%]/g, '').replace(/,/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : undefined;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return undefined;
}

function coerceString(value: any): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (isFiniteNumber(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    const str = coerceString(value);
    if (str) return str;
  }
  return undefined;
}

function parseMaybeJson(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
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
      if (typeof TextDecoder !== 'undefined') {
        return JSON.parse(new TextDecoder().decode(value));
      }
    } catch {
      return null;
    }
  }
  return null;
}

function ensureArray(value: any): any[] | undefined {
  if (Array.isArray(value)) return value;
  const parsed = parseMaybeJson(value);
  return Array.isArray(parsed) ? parsed : undefined;
}

const clampPercentage = (num: number) => Math.max(0, Math.min(100, num));

function normalizeSentimiento(value: any): Sentimiento | undefined {
  const obj = parseMaybeJson(value);
  if (!obj || typeof obj !== 'object') return undefined;
  const out: Sentimiento = {};
  const pos = coerceNumber((obj as any).positivo ?? (obj as any).positive ?? (obj as any).pos ?? (obj as any).favorable);
  if (pos !== undefined) out.positivo = clampPercentage(pos);
  const neu = coerceNumber((obj as any).neutral ?? (obj as any).neutro ?? (obj as any).mid);
  if (neu !== undefined) out.neutral = clampPercentage(neu);
  const neg = coerceNumber((obj as any).negativo ?? (obj as any).negative ?? (obj as any).neg ?? (obj as any).desfavorable);
  if (neg !== undefined) out.negativo = clampPercentage(neg);
  return Object.keys(out).length ? out : undefined;
}

function normalizeEmociones(value: any): Emociones | undefined {
  const obj = parseMaybeJson(value);
  if (!obj || typeof obj !== 'object') return undefined;
  const out: Emociones = {};
  Object.entries(obj as Record<string, any>).forEach(([key, val]) => {
    const num = coerceNumber(val);
    if (num !== undefined) out[key] = clampPercentage(num);
  });
  return Object.keys(out).length ? out : undefined;
}

function normalizeStringArray(value: any): string[] | undefined {
  if (value === null || value === undefined) return undefined;
  const arr = ensureArray(value);
  if (arr) {
    const list = arr.map(coerceString).filter((v): v is string => !!v);
    return list.length ? Array.from(new Set(list)) : [];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return normalizeStringArray(parsed) ?? [];
      }
    } catch {
      // ignore
    }
    return Array.from(new Set(trimmed.split(/[,;|]/).map((part) => part.trim()).filter(Boolean)));
  }
  return undefined;
}

function normalizeCoords(value: any, fallbackX?: any, fallbackY?: any): { x?: number; y?: number } | undefined {
  const parsed = parseMaybeJson(value);
  let x: number | undefined;
  let y: number | undefined;

  if (Array.isArray(parsed)) {
    x = coerceNumber(parsed[0]);
    y = coerceNumber(parsed[1]);
  } else if (parsed && typeof parsed === 'object') {
    x = coerceNumber((parsed as any).x ?? (parsed as any).lon ?? (parsed as any).lng ?? (parsed as any).longitude ?? (parsed as any)[0]);
    y = coerceNumber((parsed as any).y ?? (parsed as any).lat ?? (parsed as any).latitude ?? (parsed as any)[1]);
  }

  if (x === undefined && y === undefined) {
    x = coerceNumber(fallbackX);
    y = coerceNumber(fallbackY);
  }

  if (x === undefined && y === undefined) return undefined;
  const coords: { x?: number; y?: number } = {};
  if (x !== undefined) coords.x = x;
  if (y !== undefined) coords.y = y;
  return coords;
}

function normalizeIntensity(value: string): EstadoResonancia['intensidad'] | undefined {
  const lower = value.toLowerCase();
  if (lower.includes('alta') || lower.includes('high')) return 'alta';
  if (lower.includes('media') || lower.includes('mid') || lower.includes('medium')) return 'media';
  if (lower.includes('baja') || lower.includes('low')) return 'baja';
  return undefined;
}

function normalizeEstados(value: any): EstadoResonancia[] | undefined {
  const arr = ensureArray(value);
  if (!arr) return undefined;
  const out: EstadoResonancia[] = [];
  arr.forEach((entry) => {
    const obj = parseMaybeJson(entry);
    if (obj && typeof obj === 'object') {
      const estado = firstString((obj as any).estado, (obj as any).state, (obj as any).nombre, (obj as any).label) ?? '—';
      const porcentaje = coerceNumber((obj as any).porcentaje ?? (obj as any).percent ?? (obj as any).pct ?? (obj as any).valor ?? (obj as any).value);
      const intensidad = coerceString((obj as any).intensidad ?? (obj as any).intensity ?? (obj as any).nivel ?? (obj as any).level);
      const payload: EstadoResonancia = { estado };
      if (porcentaje !== undefined) payload.porcentaje = porcentaje;
      const normInt = intensidad ? normalizeIntensity(intensidad) : undefined;
      if (normInt) payload.intensidad = normInt;
      if (payload.estado || payload.porcentaje !== undefined || payload.intensidad) {
        out.push(payload);
      }
    } else if (typeof entry === 'string') {
      out.push({ estado: entry });
    }
  });
  return out.length ? out : undefined;
}

function normalizeDate(value: any): string | undefined {
  const str = firstString(value);
  if (!str) return undefined;
  const dt = new Date(str);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString();
  return str;
}

function prepareTopico(raw: any, idx: number): Topico {
  const sentimiento = normalizeSentimiento(raw?.sentimiento ?? raw?.sentiment);
  const emociones = normalizeEmociones(raw?.emociones ?? raw?.emotions);
  const coords = normalizeCoords(raw?.coords ?? raw?.coord ?? raw?.coordinates, raw?.x, raw?.y);
  const conexiones = normalizeStringArray(raw?.conexiones ?? raw?.connections ?? raw?.connection_ids) ?? [];
  const ejes = normalizeStringArray(raw?.ejesDetectados ?? raw?.ejes_detectados ?? raw?.ejes ?? raw?.axes) ?? [];
  const capital = normalizeStringArray(
    raw?.capitalSimbolicoDetectado ?? raw?.capital_simbolico_detectado ?? raw?.capitalSimbolico ?? raw?.symbolic_capital
  ) ?? [];
  const estados = normalizeEstados(raw?.estadosResonancia ?? raw?.resonancia_estados ?? raw?.resonance_states) ?? [];

  const volumenBase = coerceNumber(raw?.volumen ?? raw?.volume ?? raw?.volumen_total ?? raw?.total_volume);
  const volumeAlt = coerceNumber(raw?.volume ?? raw?.volumen);
  const volumen = volumenBase ?? volumeAlt ?? 0;
  const lastTs = normalizeDate(raw?.last_ts ?? raw?.lastSeen ?? raw?.last_seen ?? raw?.updated_at ?? raw?.last_update ?? raw?.lastUpdate);

  const oportunidadRaw = coerceNumber(raw?.oportunidad ?? raw?.opportunity ?? raw?.oportunidad_score ?? raw?.oportunidadIndex);
  const engagement = coerceNumber(raw?.engagement ?? raw?.engagement_rate ?? raw?.engagement_pct ?? raw?.tasa_engagement) ?? 0;

  const universeId = firstString(raw?.universeId, raw?.universe_id, raw?.universoId, raw?.universo_id);
  const universeLabel = firstString(raw?.universeLabel, raw?.universe_label, raw?.universoLabel, raw?.universo_label);
  const universePilar = firstString(raw?.universePilar, raw?.universe_pilar, raw?.universoPilar, raw?.universo_pilar);
  const universeConfianza = coerceNumber(raw?.universeConfianza ?? raw?.universe_confianza ?? raw?.universoConfianza ?? raw?.universo_confianza);
  const universeColor = firstString(raw?.universeColor, raw?.universe_color, raw?.universoColor, raw?.universo_color);
  const universeSize = coerceNumber(raw?.universeSize ?? raw?.universe_size ?? raw?.universoSize ?? raw?.universo_size);

  const baseForScore: Topico = {
    ...(raw as Topico),
    sentimiento: sentimiento ?? {},
    emociones: emociones ?? {},
  };

  return {
    ...(raw as Topico),
    id: firstString(raw?.id, raw?.id_conversacion, raw?.id_topico, raw?.topic_id) ?? `topico_${idx + 1}`,
    nombre: firstString(raw?.nombre, raw?.topic, raw?.name) ?? `Tópico ${idx + 1}`,
    volumen,
    volume: volumeAlt ?? undefined,
    categoria: firstString(raw?.categoria, raw?.category, raw?.categoria_topico) ?? (raw as Topico)?.categoria,
    last_ts: lastTs ?? (raw as Topico)?.last_ts,
    sentimiento: sentimiento ?? { positivo: 0, neutral: 0, negativo: 0 },
    emociones: emociones ?? {},
    conexiones,
    coords: coords ?? undefined,
    x: coords?.x ?? coerceNumber(raw?.x) ?? undefined,
    y: coords?.y ?? coerceNumber(raw?.y) ?? undefined,
    ejesDetectados: ejes,
    capitalSimbolicoDetectado: capital,
    estadosResonancia: estados,
    oportunidad: oportunidadRaw ?? deriveOportunidad(baseForScore),
    engagement,
    nseInferido: firstString(raw?.nseInferido, raw?.nse_inferido, raw?.nse) ?? undefined,
    contextoTerritorial: firstString(raw?.contextoTerritorial, raw?.contexto_territorial, raw?.territorio, raw?.contexto) ?? undefined,
    universeId: universeId ?? undefined,
    universeLabel: universeLabel ?? undefined,
    universePilar: universePilar ?? undefined,
    universeConfianza: universeConfianza ?? undefined,
    universeColor: universeColor ?? undefined,
    universeSize: universeSize ?? undefined,
  };
}


/** ====== Data fetch robusto con fallback ====== */
async function fetchTopicos(signal: AbortSignal): Promise<Topico[]> {
  const url = '/api/topicos/v2?limit=120'; // Apuntamos a la API v2
  try {
    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => ({}));
    const rows: Topico[] = Array.isArray(data?.items) ? data.items : [];
    if (rows.length === 0) throw new Error('API vacía');
    return rows;
  } catch {
    return [];
  }
}

interface PalabraCloud {
  palabra: string;
  topico: string;
  volumen: number;
  sentimiento: number;
  menciones: string[];
  contextos: string[];
  insights: string[];
}

export default function TopicosPage() {
  const [filtroSentimiento, setFiltroSentimiento] = useState('todos');
  const [filtroVolumen, setFiltroVolumen] = useState('todos');
  
  const [rows, setRows] = useState<Topico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topicoSeleccionado, setTopicoSeleccionado] = useState<Topico | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [mostrarExplicacionALMA, setMostrarExplicacionALMA] = useState(false);
  const [mostrarTooltipALMA, setMostrarTooltipALMA] = useState(false);
  const [timeoutTooltip, setTimeoutTooltip] = useState<NodeJS.Timeout | null>(null);

  const [palabraSeleccionada, setPalabraSeleccionada] = useState<PalabraCloud | null>(null);
  const [mostrarModalPalabra, setMostrarModalPalabra] = useState(false);

  useEffect(() => {
    const ctr = new AbortController();
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = await fetchTopicos(ctr.signal);
        const safe = data.map((t, i) => prepareTopico(t, i));

        setRows(safe);
      } catch (e: any) {
        setError(e?.message ?? 'Error de carga');
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctr.abort();
  }, []);

  const topicosFiltrados = useMemo(() => {
    return rows.filter((topico) => {
      const s = topico.sentimiento ?? { positivo: 0, neutral: 0, negativo: 0 };
      const vol = (topico.volumen ?? (topico as any).volume ?? 0);

      const cumpleSentimiento =
        filtroSentimiento === 'todos' ||
        (filtroSentimiento === 'positivo' && (s.positivo ?? 0) > 60) ||
        (filtroSentimiento === 'neutral' && (s.neutral ?? 0) > 30) ||
        (filtroSentimiento === 'negativo' && (s.negativo ?? 0) > 10);

      const cumpleVolumen =
        filtroVolumen === 'todos' ||
        (filtroVolumen === 'alto' && vol > 15000) ||
        (filtroVolumen === 'medio' && vol >= 10000 && vol <= 15000) ||
        (filtroVolumen === 'bajo' && vol < 10000);

      return cumpleSentimiento && cumpleVolumen;
    });
  }, [rows, filtroSentimiento, filtroVolumen]);

  // AJUSTE: Hooks para el layout dinámico
  const refContenedor = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1200, h: 700 });

  useEffect(() => {
    if (!refContenedor.current) return;
    const ro = new ResizeObserver(() => {
      const r = refContenedor.current!.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setBox({ w: r.width, h: r.height });
      }
    });
    ro.observe(refContenedor.current!);
    
    // Medición inicial
    const initialRect = refContenedor.current.getBoundingClientRect();
    if(initialRect.width > 0 && initialRect.height > 0) {
        setBox({w: initialRect.width, h: initialRect.height});
    }

    return () => ro.disconnect();
  }, []);

const { nodes: graphNodes, links: graphLinks } = useForceGraph(topicosFiltrados, box.w, box.h);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphDisplayNode; x: number; y: number } | null>(null);

  useEffect(() => {
    setHoverNodeId(null);
    setActiveNodeId(null);
    setTooltip(null);
  }, [topicosFiltrados]);

  const nodeIndex = useMemo(() => {
    const map = new Map<string, GraphDisplayNode>();
    graphNodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [graphNodes]);

  const conexionesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphLinks.forEach((link) => {
      if (!map.has(link.source)) map.set(link.source, new Set());
      if (!map.has(link.target)) map.set(link.target, new Set());
      map.get(link.source)!.add(link.target);
      map.get(link.target)!.add(link.source);
    });
    return map;
  }, [graphLinks]);

  const highlightedNodeId = activeNodeId ?? hoverNodeId ?? null;

  const highlightedNodes = useMemo(() => {
    if (!highlightedNodeId) return new Set<string>();
    const related = new Set<string>([highlightedNodeId]);
    const neighbours = conexionesMap.get(highlightedNodeId);
    neighbours?.forEach((id) => related.add(id));
    return related;
  }, [conexionesMap, highlightedNodeId]);

  const tooltipSentiment = useMemo(() => (tooltip ? dominantSentiment(tooltip.node) : null), [tooltip]);
  const tooltipPalette = useMemo(() => (tooltipSentiment ? sentimentPalette(tooltipSentiment.label) : null), [tooltipSentiment]);
  const tooltipOpportunity = useMemo(() => {
    if (!tooltip) return null;
    const value = Number(tooltip.node.oportunidad);
    if (Number.isFinite(value) && value > 0) return Math.round(value);
    return deriveOportunidad(tooltip.node);
  }, [tooltip]);
  const tooltipConnections = tooltip?.node.conexiones?.length ?? 0;

  const handleNodeMouseEnter = (node: GraphDisplayNode) => {
    setHoverNodeId(node.id);
    setTooltip({ node, x: node.x, y: node.y });
  };

  const handleNodeMouseLeave = (node: GraphDisplayNode) => {
    setHoverNodeId((current) => (current === node.id ? null : current));
    setTooltip((current) => {
      if (!current) return current;
      if (current.node.id !== node.id) return current;
      if (activeNodeId && activeNodeId === node.id) return current;
      return null;
    });
  };

  const handleGraphBackgroundClick = () => {
    setActiveNodeId(null);
    if (!hoverNodeId) setTooltip(null);
  };

  const abrirModal = (topico: Topico) => {
    setTopicoSeleccionado(topico);
    setModalAbierto(true);
  };

  const cerrarModal = () => { setModalAbierto(false); setTopicoSeleccionado(null); };

    const handleNodeClick = (event: ReactMouseEvent<SVGGElement>, node: GraphDisplayNode) => {
    event.stopPropagation();
    setActiveNodeId(node.id);
    setTooltip({ node, x: node.x, y: node.y });
    abrirModal(node);
  };

  const handleMouseEnterALMA = () => {
    const timeout = setTimeout(() => { setMostrarTooltipALMA(true); }, 1000);
    setTimeoutTooltip(timeout as unknown as NodeJS.Timeout);
  };
  const handleMouseLeaveALMA = () => {
    if (timeoutTooltip) { clearTimeout(timeoutTooltip); setTimeoutTooltip(null); }
    setMostrarTooltipALMA(false);
  };

    const handlePalabraClick = (palabra: string) => {
    const palabraData: PalabraCloud = {
      palabra,
      topico: palabra === 'creatividad' ? 'Escape Creativo Familiar' : 'Performance vs Realidad Maternal',
      volumen: palabra === 'creatividad' ? 12850 : 15420,
      sentimiento: palabra === 'creatividad' ? 78 : 72,
      menciones: palabra === 'creatividad'
        ? [
            `La ${palabra} es nuestro refugio familiar`,
            `${palabra} que une generaciones en casa`,
            `Mi espacio de ${palabra} con los niños`,
            `${palabra} auténtica, sin presión de perfección`,
            `Momentos de ${palabra} pura con mi familia`,
          ]
        : [
            `La ${palabra} auténtica no necesita filtros`,
            `${palabra} real vs ${palabra} de Instagram`,
            `Mi ${palabra} imperfecta pero verdadera`,
          ],
      contextos: palabra === 'creatividad'
        ? ['Actividades familiares','Arte doméstico','Tiempo de calidad','Tradiciones creativas','Proyectos intergeneracionales']
        : ['Redes sociales','Conversaciones familiares','Blogs maternales'],
      insights: palabra === 'creatividad'
        ? [
            `Alta resonancia emocional con ${palabra} familiar`,
            'Escape positivo del estrés maternal',
            'Conexión intergeneracional a través del arte',
            'Capital cultural transmitido de forma natural',
            'Terapia familiar sin etiquetas formales',
          ]
        : [
            `Alta resonancia emocional con ${palabra}`,
            'Tendencia anti-performance dominante',
            'Búsqueda de autenticidad maternal',
          ],
    };
    setPalabraSeleccionada(palabraData);
    setMostrarModalPalabra(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <i className="ri-brain-line text-white text-xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Content Insight</h1>
              </a>
            </div>
            <nav className="flex items-center space-x-6">
              <a href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Inicio</a>
              <a href="/topicos" className="text-blue-600 font-semibold">Tópicos</a>
              <a href="/contenidos" className="text-gray-600 hover:text-blue-600 transition-colors">Contenidos</a>
              <a href="/insights" className="text-gray-600 hover:text-blue-600 transition-colors">Insights</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tópicos de Conversación</h1>
          <p className="text-xl text-gray-600 mb-6">
            Análisis territorial basado en el ALMA: 6 ejes técnicos detectando patrones maternos auténticos
          </p>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Sentimiento:</label>
                  <select
                    value={filtroSentimiento}
                    onChange={(e) => setFiltroSentimiento(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="todos">Todos</option>
                    <option value="positivo">Positivo</option>
                    <option value="neutral">Neutral</option>
                    <option value="negativo">Negativo</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Volumen:</label>
                  <select
                    value={filtroVolumen}
                    onChange={(e) => setFiltroVolumen(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  >
                    <option value="todos">Todos</option>
                    <option value="alto">Alto (&gt;15K)</option>
                    <option value="medio">Medio (10K-15K)</option>
                    <option value="bajo">Bajo (&lt;10K)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>ALMA Detectado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Alta Oportunidad</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>RECIPES THAT HUG</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== MAPA DE UNIVERSOS ====== */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <h3
                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center"
                    onClick={() => setMostrarExplicacionALMA(true)}
                    onMouseEnter={handleMouseEnterALMA}
                    onMouseLeave={handleMouseLeaveALMA}
                  >
                    <i className="ri-question-line text-blue-600 mr-2"></i>
                    Mapa de Universos de Contenido (Análisis ALMA)
                  </h3>
                  {mostrarTooltipALMA && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4 z-50 animate-in fade-in duration-200">
                      <div className="space-y-3">
                        <div><span className="font-semibold text-pink-300">Emocional:</span><span className="ml-1">Mapas auténticos (culpa, ternura, agotamiento)</span></div>
                        <div><span className="font-semibold text-blue-300">Narrativo:</span><span className="ml-1">Historias genuinas vs performance</span></div>
                        <div><span className="font-semibold text-purple-300">Simbólico:</span><span className="ml-1">Capital (cultural, económico, social)</span></div>
                        <div><span className="font-semibold text-orange-300">Territorial:</span><span className="ml-1">Contextos geo-sociales</span></div>
                        <div><span className="font-semibold text-green-300">Comunitario:</span><span className="ml-1">Redes y vínculos</span></div>
                        <div><span className="font-semibold text-teal-300">Sensorial:</span><span className="ml-1">Experiencia sensorial</span></div>
                      </div>
                      <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div ref={refContenedor} className="relative w-full min-h-[700px] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {graphNodes.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                    {rows.length === 0
                      ? 'Cargando grafo de tópicos...'
                      : 'No encontramos tópicos que coincidan con los filtros seleccionados.'}
                  </div>
                ) : (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${Math.max(box.w, 1)} ${Math.max(box.h, 1)}`}
                    preserveAspectRatio="xMidYMid meet"
                    className="text-gray-700"
                    onClick={handleGraphBackgroundClick}
                  >
                    <rect width={box.w} height={box.h} fill="transparent" />
                    {graphLinks.map((link) => {
                      const source = nodeIndex.get(link.source);
                      const target = nodeIndex.get(link.target);
                      if (!source || !target) return null;
                      const edgeHighlighted = highlightedNodeId
                        ? highlightedNodes.has(source.id) && highlightedNodes.has(target.id)
                        : false;
                      return (
                        <line
                          key={`${link.source}-${link.target}`}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke={edgeHighlighted ? '#6366f1' : '#d1d5db'}
                          strokeWidth={edgeHighlighted ? 2.4 : 1.1}
                          strokeOpacity={highlightedNodeId && !edgeHighlighted ? 0.2 : 0.55}
                          className="transition-all duration-200"
                          onClick={(event) => event.stopPropagation()}
                        />
                      );
                    })}
                    {graphNodes.map((node) => {
                      const sentiment = dominantSentiment(node);
                      const palette = sentimentPalette(sentiment.label);
                      const isActive = highlightedNodes.has(node.id);
                      const isDimmed = highlightedNodeId ? !isActive : false;
                      const maxChars = Math.max(12, Math.floor(node.radius / 3));
                      const labelLines = wrapLabel(node.nombre, maxChars);
                      const labelStart = -((labelLines.length - 1) * 6);
                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          className="cursor-pointer"
                          onMouseEnter={() => handleNodeMouseEnter(node)}
                          onMouseLeave={() => handleNodeMouseLeave(node)}
                          onClick={(event) => handleNodeClick(event, node)}
                        >
                          <circle
                            r={node.radius}
                            fill={palette.fill}
                            stroke={isActive ? '#6366f1' : palette.stroke}
                            strokeWidth={isActive ? 2.6 : 1.5}
                            opacity={isDimmed ? 0.35 : 0.9}
                            className="transition-all duration-200"
                          />
                          {labelLines.map((line, index) => (
                            <text
                              key={`${node.id}-label-${index}`}
                              y={labelStart + index * 12}
                              textAnchor="middle"
                              fontSize={Math.max(10, Math.min(14, node.radius / 3))}
                              fontWeight={600}
                              fill="#1f2937"
                              style={{ pointerEvents: 'none' }}
                            >
                              {line}
                            </text>
                          ))}
                          <text
                            y={labelStart + labelLines.length * 12}
                            textAnchor="middle"
                            fontSize={Math.max(9, Math.min(12, node.radius / 4.2))}
                            fill="#4b5563"
                            style={{ pointerEvents: 'none' }}
                          >
                            {getTopicoVolume(node).toLocaleString('es-MX')} menciones
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
                {tooltip && (
                  <div
                    className="absolute z-20 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl rounded-lg px-4 py-3 w-64 pointer-events-none"
                    style={{
                      left: tooltip.x,
                      top: tooltip.y,
                      transform: 'translate(-50%, calc(-100% - 18px))',
                    }}
                  >
                    <div className="text-sm font-semibold text-gray-900 leading-snug">
                      {tooltip.node.nombre ?? 'Sin título'}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                      <div>
                        <div className="uppercase tracking-wide text-[10px] text-gray-400">Sentimiento</div>
                        <div className="mt-1 flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: tooltipPalette?.stroke ?? '#9ca3af' }}
                          ></span>
                          <span className="text-sm font-semibold text-gray-800">
                            {tooltipSentiment ? SENTIMENT_LABELS[tooltipSentiment.label] : 'Sin dato'}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          {tooltipSentiment ? `${tooltipSentiment.value}%` : '—'}
                        </div>
                                              </div>
                      <div>
                        <div className="uppercase tracking-wide text-[10px] text-gray-400">Volumen</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {getTopicoVolume(tooltip.node).toLocaleString('es-MX')}
                        </div>
                        <div className="text-[11px] text-gray-500">menciones</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Oportunidad</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {tooltipOpportunity !== null ? `${tooltipOpportunity}%` : '—'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {tooltipConnections > 0
                        ? `${tooltipConnections} conexiones activas`
                        : 'Sin conexiones registradas'}
                    </div>               
                      <div className="absolute left-1/2 -bottom-1.5 h-3 w-3 rotate-45 border-r border-b border-gray-200 bg-white/90 -translate-x-1/2" />
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ====== PANELES INFORMATIVOS ====== */}
            <div className="lg:col-span-4 mt-8">
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <i className="ri-dna-line text-purple-600 mr-2"></i>
                    Insights del ALMA - Simulación Completa
                </h3>
                <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                        <strong>RECIPES THAT HUG</strong> emerge como territorio dominante en Cocina Emocional (91%), Intuitiva (88%) y Gestión Familiar (90%).
                    </p>
                    </div>
                    <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                        <strong>Convergencia detectada:</strong> Gestión culinaria familiar conecta performance maternal con soluciones prácticas.
                    </p>
                    </div>
                </div>
                </div>

                {/* Pilares Estratégicos de Contenido */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <i className="ri-flag-line text-green-600 mr-2"></i>
                    Pilares Estratégicos de Contenido
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    {Object.values(PILARES).map((p) => (
                    <div key={p.nombre} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{p.nombre}</div>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.estado==='Activo'?'bg-green-100 text-green-700':p.estado==='Oportunidad'?'bg-yellow-100 text-yellow-800':'bg-orange-100 text-orange-700'}`}>{p.estado}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{p.descripcion}</div>
                        <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-700">Activación</div>
                        <div className="text-sm font-bold text-purple-700">{p.activacion}%</div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                    <i className="ri-dna-line text-purple-600"></i>
                    <span>Análisis ALMA: 6 ejes técnicos procesando conversaciones auténticas</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>Actualizado: En vivo</span>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* ====== CONVERSATION CLOUD ALMA (bloque completo) ====== */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="ri-cloud-line text-white text-2xl"></i>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Conversation Cloud ALMA</h2>
                    <p className="text-purple-100">Palabras y frases que conforman los universos maternos auténticos</p>
                </div>
                </div>
                <div className="text-right">
                <div className="text-3xl font-bold text-white">247</div>
                <div className="text-sm text-purple-100">palabras únicas</div>
                </div>
            </div>
            </div>

            <div className="p-8">
            <div className="grid lg:grid-cols-4 gap-8">
                {/* Nube de palabras */}
                <div className="lg:col-span-3">
                <div className="relative bg-white rounded-xl p-8 h-96 overflow-hidden shadow-sm border border-gray-200">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30" />

                    {/* Líneas suaves animadas */}
                    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    <defs>
                        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(139, 92, 246, 0.2)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0.2)" />
                        </linearGradient>
                    </defs>
                    <line x1="25%" y1="15%" x2="45%" y2="35%" stroke="url(#connectionGradient)" strokeWidth="1" className="animate-pulse" />
                    <line x1="65%" y1="25%" x2="30%" y2="60%" stroke="url(#connectionGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1s' }} />
                    <line x1="70%" y1="15%" x2="55%" y2="20%" stroke="url(#connectionGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '2s' }} />
                    <line x1="20%" y1="80%" x2="45%" y2="35%" stroke="url(#connectionGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <line x1="75%" y1="65%" x2="60%" y2="45%" stroke="url(#connectionGradient)" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                    </svg>

                    {/* Palabras principales */}
                    <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ left: '25%', top: '15%', zIndex: 20 }}
                    title="Performance vs Realidad Maternal - Núcleo"
                    onClick={() => handlePalabraClick('maternidad')}
                    >
                    <span
                        className="font-inter font-black drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
                        style={{ fontSize: '70px', color: '#8b5cf6', textShadow: '0 4px 8px rgba(139, 92, 246, 0.3)' }}
                    >
                        maternidad
                    </span>
                    </div>

                    <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ left: '65%', top: '25%', zIndex: 19 }}
                    title="Autenticidad - Núcleo"
                    onClick={() => handlePalabraClick('autenticidad')}
                    >
                    <span
                        className="font-inter font-black drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
                        style={{ fontSize: '65px', color: '#8b5cf6', textShadow: '0 4px 8px rgba(139, 92, 246, 0.3)' }}
                    >
                        autenticidad
                    </span>
                    </div>

                    <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110"
                    style={{ left: '45%', top: '35%', zIndex: 18 }}
                    title="Cocina como Refugio Emocional - Núcleo"
                    onClick={() => handlePalabraClick('cocina')}
                    >
                    <span
                        className="font-inter font-black drop-shadow-lg hover:drop-shadow-xl transition-all duration-300"
                        style={{ fontSize: '60px', color: '#f97316', textShadow: '0 4px 8px rgba(249, 115, 22, 0.3)' }}
                    >
                        cocina
                    </span>
                    </div>
                </div>
                </div>

                {/* Panel lateral derecho */}
                <div className="space-y-6">
                {/* Convenciones de Tópicos */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <i className="ri-palette-line text-purple-600 mr-2"></i>
                    Convenciones de Tópicos
                    </h3>
                    <div className="space-y-3">
                    {[
                        { c: '#8b5cf6', t: 'Performance vs Realidad Maternal', d: 'Auténtico vs Instagram perfecto' },
                        { c: '#f97316', t: 'Cocina como Refugio Emocional', d: 'Santuario familiar y emocional' },
                        { c: '#3b82f6', t: 'Conexión Intergeneracional', d: 'Sabiduría entre generaciones' },
                        { c: '#10b981', t: 'Rituales de Descompresión', d: 'Mindfulness y bienestar maternal' },
                        { c: '#6366f1', t: 'Escape Creativo Familiar', d: 'Arte y creatividad en familia' },
                        { c: '#ec4899', t: 'Momentos de Placer Consciente', d: 'Autocuidado sin culpa maternal' },
                    ].map((it) => (
                        <div key={it.t} className="flex items-start space-x-3">
                        <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: it.c }}></div>
                        <div>
                            <div className="font-medium text-gray-900 text-sm">{it.t}</div>
                            <div className="text-xs text-gray-600 leading-relaxed">{it.d}</div>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Jerarquía de Frecuencias */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <i className="ri-text-direction-r text-indigo-600 mr-2"></i>
                    Jerarquía de Frecuencias
                    </h3>
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-4xl font-black text-gray-800">Núcleo</span>
                        <span className="text-xs text-gray-600">Ultra Bold (900)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-700">Soporte</span>
                        <span className="text-xs text-gray-600">Bold (700)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-600">Contexto</span>
                        <span className="text-xs text-gray-600">Medium (500)</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-light text-gray-500">Detalle</span>
                        <span className="text-xs text-gray-600">Light (300)</span>
                    </div>
                    </div>
                </div>

                {/* Estadísticas Vivas */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <i className="ri-bar-chart-2-line text-purple-600 mr-2"></i>
                    Estadísticas Vivas
                    </h3>
                    <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Palabras Únicas</span>
                        <span className="font-bold text-purple-600">247</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Frases Conectoras</span>
                        <span className="font-bold text-indigo-600">89</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Menciones Totales</span>
                        <span className="font-bold text-green-600">156K</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Temáticas Dominantes</span>
                        <span className="font-bold text-orange-600">6</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-200">
                        <div className="flex items-center text-xs text-purple-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span>Actualización en tiempo real • Sistema ALMA activo</span>
                        </div>
                    </div>
                    </div>
                </div>
                </div>{/* /right column */}
            </div>

            <div className="mt-8 pt-6 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                    <i className="ri-dna-line text-purple-600"></i>
                    <span>Análisis ALMA: 6 ejes técnicos procesando conversaciones auténticas</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>Precisión: 94.2%</span>
                    <span>•</span>
                    <span>Actualizado: En vivo</span>
                </div>
                </div>
            </div>
            </div>
        </div>
        {/* ====== /CONVERSATION CLOUD ====== */}

        {/* ====== Modal Explicación ALMA ====== */}
        {mostrarExplicacionALMA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-700 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className="ri-dna-line text-white text-2xl"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Sistema ALMA - Análisis Profundo</h2>
                        <p className="text-purple-100">Arquitectura de 6 Ejes Técnicos</p>
                    </div>
                    </div>
                    <button onClick={() => setMostrarExplicacionALMA(false)} className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                    <i className="ri-close-line text-xl"></i>
                    </button>
                </div>
                </div>

                <div className="p-8 space-y-8">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <i className="ri-brain-line text-purple-600 mr-3"></i>
                    ¿Qué es el Sistema ALMA?
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                    ALMA analiza contenido maternal con 6 ejes (emocional, narrativo, simbólico, territorial, comunitario y sensorial)
                    para identificar oportunidades de contenido auténtico de alta resonancia.
                    </p>
                </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 rounded-b-2xl">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Sistema ALMA v1.1 • 6 Ejes Técnicos</div>
                    <button onClick={() => setMostrarExplicacionALMA(false)} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
                    <i className="ri-check-line mr-2"></i>
                    Entendido
                    </button>
                </div>
                </div>
            </div>
            </div>
        )}

        {/* ====== Modal de Tópico ====== */}
        {modalAbierto && topicoSeleccionado && (() => {
            const PILLAR_META = {
            'DIARY OF REAL MOMS': {
                nombre: 'DIARY OF REAL MOMS',
                descripcion: 'Experiencia personal, anécdotas y testimonios de maternidad.',
                ejes: ['Narrativo', 'Emocional'],
                kpis: ['Testimonios auténticos', 'Engagement emocional', 'Storytime resonance'],
                estado: 'Activo' as const,
                activacion: 85
            },
            'REAL FAMILY MOMENTS': {
                nombre: 'REAL FAMILY MOMENTS',
                descripcion: 'Interacciones y rituales familiares con el producto presente.',
                ejes: ['Simbólico', 'Comunitario'],
                kpis: ['Rituales familiares', 'Tradiciones heredadas', 'Conexión intergeneracional'],
                estado: 'Oportunidad' as const,
                activacion: 72
            },
            'AUTHENTIC TREATS': {
                nombre: 'AUTHENTIC TREATS',
                descripcion: 'Producto como placer, consuelo o recompensa.',
                ejes: ['Sensorial', 'Emocional'],
                kpis: ['Experiencia sensorial', 'Momentos de placer', 'Confort emocional'],
                estado: 'Activo' as const,
                activacion: 68
            },
            'RECIPES THAT HUG': {
                nombre: 'RECIPES THAT HUG',
                descripcion: 'Cocina emocional + intuitiva + gestión familiar.',
                ejes: ['Narrativo', 'Comunitario', 'Simbólico'],
                kpis: ['Cocina emocional', 'Cocina intuitiva', 'Gestión familiar'],
                estado: 'Emergente' as const,
                activacion: 78,
                extras: { cocinaEmocional: 91, cocinaIntuitiva: 88, gestionFamiliar: 90 }
            }
            } as const;

            const EMO_KEYS = ['alegria','enojo','sorpresa','miedo','tristeza','nostalgia','ternura','orgullo','estres','culpa','cansancio'] as const;

            const pilarNorm = (topicoSeleccionado?.pilarAsociado ?? topicoSeleccionado?.pilar ?? 'Pilar estratégico');
            const pilarLabel = PilarLabel(pilarNorm) || resolvePilar(topicoSeleccionado);
            const meta = (PILLAR_META as any)[pilarLabel] ?? null;

            const emociones: Record<string, number> = {};
            EMO_KEYS.forEach(k => { emociones[k] = Number((topicoSeleccionado as any)?.emociones?.[k] ?? 0); });

            const Tag = ({text}: {text: string}) => (
            <div className="flex items-center p-2 bg-white rounded-lg border">
                <i className="ri-arrow-right-s-line text-blue-600 mr-2"></i>
                <span className="text-sm text-gray-700">{text}</span>
            </div>
            );
            const chip = (ok:boolean) => ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

            return (
            <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/40" onClick={cerrarModal} />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1080px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl border">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className="ri-map-pin-line text-white text-2xl"></i>
                        </div>
                        <div>
                        <h2 className="text-2xl font-bold text-white">{topicoSeleccionado?.nombre ?? '—'}</h2>
                        <p className="text-blue-100">Análisis ALMA Completo</p>
                        </div>
                    </div>
                    <button
                        onClick={cerrarModal}
                        className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <i className="ri-close-line text-xl"></i>
                    </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* KPIs */}
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i className="ri-lightbulb-line text-white text-xl"></i>
                            </div>
                            <div className="text-2xl font-bold text-green-600 mb-1">{(topicoSeleccionado as any)?.oportunidad ?? 0}%</div>
                            <div className="text-sm font-medium text-gray-700">Oportunidad ALMA</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i className="ri-volume-up-line text-white text-xl"></i>
                            </div>
                            <div className="text-2xl font-bold text-blue-600 mb-1">{Number((topicoSeleccionado as any)?.volume ?? (topicoSeleccionado as any)?.volumen ?? 0).toLocaleString()}</div>
                            <div className="text-sm font-medium text-gray-700">Volumen</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i className="ri-heart-line text-white text-xl"></i>
                            </div>
                            <div className="text-2xl font-bold text-purple-600 mb-1">{(topicoSeleccionado as any)?.sentimiento?.positivo ?? 0}%</div>
                            <div className="text-sm font-medium text-gray-700">Sentimiento Positivo</div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <i className="ri-fire-line text-white text-xl"></i>
                            </div>
                            <div className="text-2xl font-bold text-orange-600 mb-1">{(topicoSeleccionado as any)?.engagement ?? 0}%</div>
                            <div className="text-sm font-medium text-gray-700">Engagement</div>
                        </div>
                    </div>

                    {/* Pilar Estratégico */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i className="ri-dna-line text-purple-600 mr-2"></i>
                                    Ejes ALMA Detectados
                                </h3>
                                <div className="space-y-3">
                                    {((topicoSeleccionado?.ejesDetectados ?? []).length ? (topicoSeleccionado?.ejesDetectados ?? []) : ['Sin ejes detectados aún']).map((eje, idx) => (
                                        <div key={idx} className={`flex items-center p-3 rounded-lg border ${(topicoSeleccionado?.ejesDetectados ?? []).length ? 'bg-white border-purple-200' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                            <i className={`ri-checkbox-circle-fill mr-3 ${(topicoSeleccionado?.ejesDetectados ?? []).length ? 'text-purple-600' : 'text-gray-400'}`}></i>
                                            <span className="font-medium">{eje}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i className="ri-treasure-map-line text-blue-600 mr-2"></i>
                                    Capital Simbólico Detectado
                                </h3>
                                <div className="space-y-2">
                                    {((topicoSeleccionado?.capitalSimbolicoDetectado ?? []).length ? (topicoSeleccionado?.capitalSimbolicoDetectado ?? []) : ['Sin detecciones de capital simbólico']).map((c, i) => (
                                        <Tag key={i} text={c as string} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i className="ri-building-4-line text-green-600 mr-2"></i>
                                    Pilar Estratégico
                                </h3>
                                <div className="p-4 bg-white rounded-lg border-l-4 border-green-500">
                                    <div className="text-lg font-semibold text-gray-900 mb-1">
                                        {pilarLabel.toUpperCase()}
                                    </div>
                                    <div className="text-xs mt-1">
                                        <span className={`px-2 py-0.5 rounded ${chip(!!meta)}`}>
                                            {meta?.estado ?? '—'}
                                        </span>
                                        {typeof meta?.activacion === 'number' && (
                                            <span className="ml-2 text-gray-600">Activación: <b>{meta.activacion}%</b></span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">
                                        {meta?.descripcion ?? '—'}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2">
                                        NSE Inferido: <span className="font-medium">{topicoSeleccionado?.nseInferido ?? '—'}</span> · Contexto: <span className="font-medium">{topicoSeleccionado?.contextoTerritorial ?? '—'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <i className="ri-map-2-line text-orange-600 mr-2"></i>
                                    Resonancia por Estados
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {((topicoSeleccionado?.estadosResonancia ?? []).length ? (topicoSeleccionado?.estadosResonancia ?? []) : [
                                        { estado: '—', porcentaje: 0, intensidad: 'baja' as const },
                                        ]).map((e: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded border">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-3 ${
                                                    e.intensidad === 'alta' ? 'bg-red-500' :
                                                    e.intensidad === 'media' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></div>
                                                <span className="text-sm font-medium text-gray-900">{e.estado}</span>
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{e.porcentaje}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mapa emocional */}
                    <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <i className="ri-emotion-line text-pink-600 mr-2"></i>
                            Mapa Emocional Detallado
                        </h3>
                        <div className="grid md:grid-cols-4 gap-4">
                            {['alegria','enojo','sorpresa','miedo','tristeza','nostalgia','ternura','orgullo','estres','culpa','cansancio'].map((k) => {
                                const val = Math.max(0, Math.min(100, Number((topicoSeleccionado as any)?.emociones?.[k] ?? 0)));
                                return (
                                    <div key={k} className="bg-white rounded-lg p-4 border border-pink-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700 capitalize">{k}</span>
                                            <span className="text-lg font-bold text-pink-600">{val}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500" style={{ width: `${val}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recomendaciones */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <i className="ri-lightbulb-line mr-2"></i>
                            Recomendaciones Estratégicas ALMA
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold text-purple-100 mb-3">Contenido Recomendado:</h4>
                                <div className="space-y-2 text-sm text-purple-100">
                                    <div className="flex items-start"><i className="ri-arrow-right-line mt-1 mr-2"></i><span>Desarrollar contenido {pilarLabel} enfocado en emociones dominantes</span></div>
                                    <div className="flex items-start"><i className="ri-arrow-right-line mt-1 mr-2"></i><span>Dirigir a NSE {topicoSeleccionado?.nseInferido ?? '—'} con enfoque {topicoSeleccionado?.contextoTerritorial ?? '—'}</span></div>
                                    <div className="flex items-start"><i className="ri-arrow-right-line mt-1 mr-2"></i><span>Activar ejes técnicos: {(meta?.ejes ?? (topicoSeleccionado?.ejesDetectados ?? [])).join(', ') || '—'}</span></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-purple-100 mb-3">Estrategia de Capital:</h4>
                                <div className="space-y-2 text-sm text-purple-100">
                                    {((topicoSeleccionado?.capitalSimbolicoDetectado ?? []).length ? (topicoSeleccionado?.capitalSimbolicoDetectado ?? []) : ['Sin señales de capital detectadas']).map((c, i) => (
                                        <div key={i} className="flex items-start"><i className="ri-check-line mt-1 mr-2"></i><span>{c}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer sticky */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Análisis ALMA • {Number((topicoSeleccionado as any)?.volume ?? (topicoSeleccionado as any)?.volumen ?? 0).toLocaleString()} menciones procesadas • Precisión: 94.2%
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
                                <i className="ri-download-line mr-2"></i>
                                Exportar Análisis
                            </button>
                            <button
                                onClick={cerrarModal}
                                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                                <i className="ri-close-line mr-2"></i>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            );
        })()}

        {/* ====== Modal Palabra (Conversation Cloud) ====== */}
        {mostrarModalPalabra && palabraSeleccionada && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <i className="ri-chat-3-line text-white text-lg"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{palabraSeleccionada.palabra}</h2>
                        <p className="text-purple-100 text-sm">Análisis detallado de palabra clave</p>
                    </div>
                    </div>
                    <button onClick={() => setMostrarModalPalabra(false)} className="w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors">
                    <i className="ri-close-line text-lg"></i>
                    </button>
                </div>
                </div>

                <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{palabraSeleccionada.volumen.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Menciones</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{palabraSeleccionada.sentimiento}%</div>
                    <div className="text-sm text-gray-600">Sentimiento</div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Menciones Destacadas</h3>
                    <div className="space-y-2">
                    {palabraSeleccionada.menciones.map((mencion, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">"{mencion}"</div>
                    ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contextos</h3>
                    <div className="flex flex-wrap gap-2">
                    {palabraSeleccionada.contextos.map((contexto, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{contexto}</span>
                    ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Insights ALMA</h3>
                    <div className="space-y-2">
                    {palabraSeleccionada.insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-2">
                        <i className="ri-lightbulb-line text-purple-600 mt-1"></i>
                        <span className="text-sm text-gray-700">{insight}</span>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}

      </div>
    </div>
  );
}

