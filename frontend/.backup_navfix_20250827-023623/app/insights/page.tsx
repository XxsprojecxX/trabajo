import BigQueryStrip, { Analisis } from "./BigQueryStrip";
import OriginalUI from "./OriginalUI";

async function getData(): Promise<Analisis[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/insights`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data ?? []) as Analisis[];
}

export default async function Page() {
  const resultados = await getData();
  const safe = resultados.slice(0, 60); // por si hay demasiados registros

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 🔝 Datos reales de BigQuery */}
        <BigQueryStrip resultados={safe} />
      </div>

      {/* ⬇️ Tu UI intacta, sin cambios */}
      <OriginalUI />
    </div>
  );
}