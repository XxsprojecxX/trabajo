# RUNBOOK E2E
1) Scrapers → `caption.json` + `comments.json` → `prep_payload.py`.
2) Llamar al orquestador (ID token) con `fuente_principal.texto`.
3) Verificar escritura en BigQuery y lectura desde UI Flask.
4) Automatizar con Jobs + Scheduler.
