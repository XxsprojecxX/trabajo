const STOP_WORDS_ES = new Set([
  "con",
  "las",
  "los",
  "una",
  "unos",
  "unas",
  "que",
  "del",
  "por",
  "para",
  "pero",
  "como",
  "nos",
  "mis",
  "sus",
  "tan",
  "muy",
  "asi",
  "más",
  "mas",
  "sin",
  "este",
  "esta",
  "aun",
  "aún",
  "ese",
  "esa",
  "aqui",
  "aquí",
  "de",
  "la",
  "el",
  "en",
  "y",
  "o",
  "u",
  "al",
  "se",
  "tu",
  "te",
  "me",
  "es",
]);

const AXES = ["emocional", "narrativo", "simbolico", "territorial", "comunitario", "sensorial"] as const;
type AxisKey = typeof AXES[number];

type TopicForClustering = {
  id: string;
  nombre?: string;
  volumen?: number;
  volume?: number;
  categoria?: string;
  ejesDetectados?: any[];
  estadosResonancia?: any[];
  pilar?: string;
  pilarAsociado?: string;
};

type AlmaVector = {
  id: string;
  topic: TopicForClustering;
  text: string;
  tfidf: Map<string, number>;
  axesActive: Partial<Record<AxisKey, number>>;
  volume: number;
};

type AlmaCluster = {
  id: string;
  topicIds: string[];
  axesScore: Partial<Record<AxisKey, number>>;
  confidence: number;
  totalVolume: number;
};

type Universe = {
  id: string;
  label: string;
  pilar: string;
  confianza: number;
  topicIds: string[];
  axesScore: Partial<Record<AxisKey, number>>;
  totalVolume: number;
};

const MIN_CLUSTER_SIZE = 5;
const SIMILARITY_THRESHOLD = 0.62;

const AXIS_LABELS: Record<AxisKey, string> = {
  emocional: "Universo Emocional",
  narrativo: "Universo Narrativo",
  simbolico: "Universo Simbólico",
  territorial: "Universo Territorial",
  comunitario: "Universo Comunitario",
  sensorial: "Universo Sensorial",
};

const PILAR_DEFAULT = "DIARY OF REAL MOMS";
const PILAR_SENSORIAL_RECIPES = "RECIPES THAT HUG";
const PILAR_SENSORIAL_TREATS = "AUTHENTIC TREATS";
const PILAR_COMUNITARIO = "REAL FAMILY MOMENTS";

function tokensES(input: string): string[] {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s#@]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS_ES.has(w));
}

function inferAxes(topic: TopicForClustering): Partial<Record<AxisKey, number>> {
  const text = (topic.nombre || "").toLowerCase();
  const ejes = (Array.isArray(topic.ejesDetectados) ? topic.ejesDetectados : [])
    .map((value) => String(value || "").toLowerCase());
  const has = (needle: string) => ejes.some((eje) => eje.includes(needle)) || text.includes(needle);

  return {
    emocional: has("ternura") || has("nostalgia") || has("culpa") || has("emocion") ? 0.9 : 0.4,
    narrativo: has("historia") || has("cuento") || has("story") || has("diario") ? 0.9 : 0.5,
    simbolico: has("capital") || has("estatus") || has("cultural") || has("social") ? 0.8 : 0.4,
    territorial: has("cdmx") || has("jalisco") || has("edo") || has("puebla") || has("nl") || has("oaxaca") ? 0.9 : 0.3,
    comunitario: has("comunidad") || has("familia") || has("red") || has("tribu") ? 0.8 : 0.4,
    sensorial: has("olor") || has("sabor") || has("textura") || has("receta") || has("cocina") ? 0.9 : 0.3,
  };
}

function buildVectors(topics: TopicForClustering[]): AlmaVector[] {
  const docs = topics.map((topic) => tokensES(topic.nombre || ""));
  const df = new Map<string, number>();

  docs.forEach((tokens) => {
    new Set(tokens).forEach((token) => {
      df.set(token, (df.get(token) ?? 0) + 1);
    });
  });

  const N = topics.length || 1;

  return topics.map((topic, index) => {
    const tf = new Map<string, number>();
    docs[index].forEach((token) => {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    });

    const tfidf = new Map<string, number>();
    tf.forEach((freq, token) => {
      const idf = Math.log((N + 1) / ((df.get(token) ?? 0) + 1)) + 1;
      tfidf.set(token, freq * idf);
    });

    const volume = Number(topic.volumen ?? topic.volume ?? 0);

    return {
      id: topic.id,
      topic,
      text: topic.nombre || "",
      tfidf,
      axesActive: inferAxes(topic),
      volume: Number.isFinite(volume) ? Math.max(0, volume) : 0,
    };
  });
}

function almaCosine(a: AlmaVector, b: AlmaVector): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.tfidf.forEach((value, key) => {
    const other = b.tfidf.get(key) ?? 0;
    dot += value * other;
    normA += value * value;
  });
  b.tfidf.forEach((value) => {
    normB += value * value;
  });
  const cosine = dot / ((Math.sqrt(normA || 1) * Math.sqrt(normB || 1)) || 1);

  let axesSim = 0;
  let axesCount = 0;
  AXES.forEach((axis) => {
    const vA = clamp01(a.axesActive[axis] ?? 0);
    const vB = clamp01(b.axesActive[axis] ?? 0);
    axesSim += 1 - Math.abs(vA - vB);
    axesCount += 1;
  });
  const axesScore = axesSim / (axesCount || 1);
  return 0.7 * cosine + 0.3 * axesScore;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clusterVectors(vectors: AlmaVector[]): AlmaCluster[] {
  const N = vectors.length;
  if (N === 0) return [];

  const parent = Array.from({ length: N }, (_, index) => index);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const unite = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (almaCosine(vectors[i], vectors[j]) >= SIMILARITY_THRESHOLD) {
        unite(i, j);
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < N; i++) {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  }

  const clusters: AlmaCluster[] = [];

  Array.from(groups.values()).forEach((indexes) => {
    if (indexes.length < MIN_CLUSTER_SIZE) return;

    const axesScore: Partial<Record<AxisKey, number>> = {};
    AXES.forEach((axis) => {
      const avg = indexes.reduce((sum, idx) => sum + clamp01(vectors[idx].axesActive[axis] ?? 0), 0) / indexes.length;
      axesScore[axis] = avg;
    });

    let similaritySum = 0;
    let comparisons = 0;
    for (let i = 0; i < indexes.length; i++) {
      for (let j = i + 1; j < indexes.length; j++) {
        similaritySum += almaCosine(vectors[indexes[i]], vectors[indexes[j]]);
        comparisons += 1;
      }
    }
    const coherence = comparisons ? similaritySum / comparisons : 0;

    const totalVolume = indexes.reduce((sum, idx) => sum + (vectors[idx].volume || 0), 0);

    const axesActiveCount = AXES.filter((axis) => (axesScore[axis] ?? 0) >= 0.6).length;
    const passes = axesActiveCount >= 3 && coherence > 0.8 && totalVolume >= 500;
    if (!passes) return;

    const confidence = Math.min(
      1,
      (0.4 * coherence) + (0.2 * (axesActiveCount / AXES.length)) + (0.4 * Math.min(1, totalVolume / 5000))
    );

    clusters.push({
      id: `u_${clusters.length + 1}`,
      topicIds: indexes.map((idx) => vectors[idx].id),
      axesScore,
      confidence,
      totalVolume,
    });
  });

  if (!clusters.length) {
    const buckets: Record<AxisKey, string[]> = {
      emocional: [],
      narrativo: [],
      simbolico: [],
      territorial: [],
      comunitario: [],
      sensorial: [],
    };
    vectors.forEach((vector) => {
      const best = AXES.map((axis) => [axis, clamp01(vector.axesActive[axis] ?? 0)] as const)
        .sort((a, b) => b[1] - a[1])[0][0];
      buckets[best].push(vector.id);
    });

    AXES.forEach((axis, index) => {
      const ids = buckets[axis];
      if (ids.length >= MIN_CLUSTER_SIZE) {
        clusters.push({
          id: `u_${index + 1}`,
          topicIds: ids,
          axesScore: { [axis]: 0.85 },
          confidence: 0.72,
          totalVolume: ids.reduce((sum, id) => {
            const vector = vectors.find((vec) => vec.id === id);
            return sum + (vector?.volume || 0);
          }, 0),
        });
      }
    });
  }

  return clusters.sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0));
}

function dominantAxis(score: Partial<Record<AxisKey, number>>): AxisKey {
  let chosen: AxisKey = "emocional";
  let max = -Infinity;
  AXES.forEach((axis) => {
    const value = score[axis] ?? 0;
    if (value > max) {
      max = value;
      chosen = axis;
    }
  });
  return chosen;
}

function normalizePilarTag(value?: string): string | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  if (key.includes("diary") || key.includes("real moms")) return "DIARY OF REAL MOMS";
  if (key.includes("recipes that hug") || key.includes("recipes")) return "RECIPES THAT HUG";
  if (key.includes("real family")) return "REAL FAMILY MOMENTS";
  if (key.includes("authentic treats") || key.includes("treat")) return "AUTHENTIC TREATS";
  return null;
}

function inferTopicPilar(topic: TopicForClustering): string {
  const direct = normalizePilarTag(topic.pilarAsociado ?? topic.pilar ?? "");
  if (direct) return direct;

  const ejes = (Array.isArray(topic.ejesDetectados) ? topic.ejesDetectados : [])
    .map((value) => String(value || "").toLowerCase());
  const categoria = String(topic.categoria || "").toLowerCase();
  const texto = String(topic.nombre || "").toLowerCase();
  const has = (needle: string) => ejes.some((item) => item.includes(needle)) || texto.includes(needle);
  const esCocina = /cocin|recipe|receta|kitchen/.test(categoria) || /cocin|recipe|receta|kitchen/.test(texto);

  if (has("sensorial")) {
    if (esCocina || has("narrativo") || has("comunitario")) {
      return PILAR_SENSORIAL_RECIPES;
    }
    return PILAR_SENSORIAL_TREATS;
  }
  if (has("territorial") || has("simb") || has("comunitario")) {
    return PILAR_COMUNITARIO;
  }
  if (has("narrativo") || has("emocional")) {
    return PILAR_DEFAULT;
  }
  return PILAR_DEFAULT;
}

function keywordsForCluster(cluster: AlmaCluster, vectorMap: Map<string, AlmaVector>): string[] {
  const aggregate = new Map<string, number>();
  cluster.topicIds.forEach((id) => {
    const vector = vectorMap.get(id);
    if (!vector) return;
    vector.tfidf.forEach((value, token) => {
      aggregate.set(token, (aggregate.get(token) ?? 0) + value);
    });
  });

  return Array.from(aggregate.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([token]) => capitalize(token));
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildUniverseLabel(cluster: AlmaCluster, vectorMap: Map<string, AlmaVector>, topicsById: Map<string, TopicForClustering>): string {
  const axis = dominantAxis(cluster.axesScore);
  const axisLabel = AXIS_LABELS[axis] || "Universo ALMA";
  const keywords = keywordsForCluster(cluster, vectorMap).filter(Boolean);
  if (keywords.length >= 2) {
    return `${axisLabel}: ${keywords[0]} & ${keywords[1]}`;
  }
  if (keywords.length === 1) {
    return `${axisLabel}: ${keywords[0]}`;
  }
  const sampleTopic = topicsById.get(cluster.topicIds[0] || "");
  if (sampleTopic?.nombre) {
    return `${axisLabel}: ${sampleTopic.nombre}`;
  }
  return axisLabel;
}

function determinePilar(cluster: AlmaCluster, topicsById: Map<string, TopicForClustering>): string {
  const votes = new Map<string, number>();
  cluster.topicIds.forEach((id) => {
    const topic = topicsById.get(id);
    if (!topic) return;
    const inferred = inferTopicPilar(topic);
    votes.set(inferred, (votes.get(inferred) ?? 0) + 1);
  });

  if (votes.size) {
    return Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }

  const axis = dominantAxis(cluster.axesScore);
  if (axis === "sensorial") {
    return PILAR_SENSORIAL_RECIPES;
  }
  if (axis === "simbolico" || axis === "territorial" || axis === "comunitario") {
    return PILAR_COMUNITARIO;
  }
  return PILAR_DEFAULT;
}

export async function clusterTopicos(topics: TopicForClustering[]): Promise<{ universos: Universe[]; asignacion: Record<string, string> }> {
  const validTopics = (topics || []).filter((topic) => topic && typeof topic.id === "string" && topic.id.trim() !== "");
  if (!validTopics.length) {
    return { universos: [], asignacion: {} };
  }

  const vectors = buildVectors(validTopics);
  const vectorMap = new Map<string, AlmaVector>(vectors.map((vector) => [vector.id, vector]));
  const topicsById = new Map<string, TopicForClustering>(validTopics.map((topic) => [topic.id, topic]));
  const clusters = clusterVectors(vectors);

  const universos: Universe[] = [];
  const asignacion: Record<string, string> = {};

  clusters.forEach((cluster, index) => {
    const universeId = cluster.id || `u_${index + 1}`;
    const label = buildUniverseLabel(cluster, vectorMap, topicsById);
    const pilar = determinePilar(cluster, topicsById);
    const confianza = Number(Number.isFinite(cluster.confidence) ? cluster.confidence : 0.7);

    universos.push({
      id: universeId,
      label,
      pilar,
      confianza,
      topicIds: cluster.topicIds,
      axesScore: cluster.axesScore,
      totalVolume: cluster.totalVolume,
    });

    cluster.topicIds.forEach((topicId) => {
      asignacion[topicId] = universeId;
    });
  });

  return {
    universos,
    asignacion,
  };
}