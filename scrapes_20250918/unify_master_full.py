#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Crea un MASTER con TODO (sin perder campos):
  - Jerárquico: profile -> posts -> comments, conservando *toda* la metadata original.
  - CSV plano: una fila por comentario (o 1 por post sin comentarios), con TODA la metadata aplanada con prefijos:
      profile.*, post.*, comment.*
Lee TODOS los .json y .csv dentro de ./ig y ./tk (carpeta actual).
Salidas:
  - master_full_20250918.json
  - master_full_20250918.csv
"""

import os, sys, json, csv, re
from datetime import datetime
from hashlib import md5

BASE_DIR = "."
OUT_JSON = "master_full_20250918.json"
OUT_CSV  = "master_full_20250918.csv"

# -------- utilidades de E/S --------
def list_files(subdirs=("ig","tk")):
    files = []
    for sd in subdirs:
        p = os.path.join(BASE_DIR, sd)
        if not os.path.isdir(p): 
            continue
        for root, _, names in os.walk(p):
            for n in names:
                if n.lower().endswith((".json", ".csv")):
                    files.append(os.path.join(root, n))
    return sorted(files)

def load_any(path):
    try:
        if path.lower().endswith(".json"):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "data" in data and isinstance(data["data"], list):
                    return data["data"]
                return [data]
        else:
            out = []
            with open(path, newline="", encoding="utf-8") as f:
                rd = csv.DictReader(f)
                for row in rd:
                    out.append(dict(row))
            return out
    except Exception as e:
        print(f"[WARN] No pude cargar {path}: {e}")
        return []

# -------- heurísticas y extracción --------
_re_handle_ig = re.compile(r"instagram\.com/([^/?#]+)/?")
_re_handle_tk = re.compile(r"tiktok\.com/@([^/?#]+)/?")
_re_postid_ig = re.compile(r"instagram\.com/p/([^/?#]+)/?")
_re_postid_tk = re.compile(r"tiktok\.com/@[^/]+/video/(\d+)")

def pick(o, keys):
    for k in keys:
        if k in o and o[k] not in (None, ""):
            return o[k]
    return None

def as_text(x):
    if x is None: return ""
    if isinstance(x, (dict, list)): return json.dumps(x, ensure_ascii=False)
    return str(x)

def platform_from_path(path):
    bn = os.path.basename(path).lower()
    if "/ig/" in path or "\\ig\\" in path or bn.startswith("ig_"):
        return "instagram"
    return "tiktok"

def extract_handle(obj, platform, path):
    cand = pick(obj, ["username","user_name","owner_username","author_username",
                      "author","author_name","creator_username","uniqueId","nickname","screen_name"])
    if isinstance(cand, dict):
        cand = pick(cand, ["username","uniqueId","nickname","name"])
    if cand: return str(cand).lstrip("@").strip()

    url = pick(obj, ["url","post_url","share_url","href","permalink","link"])
    if url:
        m = (_re_handle_ig if platform=="instagram" else _re_handle_tk).search(str(url))
        if m: return m.group(1)

    user = obj.get("author") if isinstance(obj.get("author"), dict) else obj.get("user")
    if isinstance(user, dict):
        cand = pick(user, ["uniqueId","username","nickname","name"])
        if cand: return str(cand).lstrip("@").strip()

    owner = obj.get("owner") if isinstance(obj.get("owner"), dict) else None
    if isinstance(owner, dict):
        cand = pick(owner, ["username","name"])
        if cand: return str(cand).lstrip("@").strip()

    return "desconocido"

def extract_post_id(obj, platform):
    if platform=="instagram":
        cid = pick(obj, ["shortcode","post_shortcode","id","post_id"])
        if isinstance(cid,str) and cid: return cid
        url = pick(obj, ["url","post_url","permalink","link"])
        if url:
            m = _re_postid_ig.search(str(url))
            if m: return m.group(1)
    else:
        vid = pick(obj, ["video_id","aweme_id","id","post_id"])
        if vid: return str(vid)
        url = pick(obj, ["url","post_url","share_url","link","href"])
        if url:
            m = _re_postid_tk.search(str(url))
            if m: return m.group(1)
    return as_text(pick(obj, ["id","post_id","shortcode"]) or "desconocido")

def is_comment(o):
    ks = {k.lower() for k in o.keys()}
    if any(k in ks for k in ["comment","comment_text","text","comment_id","cid","reply_to","commenter","comment_timestamp","comment_created_at","comment_time"]):
        return True
    # algunos datasets guardan comments como items con type
    if o.get("type") in ("comment","comments"): return True
    return False

def is_post(o):
    ks = {k.lower() for k in o.keys()}
    if any(k in ks for k in ["like_count","likes","play_count","view_count","caption","description","shortcode","video_id","aweme_id","comment_count"]):
        return True
    s = as_text(o)
    return ("instagram.com/p/" in s) or ("/video/" in s)

def is_profile(o):
    # Heurística simple: muchos campos de bio/seguidores, etc.
    ks = {k.lower() for k in o.keys()}
    return any(k in ks for k in [
        "followers","follower_count","followers_count","following","biography","bio","is_verified",
        "sec_uid","uniqueId","username","full_name","external_url","website","profile_pic_url"
    ])

# -------- estructuras maestros --------
# Clave: (platform, handle)
MASTER = {}

def ensure_creator(platform, handle):
    key = (platform, handle)
    if key not in MASTER:
        MASTER[key] = {
            "platform": platform,
            "handle": handle,
            "profile": {"_merged_from": []},  # aquí metemos TODO lo que venga de perfiles
            "posts": {}                       # post_id -> { meta: {...}, _merged_from: [...], comments: [ {...} ] }
        }
    return MASTER[key]

def deep_merge(dst, src):
    # mezcla dicts sin perder claves (si hay colisión y tipos distintos, prioriza conservar ambos con sufijos)
    for k, v in src.items():
        if k not in dst:
            dst[k] = v
        else:
            if isinstance(dst[k], dict) and isinstance(v, dict):
                deep_merge(dst[k], v)
            elif dst[k] == v:
                continue
            else:
                # colisión → guardamos variante
                alt_key = f"{k}__alt"
                if alt_key not in dst:
                    dst[alt_key] = v
                else:
                    # apila como lista de alternativas
                    if not isinstance(dst[alt_key], list):
                        dst[alt_key] = [dst[alt_key]]
                    dst[alt_key].append(v)

def flatten(d, prefix="", out=None):
    # aplana dicts arbitrarios (para CSV)
    if out is None: out = {}
    if isinstance(d, dict):
        for k, v in d.items():
            k2 = f"{prefix}{k}" if not prefix else f"{prefix}.{k}"
            flatten(v, k2, out)
    elif isinstance(d, list):
        out[prefix] = json.dumps(d, ensure_ascii=False)
    else:
        out[prefix] = d
    return out

# -------- ingestión --------
files = list_files()
if not files:
    print("No se encontraron archivos en ./ig y ./tk")
    sys.exit(0)

for path in files:
    items = load_any(path)
    if not items: 
        continue
    platform = platform_from_path(path)
    for obj in items:
        handle = extract_handle(obj, platform, path)
        creator = ensure_creator(platform, handle)

        if is_profile(obj):
            deep_merge(creator["profile"], obj)
            creator["profile"]["_merged_from"].append(os.path.basename(path))
            continue

        if is_post(obj):
            post_id = extract_post_id(obj, platform)
            if post_id not in creator["posts"]:
                creator["posts"][post_id] = {"meta": {}, "_merged_from": [], "comments": []}
            deep_merge(creator["posts"][post_id]["meta"], obj)
            creator["posts"][post_id]["_merged_from"].append(os.path.basename(path))
            continue

        if is_comment(obj):
            post_id = extract_post_id(obj, platform)
            if post_id not in creator["posts"]:
                creator["posts"][post_id] = {"meta": {}, "_merged_from": [], "comments": []}
            # guardamos TODO el comentario tal cual
            creator["posts"][post_id]["comments"].append(obj)
            continue

        # Si no encaja claro: lo ponemos como “profile.misc”
        if "misc" not in creator["profile"]:
            creator["profile"]["misc"] = []
        creator["profile"]["misc"].append(obj)

# -------- salida JSON jerárquico --------
# Convertimos posts dict a lista ordenada por una heurística de tiempo si existe
def get_post_ts(meta):
    for k in ["taken_at_timestamp","create_time","created_at","timestamp","published_at","date","post_timestamp","upload_date","time","ctime"]:
        if k in meta and meta[k]: 
            return str(meta[k])
    return ""
final_list = []
for (platform, handle), C in MASTER.items():
    posts_list = []
    for pid, pdata in C["posts"].items():
        posts_list.append({"post_id": pid, "meta": pdata["meta"], "_merged_from": pdata["_merged_from"], "comments": pdata["comments"]})
    posts_list.sort(key=lambda p: (get_post_ts(p["meta"]), p["post_id"]))
    final_list.append({
        "platform": platform,
        "handle": handle,
        "profile": C["profile"],
        "posts": posts_list
    })
final_list.sort(key=lambda c: (c["platform"], c["handle"]))

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

# -------- salida CSV plano (toda la metadata aplanada) --------
rows = []
for C in final_list:
    prof_flat = flatten(C["profile"], "profile")
    if not C["posts"]:
        # fila sin post (raro, pero conservamos)
        base = {"platform": C["platform"], "creator_handle": C["handle"]}
        base.update(prof_flat)
        rows.append(base)
        continue

    for P in C["posts"]:
        post_flat = flatten(P["meta"], "post")
        if not P["comments"]:
            base = {"platform": C["platform"], "creator_handle": C["handle"], "post_id": P["post_id"]}
            row = {}
            row.update(base)
            row.update(prof_flat)
            row.update(post_flat)
            rows.append(row)
            continue

        for cm in P["comments"]:
            cmt_flat = flatten(cm, "comment")
            base = {"platform": C["platform"], "creator_handle": C["handle"], "post_id": P["post_id"]}
            row = {}
            row.update(base)
            row.update(prof_flat)
            row.update(post_flat)
            row.update(cmt_flat)
            rows.append(row)

# unimos todas las columnas posibles
all_keys = set()
for r in rows:
    all_keys.update(r.keys())
fieldnames = ["platform","creator_handle","post_id"] + sorted(k for k in all_keys if k not in ("platform","creator_handle","post_id"))

with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)

print(f"✅ JSON maestro: {OUT_JSON}  (creadoras={len(final_list)})")
print(f"✅ CSV maestro : {OUT_CSV}   (filas={len(rows)}, columnas={len(fieldnames)})")
