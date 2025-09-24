const STOPWORDS = new Set<string>([
  "el",
  "la",
  "de",
  "y",
  "que",
  "en",
  "a",
  "un",
  "una",
  "los",
  "las",
  "con",
  "por",
  "para",
  "del",
  "al",
  "se",
  "es",
  "su",
  "lo",
  "muy",
  "me",
  "mi",
  "tu",
  "te",
  "sus",
  "the",
  "to",
  "of",
  "and",
  "in",
  "for",
  "on",
]);

const POSITIVE_WORDS = new Set<string>([
  "amor",
  "lindo",
  "linda",
  "bello",
  "bella",
  "cool",
  "nice",
  "amazing",
  "bueno",
  "buena",
  "excelente",
  "genial",
  "feliz",
  "gracias",
  "increíble",
  "perfecto",
  "perfecta",
  "love",
  "cute",
  "awesome",
  "great",
]);

const NEGATIVE_WORDS = new Set<string>([
  "feo",
  "fea",
  "malo",
  "mala",
  "odio",
  "hate",
  "bad",
  "horrible",
  "triste",
  "wtf",
  "ugly",
  "awful",
  "terrible",
  "asco",
  "fail",
  "furioso",
  "molesto",
  "angry",
]);

const LINK_REGEX = /http\S+/gi;
const NON_LETTER_REGEX = /[^a-záéíóúñ ]+/gi;
const EXTRA_SPACES_REGEX = /\s+/g;

export type KeywordMetric = { keyword: string; percentage: number; porcentaje: number };
export type SentimentBreakdown = { positive: number; neutral: number; negative: number };
export type AggregatedMetrics = {
  total_comments: number;
  keywords: KeywordMetric[];
  sentiment: SentimentBreakdown;
};

export type AggregatedRow = {
  aggregated_type: "creator" | "post";
  creator_handle: string;
  platform?: string;
  post_id?: string | null;
  aggregated_at: string;
  total_comments: number;
  keywords: KeywordMetric[];
  sentiment: SentimentBreakdown;
};

export type AggregatesPayload = {
  by_creator: AggregatedRow[];
  by_post: AggregatedRow[];
};

type CommentLike = unknown;

type CommentGroup = {
  creator_handle: string;
  platform?: string;
  post_id?: string | null;
  comments: CommentLike[];
};

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(LINK_REGEX, "")
    .replace(NON_LETTER_REGEX, " ")
    .replace(EXTRA_SPACES_REGEX, " ")
    .trim();
}

function extractCommentText(comment: CommentLike): string | null {
  if (comment == null) return null;
  if (typeof comment === "string") {
    const trimmed = comment.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof comment === "object") {
    const record = comment as Record<string, unknown>;
    for (const key of ["comment_text", "comment", "text"]) {
      const value = record[key];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }
  return null;
}

function tokenise(comments: string[]): string[] {
  const tokens: string[] = [];
  for (const raw of comments) {
    const cleaned = cleanText(raw);
    if (!cleaned) continue;
    for (const token of cleaned.split(" ")) {
      if (token && !STOPWORDS.has(token)) {
        tokens.push(token);
      }
    }
  }
  return tokens;
}

function topKeywords(tokens: string[], topN: number): KeywordMetric[] {
  if (!tokens.length || topN <= 0) {
    return [];
  }

  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const total = tokens.length;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([keyword, freq]) => {
      const percentage = total ? Number(((freq / total) * 100).toFixed(2)) : 0;
      return { keyword, percentage, porcentaje: percentage };
    });
}

type SentimentLabel = "positive" | "neutral" | "negative";

function sentimentForComment(comment: string): SentimentLabel {
  const tokens = cleanText(comment).split(" ").filter(Boolean);
  let positives = 0;
  let negatives = 0;
  for (const token of tokens) {
    if (POSITIVE_WORDS.has(token)) positives += 1;
    if (NEGATIVE_WORDS.has(token)) negatives += 1;
  }
  if (positives > negatives) return "positive";
  if (negatives > positives) return "negative";
  return "neutral";
}

function sentimentBreakdownInternal(comments: string[]): SentimentBreakdown {
  if (!comments.length) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const counts: Record<SentimentLabel, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  for (const comment of comments) {
    const label = sentimentForComment(comment);
    counts[label] += 1;
  }

  const total = comments.length;
  return {
    positive: total ? Number(((counts.positive / total) * 100).toFixed(2)) : 0,
    neutral: total ? Number(((counts.neutral / total) * 100).toFixed(2)) : 0,
    negative: total ? Number(((counts.negative / total) * 100).toFixed(2)) : 0,
  };
}

export function analyzeCommentList(comments: CommentLike[], topN = 10): AggregatedMetrics {
  const iterable = Array.isArray(comments) ? comments : [];
  const extracted = iterable
    .map(extractCommentText)
    .filter((value): value is string => Boolean(value));

  const tokens = tokenise(extracted);
  const keywords = topKeywords(tokens, topN);
  const sentiment = sentimentBreakdownInternal(extracted);

  return {
    total_comments: extracted.length,
    keywords,
    sentiment,
  };
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return undefined;
}

export function aggregateMetricsFromRows(rows: CommentLike[], topN = 10): AggregatesPayload {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { by_creator: [], by_post: [] };
  }

  const creatorMap = new Map<string, CommentGroup>();
  const postMap = new Map<string, CommentGroup>();

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const creator = normalizeString(record.creator_handle);
    const platform = normalizeString(record.platform);
    const postId = normalizeString(record.post_id);

    if (creator) {
      const key = `${creator}|||${platform || ""}`;
      const group = creatorMap.get(key) || {
        creator_handle: creator,
        platform,
        comments: [],
      };
      group.comments.push(row);
      creatorMap.set(key, group);
    }

    if (creator || postId) {
      const key = `${creator || ""}|||${platform || ""}|||${postId || ""}`;
      const group = postMap.get(key) || {
        creator_handle: creator || "",
        platform,
        post_id: postId ?? null,
        comments: [],
      };
      group.comments.push(row);
      postMap.set(key, group);
    }
  }

  const aggregatedAt = new Date().toISOString();

  const by_creator: AggregatedRow[] = Array.from(creatorMap.values())
    .map(group => {
      const metrics = analyzeCommentList(group.comments, topN);
      if (!group.creator_handle || metrics.total_comments === 0) return null;
      return {
        aggregated_type: "creator",
        creator_handle: group.creator_handle,
        platform: group.platform,
        aggregated_at: aggregatedAt,
        total_comments: metrics.total_comments,
        keywords: metrics.keywords,
        sentiment: metrics.sentiment,
      } as AggregatedRow;
    })
    .filter((value): value is AggregatedRow => value !== null && value.aggregated_type === "creator")
    .sort((a, b) => (a && b ? b.total_comments - a.total_comments : 0));

  const by_post: AggregatedRow[] = Array.from(postMap.values())
    .map(group => {
      const metrics = analyzeCommentList(group.comments, topN);
      if (metrics.total_comments === 0) return null;
      return {
        aggregated_type: "post",
        creator_handle: group.creator_handle,
        platform: group.platform,
        post_id: group.post_id ?? null,
        aggregated_at: aggregatedAt,
        total_comments: metrics.total_comments,
        keywords: metrics.keywords,
        sentiment: metrics.sentiment,
      } as AggregatedRow;
    })
    .filter((value): value is AggregatedRow => value !== null && value.aggregated_type === "post")
    .sort((a, b) => (a && b ? b.total_comments - a.total_comments : 0));

  return { by_creator, by_post };
}