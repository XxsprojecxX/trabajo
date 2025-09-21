import { NextResponse } from "next/server";

/**
 * Enrichment API (stub seguro)
 * - Responde 200 con cuerpo vacío (campos null) para permitir fallback en el cliente.
 * - Más adelante conectamos BigQuery y devolvemos datos reales.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || null;

  // TODO(real): consultar BigQuery y retornar { alma, emociones, resonancia, capitalSimbolico, cloud }
  // Por ahora, devolvemos shape vacío con 200 para evitar 404 y activar el merge real→fallback en la UI.
  const payload = {
    id,
    alma: null,
    emociones: null,
    resonancia: null,
    capitalSimbolico: null,
    cloud: null,
  };

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
