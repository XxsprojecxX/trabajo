#!/usr/bin/env bash
set -euo pipefail

# === CONFIG ===
API_KEY="ec865a7d-823e-43e5-b5ef-fdf48701d88b"
BASE="https://api.brightdata.com/datasets/v3"
HDR_AUTH="Authorization: Bearer ${API_KEY}"
ROOT_DIR="$(pwd)/data"
TODAY="$(TZ=America/Bogota date +%Y-%m-%d)"

# Crear carpeta destino
DEST_DIR="${ROOT_DIR}/${TODAY}"
mkdir -p "${DEST_DIR}"

declare -A DATASETS=(
  ["tiktok_profiles"]="gd_l1villgoiiidt09ci"
  ["tiktok_posts"]="gd_lu702nij2f790tmv9h"
  ["tiktok_comments"]="gd_lkf2st302ap89utw5k"
  ["ig_profiles"]="gd_l1vikfch901nx3by4"
  ["ig_posts"]="gd_lk5ns7kz21pck8jpis"
  ["ig_comments"]="gd_ltppn085pokosxh13"
)

echo "=== Descargando snapshots de hoy ${TODAY} (Bogotá) ==="

for NAME in "${!DATASETS[@]}"; do
  DATASET_ID="${DATASETS[$NAME]}"
  echo ""
  echo "---> Dataset: ${NAME} (${DATASET_ID})"

  SNAP_JSON="$(curl -s "${BASE}/snapshots?dataset_id=${DATASET_ID}&status=ready" -H "${HDR_AUTH}")"

  mapfile -t IDS < <(echo "${SNAP_JSON}" | jq -r --arg D "${TODAY}" '.[] | select(.created | startswith($D)) | .id')

  if [[ "${#IDS[@]}" -eq 0 ]]; then
    echo "   No hay snapshots 'ready' creados en ${TODAY} para ${NAME}."
    continue
  fi

  echo "   Encontrados ${#IDS[@]} snapshot(s) de hoy."

  for SID in "${IDS[@]}"; do
    OUTFILE="${DEST_DIR}/${NAME}_${SID}.json"
    curl -s "${BASE}/snapshot/${SID}?format=json" -H "${HDR_AUTH}" -o "${OUTFILE}"
    COUNT="$(jq '. | length' "${OUTFILE}" 2>/dev/null || echo 0)"
    echo "   ✓ ${OUTFILE}  (filas: ${COUNT})"
  done
done

echo ""
echo "== ✅ Listo. Archivos guardados en ${DEST_DIR} =="
