#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="galletas-piloto-ju-250726"
DATASET="gmx"
TABLE="control_post_ids"

# Post IDs de hoy (orden fijo):
# 1 Gi TikTok, 2 Gi IG, 3 Papa TikTok, 4 Papa IG, 5 Mara TikTok, 6 Mara IG
POST_IDS=(
  "ZSA7SHe3o"    # Gi Cristante TikTok
  "DOMzsK4D7Zs"  # Gi Cristante Instagram
  "ZSA7DWsjg"    # Papás de cuatro TikTok
  "DOM3fIJCbkd"  # Papá de cuatro Instagram
  "ZSA7Preuu"    # Mami a bordo TikTok
  "DOMyARzjFL7"  # Mami a bordo Instagram
)

# Handles fijos
CREATORS_TT=("@giannacristante" "@papas.de.cuatro" "@mamiabordo")
CREATORS_IG=("@giannacristante" "@papa.de.cuatro" "@mami.a.bordo")

# Lunes de esta semana (compatible macOS)
WEEK_START=$(python3 - <<'PY'
from datetime import date, timedelta
d = date.today()
print((d - timedelta(days=d.weekday())).isoformat())
PY
)

# Construcción del INSERT
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
