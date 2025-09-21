#!/usr/bin/env python3
# Limpia y organiza un proyecto Next.js + API + Python jobs + CF + Scrapers
# Autodetecta app/, api/, middleware.ts, jobs .py, ingestion; excluye .next, node_modules y backups.

import os, shutil, time, re
from pathlib import Path

def log(*a): print(*a, flush=True)
def mkdirp(p): Path(p).mkdir(parents=True, exist_ok=True)
def copy_file(src: Path, dst_dir: Path):
    if src.is_file():
        dst_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst_dir / src.name)
        return True
    return False
def copy_tree(src: Path, dst: Path, includes=None, excludes=None):
    if not src.exists(): return 0
    count = 0
    for root, dirs, files in os.walk(src):
        r = Path(root)
        parts = set(r.parts)
        if ".next" in parts or "node_modules" in parts:
            dirs[:] = []
            continue
        if excludes and any(re.search(pat, str(r)) for pat in excludes):
            dirs[:] = []
            continue
        for f in files:
            sp = r / f
            # excluir backups/basura
            if any(s in sp.name for s in (".bak", ".backup", ".SAFE", ".SAVE")):
                continue
            if re.search(r"\.(png|jpg|jpeg|gif)$", sp.name) and "error_timeout_" in sp.name:
                continue
            if includes and not any(re.search(pat, str(sp)) for pat in includes):
                continue
            if excludes and any(re.search(pat, str(sp)) for pat in excludes):
                continue
            rel = sp.relative_to(src)
            dp = dst / rel.parent
            dp.mkdir(parents=True, exist_ok=True)
            shutil.copy2(sp, dp / sp.name)
            count += 1
    return count

def find_first(candidates):
    for c in candidates:
        p = Path(c)
        if p.exists():
            return p.resolve()
    return None

def find_app_root():
    return find_first(["./frontend/app","./app"]) or (next((x.resolve() for x in Path(".").glob("**/app")), None))

def find_api_root():
    return find_first(["./frontend/app/api","./app/api"]) or (next((x.resolve() for x in Path(".").glob("**/app/api")), None))

def find_middleware():
    return find_first(["./frontend/middleware.ts","./middleware.ts"])

def main():
    repo = Path(".").resolve()
    app_root = find_app_root()
    api_root = find_api_root()
    middleware = find_middleware()

    if not app_root:
        log("❌ No encontré carpeta 'app' (ni ./frontend/app ni ./app). Ejecuta desde la raíz del repo.")
        return 1

    out_root = Path(f"gmx_clean_{time.strftime('%Y%m%d_%H%M%S')}")
    dst_front = out_root / "frontend"
    dst_app   = dst_front / "app"
    dst_api   = dst_app / "api"
    dst_back  = out_root / "backend"
    dst_jobs  = dst_back / "python_jobs"
    dst_me    = out_root / "maestro_ejecucion"
    dst_cf    = out_root / "cloud_functions"
    dst_ing   = out_root / "ingestion"

    log(">> Plan (autodetect)")
    log(f"   repo:         {repo}")
    log(f"   app_root:     {app_root}")
    log(f"   api_root:     {api_root if api_root else 'NO-API'}")
    log(f"   middleware:   {middleware if middleware else 'NO-MIDDLEWARE'}")
    log(f"   destino:      {out_root}")
    mkdirp(dst_api); mkdirp(dst_jobs); mkdirp(dst_cf); mkdirp(dst_ing)

    # 1) Páginas Next.js (page/layout/loading/error/not-found/head + *.tsx/ts dentro de app/)
    page_includes = [
        r"/page\.(ts|tsx|js|jsx)$", r"/_layout\.(ts|tsx|js|jsx)$",
        r"/loading\.(ts|tsx|js|jsx)$", r"/error\.(ts|tsx|js|jsx)$",
        r"/not-found\.(ts|tsx|js|jsx)$", r"/layout\.(ts|tsx|js|jsx)$",
        r"/head\.(ts|tsx|js|jsx)$", r"/.*\.(tsx|ts)$"
    ]
    page_excludes = [r"\.next/", r"node_modules/", r"/_bak/", r"\.bak", r"\.backup"]
    copied_pages = copy_tree(app_root, dst_app, includes=page_includes, excludes=page_excludes)
    log(f"   Copié páginas/ts(x): {copied_pages}")

    # 2) API routes
    if api_root and api_root.exists():
        api_includes = [r"/route\.(ts|js)$"]
        api_excludes = [r"\.next/", r"node_modules/", r"/_bak/", r"\.bak", r"\.backup"]
        copied_api = copy_tree(api_root, dst_api, includes=api_includes, excludes=api_excludes)
        log(f"   Copié rutas API: {copied_api}")
    else:
        log("   WARN: no API root detectado")

    # 3) Middleware
    if middleware and middleware.is_file():
        copy_file(middleware, dst_front)
        log("   Copié middleware.ts")
    else:
        log("   WARN: no middleware.ts encontrado")

    # 4) Config Next + package.json (desde ./frontend o raíz)
    pkg_src  = find_first(["./frontend/package.json","./package.json"])
    next_cfg = find_first(["./frontend/next.config.js","./next.config.js","./frontend/next.config.mjs","./next.config.mjs"])
    if pkg_src:  copy_file(pkg_src,  dst_front); log("   Copié package.json")
    if next_cfg: copy_file(next_cfg, dst_front); log("   Copié next.config.*")

    # 5) Python jobs (selección curada)  — FIX: ignorar out_root/gmx_clean_* y evitar SameFileError
    jobs_patterns = [
        r"(^|/)data_processor\.py$", r"(^|/)combinador\.py$",
        r"(^|/)recolector_.*\.py$", r"(^|/)recolector_final.*\.py$",
        r"(^|/)recolector_local\.py$", r"(^|/)reparar_.*\.py$",
        r"(^|/)configurar_proyecto\.py$", r"(^|/)configurador_campana\.py$",
        r"(^|/)diagnosticar_.*\.py$", r"(^|/)diagnostico_.*\.py$",
        r"(^|/)validador_web/.*\.py$", r"(^|/)tools/.*\.py$", r"(^|/)orquestador/.*\.py$"
    ]
    jobs_count = 0
    out_abs = out_root.resolve()
    for root, _, files in os.walk("."):
        r = Path(root).resolve()
        # ignora venv/node_modules/.next y cualquier carpeta gmx_clean_* (incluyendo la que estamos creando)
        if any(x in r.parts for x in (".venv","venv","node_modules",".next")): 
            continue
        if "gmx_clean_" in str(r):
            continue
        for f in files:
            sp = r / f
            if sp.suffix != ".py":
                continue
            s = str(sp)
            if any(re.search(p, s) for p in jobs_patterns):
                if any(tok in s for tok in ("/snapshots/","/DATA/")): 
                    continue
                if any(x in f for x in (".bak",".backup")):
                    continue
                dst_dir = (dst_jobs / sp.name) if sp.parent == Path(out_abs) else (dst_jobs / sp.parent.name)
                dst_dir.mkdir(parents=True, exist_ok=True)
                dst_file = dst_dir / sp.name
                # Evita copiar si src y dst serían el mismo path
                if sp.resolve() == dst_file.resolve():
                    continue
                shutil.copy2(sp, dst_file)
                jobs_count += 1
    log(f"   Copié Python jobs: {jobs_count}")

    # 6) maestro_ejecucion/
    if Path("./maestro_ejecucion").exists():
        copied_me = copy_tree(Path("./maestro_ejecucion"), dst_me, excludes=[r"\.pyc$", r"__pycache__", r"\.bak", r"\.backup"])
        log(f"   Copié maestro_ejecucion/: {copied_me} archivos")
    else:
        log("   maestro_ejecucion/ no encontrado (ok)")

    # 7) ingestion (BrightData + DATA + snapshots + load)
    for f in ["brightdata_connector.py","brightdata_scrapers.json"]:
        if Path(f).exists(): copy_file(Path(f), dst_ing)
    for d in ["snapshots","DATA","load"]:
        if Path(d).exists():
            copied = copy_tree(Path(d), dst_ing / d, excludes=[r"\.bak", r"\.backup", r"__pycache__"])
            log(f"   Copié {d}/: {copied} archivos")

    # 8) .env.template y verificador
    env_tmpl = out_root / ".env.template"
    env_text = (
        "# FRONTEND\n"
        "NEXT_PUBLIC_BASE_URL=http://localhost:3000\n"
        "# TOPICOS_VIEW=v2   # opcional para middleware\n\n"
        "# BACKEND (Next API / BigQuery)\n"
        "GOOGLE_PROJECT_ID=\n"
        "GOOGLE_APPLICATION_CREDENTIALS=./keys/service-account.json\n"
        "BQ_LOCATION=US\n"
        "GOOGLE_DATASET=gmx\n"
        "GOOGLE_TABLE=vw_social_post_with_pilar\n"
        "TOPICOS_VIEW_V2=gmx.vw_topicos_v2\n"
        "COMMENTS_VIEW_FQN=gmx.vw_comments_app_api_latest\n\n"
        "# Sheets (si usas /api/ig)\n"
        "IG_SHEET_ID=\n"
        "IG_SHEET_TAB=ig_master\n\n"
        "# Extras\n"
        "EMBEDDINGS_PROVIDER_ORDER=openai,vertex,local\n"
        "API_KEY=\n"
        "ENRICHMENT_MOCK=0\n"
    )
    env_tmpl.write_text(env_text, encoding="utf-8")

    env_verify = out_root / "env-verify.sh"
    env_verify.write_text("""#!/usr/bin/env bash
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
""", encoding="utf-8")
    os.chmod(env_verify, 0o755)

    # 9) .gitignore
    (out_root / ".gitignore").write_text("""# node
node_modules/
.next/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
# python
__pycache__/
*.pyc
*.pyo
*.pyd
# env
.env
keys/
# artifacts
_artifacts/
""", encoding="utf-8")

    # 10) README
    (out_root / "README_WIRING.md").write_text(f"""# GMX Clean (auto)
Estructura limpia y lista:
- Frontend: {dst_front}/app
- API:      {dst_front}/app/api
- Middleware: {dst_front}/middleware.ts (si fue copiado)
- Python jobs: {dst_jobs}
- Maestro ejecución: {dst_me} (si existía)
- Ingesta: {dst_ing}
- Env base: .env.template (copiar a .env y completar)
- Verificador: ./env-verify.sh

## Pasos
cd {out_root}
cp .env.template .env
./env-verify.sh
""", encoding="utf-8")

    log("")
    log(f"✅ Hecho. Nueva estructura en: {out_root}")
    log(f"Siguiente: cd {out_root} && cp .env.template .env && ./env-verify.sh")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
