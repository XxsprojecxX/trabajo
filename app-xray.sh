#!/usr/bin/env zsh
set -euo pipefail

OUT="app_map.md"
echo "# App Map / Dependency X-Ray" > "$OUT"
echo "_$(date)_" >> "$OUT"
echo "" >> "$OUT"

# 0) Contexto general
echo "## Contexto del repo" >> "$OUT"
echo '```bash' >> "$OUT"
pwd >> "$OUT"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git branch --show-current || echo "no-git" >> "$OUT"
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 1) Inventario base
echo "## Inventario base" >> "$OUT"
echo '```bash' >> "$OUT"
ls -la >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 2) Páginas Next.js y Rutas API (si aplica)
echo "## Next.js — Páginas y Rutas API" >> "$OUT"
echo '```bash' >> "$OUT"
# Páginas
find . -type f -path "*/app/*/page.*" -maxdepth 6 2>/dev/null | sort >> "$OUT" || true
# Rutas
find . -type f -path "*/app/api/*/route.*" -maxdepth 8 2>/dev/null | sort >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 3) Dependencias JS/TS (árbol rápido)
echo "## JS/TS — Árbol rápido de archivos" >> "$OUT"
echo '```bash' >> "$OUT"
find . -type f $begin:math:text$ -name "*.ts" -o -name "*.tsx" -o -name "package.json" -o -name "next.config.*" $end:math:text$ 2>/dev/null | sort | sed -n '1,200p' >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 4) Endpoints externos (Cloud Functions, APIs)
echo "## Endpoints externos (Cloud Functions / APIs)" >> "$OUT"
echo '```bash' >> "$OUT"
# URLs de GCF y palabras clave
command -v rg >/dev/null 2>&1 && RG=rg || RG="grep -Rni"
$RG "cloudfunctions\.net|orquestar_analisis_conversacion|analizar_texto_individual|/api/" . 2>/dev/null | sed -n '1,300p' >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 5) Variables de Entorno
echo "## Variables de entorno usadas" >> "$OUT"
echo '```bash' >> "$OUT"
$RG -n "process\.env\.[A-Z0-9_]+|os\.environ\[['\"][A-Z0-9_]+|GOOGLE_PROJECT_ID|GOOGLE_DATASET|GOOGLE_TABLE|BIGQUERY" . 2>/dev/null | sed -n '1,300p' >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 6) BigQuery — consultas y FQNs
echo "## BigQuery — FQNs y consultas detectadas" >> "$OUT"
echo '```bash' >> "$OUT"
$RG -n "\`[a-z0-9-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+\`|FROM [\`\"]?[a-z0-9-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+|CREATE OR REPLACE VIEW" . 2>/dev/null | sed -n '1,300p' >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 7) Python — entrypoints y Cloud Functions
echo "## Python — entrypoints y llamadas HTTP" >> "$OUT"
echo '```bash' >> "$OUT"
find . -type f -name "*.py" 2>/dev/null | sort | sed -n '1,200p' >> "$OUT" || true
echo "" >> "$OUT"
$RG -n "@functions_framework\.http|def main\(|requests\.post|bigquery\.Client|BeautifulSoup|subprocess\.check_output" . 2>/dev/null | sed -n '1,300p' >> "$OUT" || true
echo '```' >> "$OUT"
echo "" >> "$OUT"

# 8) Grafo de dependencias JS/TS (opcional: madge / depcruise)
echo "## Grafo de dependencias (JS/TS)" >> "$OUT"
HAS_NODE=0; command -v node >/dev/null 2>&1 && HAS_NODE=1
if [ $HAS_NODE -eq 1 ]; then
  ROOT_JS="."
  if [ -d "./src" ]; then ROOT_JS="./src"; elif [ -d "./app" ]; then ROOT_JS="./app"; fi
  if npx --yes madge --version >/dev/null 2>&1; then
    npx --yes madge "$ROOT_JS" --extensions ts,tsx,js,jsx --image js-deps.png >/dev/null 2>&1 || true
    if [ -f js-deps.png ]; then
      echo "Se generó js-deps.png (grafo). Ábrelo en VS Code." >> "$OUT"
    else
      echo "madge ejecutado, pero no se generó imagen." >> "$OUT"
    fi
  else
    echo "madge no disponible. Instalación sugerida: npm i -D madge" >> "$OUT"
  fi
else
  echo "Node no disponible: omitiendo grafo JS/TS." >> "$OUT"
fi
echo "" >> "$OUT"

# 9) Resumen corto para lectura rápida
echo "## TL;DR" >> "$OUT"
echo "- Páginas Next.js y rutas API listadas." >> "$OUT"
echo "- Endpoints Cloud Functions y APIs detectados por búsqueda." >> "$OUT"
echo "- Envs y FQNs de BigQuery detectados." >> "$OUT"
echo "- Python: entrypoints, llamadas HTTP y clientes BQ ubicados." >> "$OUT"
echo "- (Opcional) Grafo JS/TS: js-deps.png si madge está disponible." >> "$OUT"
echo "" >> "$OUT"

echo "Listo. Revisa $OUT y (si existe) js-deps.png"
