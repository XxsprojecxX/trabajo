#!/usr/bin/env python3
import json, argparse, shutil, os, time
from pathlib import Path

def p(*a): print(*a, flush=True)

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def mkdirp(pth, apply):
    pth = Path(pth)
    if apply: pth.mkdir(parents=True, exist_ok=True)
    else: p(f"[dry] mkdir -p {pth}")
    return pth

def copy_if_exists(src, dst_dir, apply):
    src = Path(src); dst_dir = Path(dst_dir)
    if src.is_file():
        if apply:
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst_dir / src.name)
        else:
            p(f"[dry] copy {src} -> {dst_dir}/{src.name}")
        return True
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", default="architecture.json")
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    arch = load_json(args.json)

    def node(nid):
        for n in arch["nodes"]:
            if n.get("id")==nid: return n
        return None

    n_front = node("frontend_app")
    n_api   = node("api_next")
    n_mid   = node("middleware")
    n_bq    = node("gcp_bq")

    if not n_front or not n_api or not n_mid:
        raise SystemExit("Faltan nodos: frontend_app/api_next/middleware")

    front_path = Path(n_front["path"]).resolve()
    api_path   = Path(n_api["path"]).resolve()
    mid_path   = Path(n_mid["path"]).resolve()
    pages      = n_front.get("pages", [])
    routes     = n_api.get("routes", [])
    views_expected = (n_bq or {}).get("views_expected", [])

    out_root = Path(f"gmx_refactor_{time.strftime('%Y%m%d_%H%M%S')}")
    dst_front = out_root / "frontend"
    dst_app   = dst_front / "app"
    dst_api   = dst_app / "api"

    p(">> Plan")
    p(f"   nueva carpeta: {out_root}")
    p(f"   origen front:  {front_path}")
    p(f"   origen api:    {api_path}")
    p(f"   middleware:    {mid_path}")
    p(f"   páginas:       {', '.join(pages) or '—'}")
    p(f"   rutas:         {', '.join(routes) or '—'}")

    mkdirp(dst_front, args.apply)
    mkdirp(dst_app, args.apply)
    mkdirp(dst_api, args.apply)
    mkdirp(out_root / "_artifacts", args.apply)

    if mid_path.is_file():
        copy_if_exists(mid_path, dst_front, args.apply)
    else:
        p(f"WARN: no encontré {mid_path}")

    for page in pages:
        clean = page.split(" ")[0].strip()
        clean = clean[1:] if clean.startswith("/") else clean
        if clean in ("", "(home)"):
            candidates = [front_path / "page.tsx", front_path / "page.ts"]
            target_dir = dst_app
        else:
            candidates = [front_path / clean / "page.tsx", front_path / clean / "page.ts"]
            target_dir = dst_app / clean
        hit = any(copy_if_exists(c, target_dir, args.apply) for c in candidates)
        if not hit:
            p(f"WARN: página '{page}' no encontrada. Busqué: {', '.join(map(str, candidates))}")

    for route in routes:
        if not route.startswith("/api/"): 
            continue
        name = route[len("/api/"):]
        dest_dir = dst_api / name
        src_ts = api_path / name / "route.ts"
        src_js = api_path / name / "route.js"
        if not copy_if_exists(src_ts, dest_dir, args.apply) and not copy_if_exists(src_js, dest_dir, args.apply):
            p(f"WARN: route '{route}' no encontrada. Busqué: {src_ts} | {src_js}")

    env_tmpl = out_root / ".env.template"
    env_front = (
        "# FRONTEND\n"
        "NEXT_PUBLIC_BASE_URL=http://localhost:3000\n"
        "# TOPICOS_VIEW=v2   # opcional para middleware\n"
    )
    env_back = (
        "\n# BACKEND (Next API / BigQuery)\n"
        "GOOGLE_PROJECT_ID=\n"
        "GOOGLE_APPLICATION_CREDENTIALS=./keys/service-account.json\n"
        "BQ_LOCATION=US\n"
        "GOOGLE_DATASET=gmx\n"
        "GOOGLE_TABLE=vw_social_post_with_pilar\n"
        "TOPICOS_VIEW_V2=gmx.vw_topicos_v2\n"
        "COMMENTS_VIEW_FQN=gmx.vw_comments_app_api_latest\n"
        "\n# Sheets (si usas /api/ig)\n"
        "IG_SHEET_ID=\n"
        "IG_SHEET_TAB=ig_master\n"
        "\n# Extras\n"
        "EMBEDDINGS_PROVIDER_ORDER=openai,vertex,local\n"
        "API_KEY=\n"
        "ENRICHMENT_MOCK=0\n"
    )
    if args.apply:
        env_tmpl.write_text(env_front + env_back, encoding="utf-8")
    else:
        p(f"[dry] write {env_tmpl}")

    env_verify = out_root / "env-verify.sh"
    verify_sh = """#!/usr/bin/env bash
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
"""
    if args.apply:
        env_verify.write_text(verify_sh, encoding="utf-8")
        os.chmod(env_verify, 0o755)
    else:
        p(f"[dry] write {env_verify}")

    readme = out_root / "README_WIRING.md"
    views_txt = "\n".join(f"- {v}" for v in views_expected)
    readme_txt = f"""# GMX Refactor (auto)
- Arquitectura: ver architecture.json
- Front: {dst_front}/app
- API:   {dst_front}/app/api
- Middleware: {dst_front}/middleware.ts (si fue copiado)
- Env base: .env.template (copiar a .env y completar)
- Verificador: ./env-verify.sh (ejecútalo dentro de {out_root})

## BQ Vistas esperadas
{views_txt}

## Comandos sugeridos
cd {out_root} && cp .env.template .env && ./env-verify.sh
"""
    if args.apply:
        readme.write_text(readme_txt, encoding="utf-8")
    else:
        p(f"[dry] write {readme}")

    p()
    if args.apply:
        p(f"✅ Hecho. Nueva estructura en: {out_root}")
        p(f"Siguiente: cd {out_root} && cp .env.template .env && ./env-verify.sh")
    else:
        p("🧪 Dry-run completo. Ejecuta con: python3 organiza_desde_json.py --apply")

if __name__ == "__main__":
    main()
