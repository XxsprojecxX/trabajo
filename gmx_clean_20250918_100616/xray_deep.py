import ast, os, re, json
from pathlib import Path
from textwrap import shorten
from datetime import datetime

ROOT = Path(".")
OUT  = Path("xray_deep_out"); OUT.mkdir(parents=True, exist_ok=True)
EXCLUDE = {".git","venv",".venv","node_modules","__pycache__",".idea",".DS_Store"}

def read(p: Path):
    try: return p.read_text(encoding="utf-8", errors="ignore")
    except: return ""

def guess_group(path: str) -> str:
    pl = path.lower()
    if "frontend" in pl or "validador_web" in pl or "flask" in pl: return "frontend"
    if "orquestador" in pl or "maestro" in pl: return "backend-orquestador"
    if "recolector" in pl or "scraper" in pl or "ingest" in pl or "ingestion" in pl: return "ingestion"
    if "comment_anal" in pl or "analizer" in pl: return "analytics"
    return "otros"

def extract(p: Path):
    src = read(p)
    info = {
        "file": str(p),
        "group": guess_group(str(p)),
        "size": p.stat().st_size,
        "doc": "",
        "imports": [], "imports_from": [],
        "env_vars": [], "urls": [], "bq_fqn": [], "bq_schema_snippets": [],
        "reads": [], "writes": [],
        "functions": [], "classes": [],
        "flask_routes": [], "cf_entrypoints": [],
        "gaps": [],
    }
    try:
        tree = ast.parse(src)
        info["doc"] = (ast.get_docstring(tree) or "").strip()
    except Exception as e:
        info["gaps"].append(f"Parse error: {e}")
        return info

    # imports
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            for a in n.names: info["imports"].append(a.name)
        elif isinstance(n, ast.ImportFrom):
            if n.module: info["imports_from"].append(n.module)

    # env vars
    info["env_vars"] = sorted(set(
        re.findall(r"os\.getenv\(\s*['\"]([^'\"]+)['\"]", src) +
        re.findall(r"os\.environ\[\s*['\"]([^'\"]+)['\"]\s*\]", src)
    ))

    # endpoints HTTP
    info["urls"] = sorted(set(re.findall(r"https?://[^\s\"')]+", src)))

    # BigQuery (FQN y schema)
    # FQN project.dataset.table → ejemplo: galletas-piloto-ju-250726.analisis_galletas.resultados_analizados
    for m in re.findall(r"([A-Za-z0-9\-_]+)\.([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)", src):
        proj, ds, tb = m
        if "-" in proj or proj.isalpha() or proj.isalnum():  # heurística simple
            info["bq_fqn"].append(".".join(m))
    if "bigquery.SchemaField(" in src:
        # guardamos un snippet para inspección
        snip = []
        take = False
        for line in src.splitlines():
            if "SchemaField(" in line: take = True
            if take: snip.append(line.rstrip())
            if take and "]" in line and "SchemaField" not in line:
                break
        if snip: info["bq_schema_snippets"].append("\n".join(snip[:2000]))

    # file IO
    for m in re.findall(r"open\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"](r|rb)['\"]", src):
        info["reads"].append(m[0])
    for m in re.findall(r"open\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"](w|wb)['\"]", src):
        info["writes"].append(m[0])
    for m in re.findall(r"json\.load\(\s*open\(\s*['\"]([^'\"]+)['\"]", src):
        info["reads"].append(m)
    for m in re.findall(r"json\.dump\([^,]+,\s*open\(\s*['\"]([^'\"]+)['\"]", src):
        info["writes"].append(m)

    # funciones/clases
    for fn in [n for n in tree.body if isinstance(n, ast.FunctionDef)]:
        args = [a.arg for a in fn.args.args]
        rtype = None
        if fn.returns:
            rtype = getattr(fn.returns, "id", None) or getattr(fn.returns, "attr", None)
        info["functions"].append({
            "name": fn.name, "args": args, "returns": rtype,
            "lineno": fn.lineno, "doc": (ast.get_docstring(fn) or "").strip()
        })
        if fn.name in {"orquestar_analisis_conversacion"}:
            info["cf_entrypoints"].append(fn.name)
    for cl in [n for n in tree.body if isinstance(n, ast.ClassDef)]:
        methods = []
        for m in [x for x in cl.body if isinstance(x, ast.FunctionDef)]:
            methods.append({"name": m.name, "args":[a.arg for a in m.args.args], "lineno": m.lineno,
                            "doc": (ast.get_docstring(m) or "").strip()})
        info["classes"].append({
            "name": cl.name, "lineno": cl.lineno,
            "doc": (ast.get_docstring(cl) or "").strip(), "methods": methods
        })

    # Flask routes
    for m in re.finditer(r"@app\.route\(\s*['\"]([^'\"]+)['\"]", src):
        info["flask_routes"].append(m.group(1))

    # GAPS frecuentes
    if re.search(r'"texto_input"\s*:', src):
        info["gaps"].append('Contrato analizador debe ser {"texto": "..."}')
    if "tiktok_scarper.py" in str(p):
        info["gaps"].append("Renombrar a tiktok_scraper.py")
    if re.search(r"\bimport\s+request\b", src) or re.search(r"\bfrom\s+request\s+import\b", src):
        info["gaps"].append("Import sospechoso: usar 'requests'")

    return info

py_list = []
for p in ROOT.rglob("*.py"):
    if any(x in p.parts for x in EXCLUDE): continue
    py_list.append(p)

files = [extract(p) for p in py_list]

# edges (imports entre archivos del repo)
path_by_mod = {}
def mod_candidates(p: Path):
    rel = p.with_suffix("").relative_to(ROOT)
    parts = list(rel.parts)
    cands = set([".".join(parts), parts[-1]])
    if len(parts) > 1:
        cands.add(".".join(parts[-2:]))
    return cands

for p in py_list:
    for c in mod_candidates(p):
        path_by_mod.setdefault(c, set()).add(str(p))

edges = []
for it in files:
    src = it["file"]
    imods = set(it["imports"] + it["imports_from"])
    for m in imods:
        if m in path_by_mod:
            for dst in path_by_mod[m]:
                if dst != src:
                    edges.append((src, dst, "import"))

# Tabla por componente
tbl = []
tbl.append("| Componente | Tipo | Propósito | Imports | Env | IO | URL / BQ | Rutas Flask | GAPS |")
tbl.append("|---|---|---|---|---|---|---|---|---|")
for it in sorted(files, key=lambda x: x["file"]):
    imports = ", ".join(sorted(set(it["imports"]+it["imports_from"]))[:8]) or "—"
    env = ", ".join(it["env_vars"][:6]) or "—"
    io  = ", ".join(sorted(set(it["reads"]+it["writes"]))[:6]) or "—"
    url = ", ".join(it["urls"][:3]) or "—"
    bq  = ", ".join(it["bq_fqn"][:3]) or "—"
    routes = ", ".join(it["flask_routes"]) or "—"
    gaps = "; ".join(it["gaps"]) or "—"
    tbl.append(f"| `{it['file']}` | {it['group']} | {shorten(it['doc'] or '(sin doc)', 90)} | {imports} | {env} | {io} | {url} / {bq} | {routes} | {gaps} |")
    for f in it["functions"]:
        tbl.append(f"| ↳ **{f['name']}** | func | {shorten(f['doc'] or '(sin doc)', 90)} | — | args: {', '.join(f['args']) or '—'} | — | — | — | — |")
    for c in it["classes"]:
        tbl.append(f"| ↳ **{c['name']}** | class | {shorten(c['doc'] or '(sin doc)', 90)} | — | — | — | — | — | — |")

(Path(OUT/"components_table_deep.md")).write_text("\n".join(tbl), encoding="utf-8")

# Grafo Mermaid por tipo de conexión
merm = ["graph TD"]
nodes = sorted({f["file"] for f in files})
for n in nodes:
    merm.append(f'  "{n}"["{Path(n).name}"]')
# externals
urls = sorted({u for f in files for u in f["urls"]})
bqs  = sorted({b for f in files for b in f["bq_fqn"]})
for u in urls: merm.append(f'  "URL::{u}"["URL::{u}"]')
for b in bqs: merm.append(f'  "BQ::{b}"["BQ::{b}"]')
# edges imports
for s,d,k in sorted(edges):
    merm.append(f'  "{s}" -- import --> "{d}"')
# edges http/bq/io
for f in files:
    s = f["file"]
    for u in f["urls"]: merm.append(f'  "{s}" -- HTTP --> "URL::{u}"')
    for b in f["bq_fqn"]: merm.append(f'  "{s}" -- BQ --> "BQ::{b}"')
    for io in sorted(set(f["reads"]+f["writes"]))[:8]: merm.append(f'  "{s}" -- FILE --> "{io}"')
(Path(OUT/"graph_deep.mmd")).write_text("\n".join(merm), encoding="utf-8")

# JSON para IA
deep = {
  "timestamp": datetime.utcnow().isoformat(),
  "files": files,
  "edges": edges,
}
(Path(OUT/"inventory_deep.json")).write_text(json.dumps(deep, indent=2, ensure_ascii=False), encoding="utf-8")

# README maestros (relleno con datos reales del escaneo)
def w(name, lines): (OUT/name).write_text("\n".join(lines)+"\n", encoding="utf-8")

def section_list(title, items):
    out = [f"## {title}"] if title else []
    if not items: out.append("- —"); return out
    for x in items: out.append(f"- {x}")
    return out

# MASTER
groups = {}
for f in files:
    groups.setdefault(f["group"], []).append(f["file"])
w("README_MASTER.md", [
  "# Radiografía Quirúrgica — XRAY-DEEP",
  f"**Generado:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
  "",
  f"- Archivos Python: **{len(files)}**",
  "- Grupos: " + ", ".join(sorted(groups.keys())),
  "",
  "### Entidades globales detectadas",
  "- BigQuery: " + (", ".join(bqs) if bqs else "—"),
  "- URLs: " + (", ".join(urls[:10]) + (" …" if len(urls)>10 else "") if urls else "—"),
])

# BACKEND
bk = ["# BACKEND — Orquestador/Servicios", ""]
bk += section_list("Módulos backend", sorted(groups.get("backend-orquestador", [])))
bk += section_list("Entradas/Env", sorted({e for f in files if f["group"]=="backend-orquestador" for e in f["env_vars"]}))
bk += section_list("BigQuery usado", sorted({b for f in files if f["group"]=="backend-orquestador" for b in f["bq_fqn"]}))
bk += ["", "### Observaciones",
       "- Verificar contrato del analizador: usar `{\"texto\": ...}`.",
       "- Si hay columnas JSON en BQ, serializar dict/list con `json.dumps` antes de insertar."]
w("BACKEND.md", bk)

# FRONTEND
fr = ["# FRONTEND — UI Flask", ""]
fr += section_list("Rutas Flask detectadas", sorted({r for f in files for r in f["flask_routes"]}))
fr += section_list("Módulos frontend", sorted(groups.get("frontend", [])))
w("FRONTEND.md", fr)

# INGESTION
ing = ["# INGESTIÓN — Scrapers y Glue", ""]
ing += section_list("Módulos de ingestión", sorted(groups.get("ingestion", [])))
ing += section_list("IO típico (archivos)", sorted({io for f in files if f["group"]=="ingestion" for io in (f["reads"]+f["writes"])}))
ing += ["", "### Formatos estándar",
        '- `caption.json` → `{ "caption": "..." }`',
        '- `comments.json` → lista de strings o de objetos con campo `comment` (clave `comment`)']
w("INGESTION.md", ing)

# ORQUESTACIÓN/AUTOMATIZACIÓN
auto = ["# MAESTRO EJECUTOR — Automatización", ""]
auto += section_list("Entrypoints de Cloud Functions", sorted({e for f in files for e in f["cf_entrypoints"]}))
auto += section_list("URLs (servicios externos)", urls)
auto += section_list("Env vars globales", sorted({e for f in files for e in f["env_vars"]}))
w("ORQUESTADOR_AUTOMATIZACION.md", auto)

# CLOUD WIRING
cw = ["# CLOUD_WIRING — Conexión con GCP", ""]
cw += section_list("Tablas BQ (código)", bqs)
cw += section_list("Variables de entorno", sorted({e for f in files for e in f["env_vars"]}))
w("CLOUD_WIRING.md", cw)

# RUNBOOK & QA
w("RUNBOOK_E2E.md", [
  "# RUNBOOK E2E",
  "1) Scrapers → `caption.json` + `comments.json` → `prep_payload.py`.",
  "2) Llamar al orquestador (ID token) con `fuente_principal.texto`.",
  "3) Verificar escritura en BigQuery y lectura desde UI Flask.",
  "4) Automatizar con Jobs + Scheduler.",
])
w("CHECKLIST_QA.md", [
  "# CHECKLIST QA",
  "- [ ] Contrato analizador `{\"texto\": ...}` en todos los puntos.",
  "- [ ] Inserciones BQ serializan JSON cuando aplique.",
  "- [ ] UI Flask muestra por `/<id_conversacion>`.",
  "- [ ] Scrapers generan archivos estándar (caption/comments).",
  "- [ ] Jobs + Scheduler corriendo sin errores en logs.",
])

print("OK")
print("Salidas en:", OUT.as_posix())
for p in sorted(OUT.iterdir()): print(" -", p.name)
