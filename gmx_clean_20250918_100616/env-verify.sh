#!/usr/bin/env bash
set -euo pipefail
source ./.env 2>/dev/null || true
ok=1
req=(NEXT_PUBLIC_BASE_URL GOOGLE_PROJECT_ID GOOGLE_APPLICATION_CREDENTIALS BQ_LOCATION TOPICOS_VIEW_V2)
echo "== ENV CHECK =="
for v in "${req[@]}"; do
  val="${!v:-}"
  if [[ -z "$val" ]]; then echo "FALTA: $v"; ok=0; else echo "OK: $v=${val:0:6}…"; fi
done
echo "Vista efectiva TOPICOS_VIEW_V2=${TOPICOS_VIEW_V2:-gmx.vw_topicos_v2}"
exit $((1-ok))
