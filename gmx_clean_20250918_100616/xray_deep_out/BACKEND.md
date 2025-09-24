# BACKEND — Orquestador/Servicios

## Módulos backend
- backend/python_jobs/orquestador/main.py
- backend/python_jobs/orquestador/recolector_final.py
- backend/python_jobs/orquestador/reparar_script.py
- maestro_ejecucion/main.py
## Entradas/Env
- BRIGHTDATA_API_TOKEN
- BRIGHTDATA_ZONE_NAME
## BigQuery usado
- api.brightdata.com
- e.response.status_code
- e.response.text
- google.auth.transport
- google.oauth2.id_token
- os.path.basename
- os.path.join
- requests.exceptions.HTTPError
- requests.exceptions.RequestException
- us-central1-galletas-piloto-ju-250726.cloudfunctions.net

### Observaciones
- Verificar contrato del analizador: usar `{"texto": ...}`.
- Si hay columnas JSON en BQ, serializar dict/list con `json.dumps` antes de insertar.
