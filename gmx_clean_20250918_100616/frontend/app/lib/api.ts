// app/lib/api.ts
declare const process: any;
const base = process.env.NEXT_PUBLIC_BASE_URL || "";
export const api = {
  topicos: async () =>
    (await fetch(`${base}/api/topicos/v2?limit=120`, { cache: "no-store" })).json(),
  contenidos: async () =>
    (await fetch(`${base}/api/contenidos?limit=200`, { cache: "no-store" })).json(),
  insights: async () =>
    (await fetch(`${base}/api/insights?limit=200`, { cache: "no-store" })).json(),
};
