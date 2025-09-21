## Avances al 2025-09-03

- **Integración de datos de Instagram**
  - Tablas `cur_instagram_*` creadas y validadas (`posts`, `profiles`, `comments`, `account_daily`).
  - Vistas `vw_instagram_post_dashboard` y `vw_instagram_comments_dashboard` funcionando con datos reales.
  - Scheduled queries configuradas y verificadas para refrescar diariamente.

- **Integración de datos de TikTok**
  - Vistas `vw_tiktok_post_dashboard` listas y probadas.
  - Validación de datos realizada con conteos y vistas previas.

- **Integración unificada**
  - Creada vista `vw_social_post_dashboard` que consolida IG + TikTok para dashboards.

📌 Este commit deja registrada la primera **foto integral del pipeline de redes sociales** (IG + TikTok) en BigQuery.
