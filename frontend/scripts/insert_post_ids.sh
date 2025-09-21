#!/usr/bin/env bash
set -euo pipefail

# Proyecto / tabla destino
PROJECT_ID="galletas-piloto-ju-250726"
DATASET="gmx"
TABLE="control_post_ids"

# === 1) SOLO reemplaza los 6 POST_ID de esta semana (en este orden) ===
# [Gi TikTok, Gi IG, Papa TikTok, Papa IG, Mara TikTok, Mara IG]
POST_IDS=(
  "POSTID_GI_TT"
  "POSTID_GI_IG"
  "POSTID_PAPA_TT"
  "POSTID_PAPA_IG"
  "POSTID_MARA_TT"
  "POSTID_MARA_IG"
)

# === 2) Handles fijos (NO CAMBIAN) ===
CREATORS_TT=("@giannacristante" "@papas.de.cuatro" "@mamiabordo")
CREATORS_IG=("@giannacristante" "@papa.de.cuatro" "@mami.a.bordo")

# === 3) Calcular lunes de esta semana (compatible macOS)
WEEK_START=$(python3 - <<'PY'
from datetime import date, timedelta
d = date.today()
monday = d - timedelta(days=d.weekday())
print(monday.isoformat())
PY
)

# === 4) Construir el INSERT
QUERY="INSERT INTO \`${PROJECT_ID}.${DATASET}.${TABLE}\` (week_start, platform, creator_id, post_id, post_url) VALUES"
QUERY+="
  (DATE('${WEEK_START}'), 'tiktok',    '${CREATORS_TT[0]}', '${POST_IDS[0]}', 'https://www.tiktok.com/${CREATORS_TT[0]}/video/${POST_IDS[0]}'),"
QUERY+="
  (DATE('${WEEK_START}'), 'instagram', '${CREATORS_IG[0]}', '${POST_IDS[1]}', 'https://www.instagram.com/p/${POST_IDS[1]}/'),"
QUERY+="
  (DATE('${WEEK_START}'), 'tiktok',    '${CREATORS_TT[1]}', '${POST_IDS[2]}', 'https://www.tiktok.com/${CREATORS_TT[1]}/video/${POST_IDS[2]}'),"
QUERY+="
  (DATE('${WEEK_START}'), 'instagram', '${CREATORS_IG[1]}', '${POST_IDS[3]}', 'https://www.instagram.com/p/${POST_IDS[3]}/'),"
QUERY+="
  (DATE('${WEEK_START}'), 'tiktok',    '${CREATORS_TT[2]}', '${POST_IDS[4]}', 'https://www.tiktok.com/${CREATORS_TT[2]}/video/${POST_IDS[4]}'),"
QUERY+="
  (DATE('${WEEK_START}'), 'instagram', '${CREATORS_IG[2]}', '${POST_IDS[5]}', 'https://www.instagram.com/p/${POST_IDS[5]}/');"

echo "Ejecutando inserción en BigQuery para semana que inicia ${WEEK_START}..."
bq query --use_legacy_sql=false --project_id="${PROJECT_ID}" "${QUERY}"
