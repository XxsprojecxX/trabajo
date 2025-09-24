| Archivo | Exports | Imports (local) | Env vars | API calls | Notas |
|---|---|---|---|---|---|
| `frontend/app/api/bq-dryrun/route.ts` | — | — | GOOGLE_DATASET, GOOGLE_PROJECT_ID, GOOGLE_TABLE | — | posible ruta Next.js, posible API route |
| `frontend/app/api/comments/v1/route.ts` | dynamic | — | BQ_LOCATION, COMMENTS_METRICS_TABLE_FQN, COMMENTS_VIEW_FQN, GOOGLE_CLOUD_PROJECT, GOOGLE_PROJECT_ID | — | posible ruta Next.js, posible API route |
| `frontend/app/api/contenidos/route.ts` | — | — | — | — | posible ruta Next.js, posible API route |
| `frontend/app/api/creadoras/route.ts` | — | — | — | — | posible ruta Next.js, posible API route |
| `frontend/app/api/embeddings/route.ts` | — | — | EMBEDDINGS_PROVIDER_ORDER | — | posible ruta Next.js, posible API route |
| `frontend/app/api/enrichment/route.ts` | — | — | — | — | posible ruta Next.js, posible API route |
| `frontend/app/api/health/route.ts` | — | — | — | — | posible ruta Next.js, posible API route |
| `frontend/app/api/ig/route.ts` | — | — | IG_SHEET_ID, IG_SHEET_TAB | — | posible ruta Next.js, posible API route |
| `frontend/app/api/insights/route.ts` | dynamic, revalidate, runtime | — | GOOGLE_APPLICATION_CREDENTIALS | — | posible ruta Next.js, posible API route |
| `frontend/app/api/topicos.off/route.ts` | dynamic, revalidate, runtime | — | GOOGLE_APPLICATION_CREDENTIALS | — | posible ruta Next.js, posible API route |
| `frontend/app/api/topicos.off/topicos/route.ts` | runtime | — | GOOGLE_APPLICATION_CREDENTIALS | — | posible ruta Next.js, posible API route |
| `frontend/app/api/topicos/route.ts` | runtime | — | GOOGLE_APPLICATION_CREDENTIALS | — | posible ruta Next.js, posible API route |
| `frontend/app/api/topicos/v2/route.ts` | — | — | TOPICOS_VIEW_V2 | — | posible ruta Next.js, posible API route |
| `frontend/app/comments/page.tsx` | CommentsPage | — | — | — | posible ruta Next.js |
| `frontend/app/contenidos-lite/page.tsx` | dynamic | — | — | /api/contenidos | posible ruta Next.js |
| `frontend/app/contenidos/page.tsx` | — | — | NEXT_PUBLIC_BASE_URL | — | posible ruta Next.js |
| `frontend/app/creadoras/page.tsx` | — | — | NEXT_PUBLIC_BASE_URL | — | posible ruta Next.js |
| `frontend/app/dashboard/page.tsx` | DashboardPage | — | NEXT_PUBLIC_BASE_URL | — | posible ruta Next.js |
| `frontend/app/insights/BigQueryStrip.tsx` | BigQueryStrip | — | — | — | posible ruta Next.js |
| `frontend/app/insights/OriginalUI.tsx` | InsightsPage | — | — | — | posible ruta Next.js |
| `frontend/app/insights/page.tsx` | — | — | NEXT_PUBLIC_BASE_URL | — | posible ruta Next.js |
| `frontend/app/layout.tsx` | RootLayout, metadata | ./globals.css | — | — | posible ruta Next.js |
| `frontend/app/not-found.tsx` | NotFound | — | — | — | posible ruta Next.js |
| `frontend/app/page.tsx` | Home | — | — | — | posible ruta Next.js |
| `frontend/app/topicos-lite/page.tsx` | dynamic | — | — | http://localhost:3000/api/topicos?limit=20 | posible ruta Next.js |
| `frontend/app/topicos-page.tsx` | TopicosPage | — | — | /api/topicos?limit=30 | posible ruta Next.js |
| `frontend/app/topicos/pack/page.tsx` | TopicosPage | — | — | — | posible ruta Next.js |
| `frontend/app/topicos/page.tsx` | TopicosPage | — | — | — | posible ruta Next.js |
| `frontend/middleware.ts` | config, middleware | — | TOPICOS_VIEW | — | — |
| `frontend/next.config.js` | — | — | — | — | — |