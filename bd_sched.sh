#!/usr/bin/env bash
set -euo pipefail

API_KEY="ec865a7d-823e-43e5-b5ef-fdf48701d88b"
CRON_EXPR="0 5 * * *"        # 05:00 UTC, antes del refresco 06:00 UTC
SCHED_NAME="AutoDailyRun"
API_BASE="https://api.brightdata.com/datasets/v3"
AUTH_HEADER="Authorization: Bearer ${API_KEY}"
CT_JSON="Content-Type: application/json"

DATASETS=(
  "TikTok - Profiles:gd_l1villgoiiidt09ci"
  "TikTok - Posts:gd_lu702nij2f790tmv9h"
  "TikTok - Comments:gd_lkf2st302ap89utw5k"
  "Instagram - Profiles:gd_l1vikfch901nx3by4"
  "Instagram - Posts:gd_lk5ns7kz21pck8jpis"
  "Instagram - Comments:gd_ltppn085pokosxh13"
)

echo "== Creando/actualizando schedulers (${CRON_EXPR}) =="
for ITEM in "${DATASETS[@]}"; do
  NAME="${ITEM%%:*}"
  ID="${ITEM##*:}"
  echo "--> ${NAME} (${ID})"

  EXISTING_ID=$(
    curl -sS -H "${AUTH_HEADER}" "${API_BASE}/schedulers" \
    | jq -r --arg did "$ID" --arg nm "$SCHED_NAME" \
      '.[] | select(.dataset_id==$did and .name==$nm) | .id' | head -n1
  ) || true

  if [[ -n "${EXISTING_ID}" && "${EXISTING_ID}" != "null" ]]; then
    RESP=$(
      curl -sS -X PATCH \
        -H "${AUTH_HEADER}" -H "${CT_JSON}" \
        -d "{\"cron_expr\":\"${CRON_EXPR}\",\"active\":true}" \
        "${API_BASE}/schedulers/${EXISTING_ID}" 2>/dev/null || true
    )
    if [[ -z "$RESP" || "$RESP" == "null" || "$RESP" == "{}" ]]; then
      curl -sS -X DELETE -H "${AUTH_HEADER}" "${API_BASE}/schedulers/${EXISTING_ID}" >/dev/null || true
      RESP=$(
        curl -sS -X POST \
          -H "${AUTH_HEADER}" -H "${CT_JSON}" \
          -d "{\"dataset_id\":\"${ID}\",\"name\":\"${SCHED_NAME}\",\"cron_expr\":\"${CRON_EXPR}\",\"active\":true}" \
          "${API_BASE}/schedulers"
      )
    fi
  else
    RESP=$(
      curl -sS -X POST \
        -H "${AUTH_HEADER}" -H "${CT_JSON}" \
        -d "{\"dataset_id\":\"${ID}\",\"name\":\"${SCHED_NAME}\",\"cron_expr\":\"${CRON_EXPR}\",\"active\":true}" \
        "${API_BASE}/schedulers"
    )
  fi

  echo "$RESP" | jq '{id, name, dataset_id, cron_expr, active, next_run}'
done

echo "== Verificación =="
curl -sS -H "${AUTH_HEADER}" "${API_BASE}/schedulers" \
  | jq '[.[] | {id, name, dataset_id, cron_expr, active, next_run}]'
