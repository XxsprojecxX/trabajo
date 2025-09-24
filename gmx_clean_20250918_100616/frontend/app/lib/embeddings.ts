import crypto from "node:crypto";
import { google } from "googleapis";

function env(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === null) return undefined;
  const trimmed = typeof value === "string" ? value.trim() : String(value);
  return trimmed === "" ? undefined : trimmed;
}

function decodeServiceAccount(): { client_email: string; private_key: string } | null {
  const raw = env("BIGQUERY_SERVICE_ACCOUNT_JSON") || env("GOOGLE_SERVICE_ACCOUNT_JSON");
  const b64 = env("BIGQUERY_SERVICE_ACCOUNT_BASE64");
  if (!raw && !b64) return null;
  const json = raw ? raw : Buffer.from(String(b64), "base64").toString("utf8");
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("CREDENCIAL_EMBEDDINGS_INVALIDA_JSON");
  }
  const client_email = parsed?.client_email;
  let private_key = parsed?.private_key;
  if (!client_email || !private_key) {
    throw new Error("CREDENCIAL_EMBEDDINGS_INCOMPLETA");
  }
  if (typeof private_key === "string") {
    private_key = private_key.replace(/\\n/g, "\n");
  }
  return { client_email, private_key };
}

function providerOrder(): string[] {
  const raw = env("EMBEDDINGS_PROVIDER_ORDER");
  if (!raw) return ["openai", "vertex", "fallback"];
  return raw
    .split(/[,|]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeVector(values: any): number[] | null {
  if (!Array.isArray(values)) return null;
  const out: number[] = [];
  for (const val of values) {
    const num = typeof val === "number" ? val : Number(val);
    if (!Number.isFinite(num)) {
      return null;
    }
    out.push(num);
  }
  return out;
}

async function embedWithOpenAI(text: string): Promise<number[] | null> {
  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) return null;
  const model = env("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small";
  const endpoint = env("OPENAI_BASE_URL") || "https://api.openai.com/v1/embeddings";

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: text, model }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`openai_error:${resp.status}:${detail}`);
  }
  const json = await resp.json();
  const embedding = json?.data?.[0]?.embedding;
  const vector = normalizeVector(embedding);
  if (!vector) {
    throw new Error("openai_sin_embedding");
  }
  return vector;
}

async function embedWithAzureOpenAI(text: string): Promise<number[] | null> {
  const apiKey = env("AZURE_OPENAI_API_KEY");
  const endpoint = env("AZURE_OPENAI_ENDPOINT");
  const deployment = env("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") || env("AZURE_OPENAI_EMBEDDING_MODEL");
  if (!apiKey || !endpoint || !deployment) return null;
  const version = env("AZURE_OPENAI_API_VERSION") || "2023-05-15";
  const url = `${endpoint.replace(/\/?$/, "")}/openai/deployments/${deployment}/embeddings?api-version=${version}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({ input: text }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`azure_openai_error:${resp.status}:${detail}`);
  }
  const json = await resp.json();
  const vector = normalizeVector(json?.data?.[0]?.embedding);
  if (!vector) {
    throw new Error("azure_openai_sin_embedding");
  }
  return vector;
}

async function embedWithCohere(text: string): Promise<number[] | null> {
  const apiKey = env("COHERE_API_KEY");
  if (!apiKey) return null;
  const model = env("COHERE_EMBEDDING_MODEL") || "embed-english-light-v3.0";
  const resp = await fetch("https://api.cohere.com/v1/embed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ texts: [text], model }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`cohere_error:${resp.status}:${detail}`);
  }
  const json = await resp.json();
  const embedding = json?.embeddings?.[0];
  const vector = normalizeVector(embedding);
  if (!vector) {
    throw new Error("cohere_sin_embedding");
  }
  return vector;
}

async function embedWithVoyage(text: string): Promise<number[] | null> {
  const apiKey = env("VOYAGE_API_KEY");
  if (!apiKey) return null;
  const model = env("VOYAGE_EMBEDDING_MODEL") || "voyage-2";
  const resp = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: [text], model }),
  });
  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`voyage_error:${resp.status}:${detail}`);
  }
  const json = await resp.json();
  const vector = normalizeVector(json?.data?.[0]?.embedding);
  if (!vector) {
    throw new Error("voyage_sin_embedding");
  }
  return vector;
}

async function embedWithVertex(text: string): Promise<number[] | null> {
  const project = env("VERTEX_PROJECT_ID") || env("GOOGLE_PROJECT_ID") || env("BIGQUERY_PROJECT_ID");
  const location = env("VERTEX_LOCATION") || env("GOOGLE_VERTEX_LOCATION") || "us-central1";
  const model = env("VERTEX_EMBEDDING_MODEL") || env("GOOGLE_EMBEDDING_MODEL") || "textembedding-gecko@003";
  if (!project) return null;

  const authOptions: any = {
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  };
  const credentials = (() => {
    try {
      return decodeServiceAccount();
    } catch {
      return null;
    }
  })();
  if (credentials) {
    authOptions.credentials = credentials;
    authOptions.projectId = project;
  } else {
    const keyFilename = env("GOOGLE_APPLICATION_CREDENTIALS");
    if (keyFilename) {
      authOptions.keyFilename = keyFilename;
      authOptions.projectId = project;
    }
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  const client = await auth.getClient();
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:predict`;
  const response = await client.request({
    url,
    method: "POST",
    data: { instances: [{ content: text }] },
  });
  const predictions = (response.data as any)?.predictions;
  const candidate =
    predictions?.[0]?.embeddings?.values ??
    predictions?.[0]?.embedding?.values ??
    predictions?.[0]?.embeddings?.[0]?.values ??
    predictions?.[0]?.embedding;
  const vector = normalizeVector(candidate);
  if (!vector) {
    throw new Error("vertex_sin_embedding");
  }
  return vector;
}

function fallbackDim(): number {
  const raw = env("EMBEDDINGS_FALLBACK_DIM");
  const num = raw ? Number(raw) : NaN;
  if (Number.isFinite(num) && num > 0) return Math.floor(num);
  return 384;
}

function generateDeterministicVector(text: string): number[] {
  const dim = fallbackDim();
  let buffer = crypto.createHash("sha256").update(text).digest();
  const result: number[] = [];
  while (result.length < dim) {
    for (let offset = 0; offset + 4 <= buffer.length && result.length < dim; offset += 4) {
      const chunk = buffer.subarray(offset, offset + 4);
      const value = chunk.readInt32BE(0) / 0x7fffffff;
      result.push(value);
    }
    if (result.length < dim) {
      buffer = crypto.createHash("sha256").update(buffer).digest();
    }
  }
  return result;
}

async function runProvider(provider: string, text: string): Promise<number[] | null> {
  switch (provider) {
    case "openai":
    case "openai_v1":
      return embedWithOpenAI(text);
    case "azure":
    case "azure_openai":
      return embedWithAzureOpenAI(text);
    case "vertex":
    case "google":
    case "gcp":
      return embedWithVertex(text);
    case "cohere":
      return embedWithCohere(text);
    case "voyage":
      return embedWithVoyage(text);
    case "mock":
    case "fake":
    case "fallback":
      return generateDeterministicVector(text);
    default:
      return null;
  }
}

export async function embed(text: string): Promise<number[]> {
  const input = (text ?? "").toString();
  if (!input.trim()) {
    throw new Error("texto_vacio");
  }

  const providers = providerOrder();
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const vector = await runProvider(provider, input);
      if (Array.isArray(vector) && vector.length) {
        return vector;
      }
      if (Array.isArray(vector) && !vector.length) {
        errors.push(`${provider}:vector_vacio`);
      }
    } catch (err: any) {
      errors.push(`${provider}:${err?.message || err}`);
    }
  }

  if (!providers.includes("fallback") && !providers.includes("mock") && !providers.includes("fake")) {
    errors.push("sin_provider_exitoso");
    throw new Error(`embed_failed:${errors.join(";")}`);
  }

  return generateDeterministicVector(input);
}