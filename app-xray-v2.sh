#!/usr/bin/env zsh
set -euo pipefail

# --- Defaults seguros (evitan "parameter not set") ---
: ${APP_XRAY_OUT:=app_map.md}
: ${MAX_LIST:=300}

OUT="$APP_XRAY_OUT"

# ripgrep opcional
if command -v rg >/dev/null 2>&1; then
  RG_CMD=(rg -n --color=never)
else
  RG_CMD=(grep -Rni)
fi

# Función segura para volcado en bloque
append() { print -r -- "$1" >> "$OUT"; }

# Reset de salida
: > "$OUT"
append "# App Map / Dependency X-Ray"
append "_$(date)_"
append ""

append "## Contexto del repo"
append '```bash'
print -r -- "$PWD" >> "$OUT"
(git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git branch --show-current || echo "no-git") >> "$OUT"
append '```'
append ""

append "## Inventario base"
append '```bash'
ls -la >> "$OUT" || true
append '```'
append ""

append "## Next.js — Páginas y Rutas API"
append '```bash'
# Importante: -maxdepth debe ir antes de las pruebas en GNU/BSD find
find . -maxdepth 6 -type f $begin:math:text$ -name "page.tsx" -o -name "page.ts" -o -name "page.jsx" -o -name "page.js" $end:math:text$ 2>/dev/null | sort | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
find . -maxdepth 8 -type f $begin:math:text$ -name "route.ts" -o -name "route.js" $end:math:text$ 2>/dev/null | sort | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## JS/TS — Árbol rápido de archivos"
append '```bash'
find . -maxdepth 6 -type f $begin:math:text$ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "package.json" -o -name "next.config.*" $end:math:text$ 2>/dev/null \
  | sort | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## Endpoints externos (Cloud Functions / APIs)"
append '```bash'
"${RG_CMD[@]}" "cloudfunctions\.net|orquestar_analisis_conversacion|analizar_texto_individual|/api/" . 2>/dev/null \
  | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## Variables de entorno usadas"
append '```bash'
"${RG_CMD[@]}" "process\.env\.[A-Z0-9_]+|os\.environ\[['\"][A-Z0-9_]+|GOOGLE_PROJECT_ID|GOOGLE_DATASET|GOOGLE_TABLE|BIGQUERY" . 2>/dev/null \
  | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## BigQuery — FQNs y consultas detectadas"
append '```bash'
# Busca patrones de FQN y DDL sin activar expansión de zsh
"${RG_CMD[@]}" "\`[a-z0-9-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+\`|FROM [\`\"]?[a-z0-9-]+\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+|CREATE OR REPLACE VIEW" . 2>/dev/null \
  | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## Python — entrypoints y llamadas HTTP"
append '```bash'
find . -maxdepth 8 -type f -name "*.py" 2>/dev/null | sort | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append ""
"${RG_CMD[@]}" "@functions_framework\.http|def main\(|requests\.post|bigquery\.Client|BeautifulSoup|subprocess\.check_output" . 2>/dev/null \
  | sed -n "1,${MAX_LIST}p" >> "$OUT" || true
append '```'
append ""

append "## Grafo de dependencias (JS/TS)"
if command -v node >/dev/null 2>&1; then
  ROOT_JS="."
  [[ -d "./src" ]] && ROOT_JS="./src"
  [[ -d "./app" ]] && ROOT_JS="./app"
  if npx --yes madge --version >/dev/null 2>&1; then
    npx --yes madge "$ROOT_JS" --extensions ts,tsx,js,jsx --image js-deps.png >/dev/null 2>&1 || true
    append "Se generó js-deps.png (grafo). Ábrelo en VS Code."
  else
    append "madge no disponible. Instalación sugerida: npm i -D madge"
  fi
else
  append "Node no disponible: omitiendo grafo JS/TS."
fi
append ""

append "## TL;DR"
append "- Páginas Next.js y rutas API listadas."
append "- Endpoints Cloud Functions y APIs detectados por búsqueda."
append "- Envs y FQNs de BigQuery detectados."
append "- Python: entrypoints, llamadas HTTP y clientes BQ ubicados."
append "- (Opcional) Grafo JS/TS: js-deps.png si madge está disponible."
append ""

print -r -- "Listo. Revisa $OUT y (si existe) js-deps.png"
