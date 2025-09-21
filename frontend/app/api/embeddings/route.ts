import { embed } from "@/lib/embeddings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "hola mundo";
  try {
    const v = await embed(q);
    return Response.json({ ok: true, provider_order: process.env.EMBEDDINGS_PROVIDER_ORDER, dim: v.length, preview: v.slice(0,8) });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "embed_error" }, { status: 500 });
  }
}
