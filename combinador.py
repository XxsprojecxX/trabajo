# combinador.py — prefere .ndjson sobre .json, ignora vacíos/rotos, escribe en DATA/
import json, sys, os
from pathlib import Path

DATA_DIR = Path("DATA")
OUT_PATH  = DATA_DIR / "insumos_combinados.jsonl"

STEMS = {
    "ig_profiles_results":    ("profile","ig"),
    "ig_posts_results":       ("post","ig"),
    "ig_comments_results":    ("comment","ig"),
    "tiktok_profiles_results":("profile","tt"),
    "tiktok_posts_results":   ("post","tt"),
    "tiktok_comments_results":("comment","tt"),
}

def size_ok(p: Path) -> bool:
    try: return p.exists() and p.stat().st_size > 0
    except: return False

def pick_file(stem: str) -> Path|None:
    nd = DATA_DIR / f"{stem}.ndjson"
    js = DATA_DIR / f"{stem}.json"
    if size_ok(nd): return nd
    if size_ok(js): return js
    return None

def load_any(path: Path):
    items = []
    try:
        if path.suffix.lower()==".ndjson":
            with path.open("r",encoding="utf-8") as f:
                for line in f:
                    line=line.strip()
                    if not line: continue
                    items.append(json.loads(line))
        else:
            with path.open("r",encoding="utf-8") as f:
                data=json.load(f)
            if isinstance(data,list): items=data
            elif isinstance(data,dict): items=[data]
            else: print(f"[WARN] {path.name}: JSON no es list/dict, omitido.")
    except Exception as e:
        print(f"[ERROR] {path.name}: {e}")
    return items

def normalize(row: dict, rtype: str, plat: str):
    return {"record_type": rtype, "source_platform": plat, "raw": row}

def main():
    if not DATA_DIR.exists():
        print(f"[ERROR] Falta {DATA_DIR}/"); sys.exit(1)
    if OUT_PATH.exists(): OUT_PATH.unlink()
    total=0
    with OUT_PATH.open("w",encoding="utf-8") as out:
        for stem,(rtype,plat) in STEMS.items():
            path=pick_file(stem)
            if not path:
                print(f"[WARN] {stem}: no hay archivo válido (.ndjson/.json), se omite.")
                continue
            rows=load_any(path)
            print(f"[INFO] {path.name}: {len(rows)} registros ({rtype}/{plat}) [seleccionado]")
            for r in rows:
                out.write(json.dumps(normalize(r,rtype,plat),ensure_ascii=False)+"\n")
            total+=len(rows)
    print(f"[OK] Generado {OUT_PATH} con {total} registros.")
if __name__=="__main__": main()
