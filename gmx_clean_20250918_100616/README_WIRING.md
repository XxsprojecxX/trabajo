# GMX Clean (auto)
Estructura limpia y lista:
- Frontend: gmx_clean_20250918_100616/frontend/app
- API:      gmx_clean_20250918_100616/frontend/app/api
- Middleware: gmx_clean_20250918_100616/frontend/middleware.ts (si fue copiado)
- Python jobs: gmx_clean_20250918_100616/backend/python_jobs
- Maestro ejecución: gmx_clean_20250918_100616/maestro_ejecucion (si existía)
- Ingesta: gmx_clean_20250918_100616/ingestion
- Env base: .env.template (copiar a .env y completar)
- Verificador: ./env-verify.sh

## Pasos
cd gmx_clean_20250918_100616
cp .env.template .env
./env-verify.sh


## Variables de entorno

- `COMMENTS_METRICS_TABLE_FQN`: tabla completa de BigQuery (`proyecto.dataset.tabla`) opcional para persistir los agregados de comentarios. Si se deja vacía, la API calculará las métricas en memoria.
