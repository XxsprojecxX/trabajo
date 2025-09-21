#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera una tabla maestra con el orden solicitado:
creadora_handle, plataforma, vistas_reproducciones, post_id, post_url,
comentarios_count, likes_count, saves_count, comment_text,
profile_meta, post_meta, comment_meta

Lee TODOS los JSON/CSV dentro de ./ig y ./tk (carpeta actual).
Salida:
  - master_table_20250918.csv
  - master_table_20250918.json  (mismas filas que el CSV, en JSON)
"""

import os, sys, json, csv, re
from datetime import datetime

BASE_DIR = "."
OUT_CSV  = "master_table_20250918.csv"
OUT_JSON = "master_table_20250918.json"

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

# --- Heurísticas y extracción ---
_re_handle_ig = re.compile(r"instagram\.com/([^/?#]+)/?")
_re_handle_tk = re.compile(r"tiktok\.com/@([^/?#]+)/?")
_re_postid_ig = re.compile(r"instagram\.com/p/([^/?#]+)/?")
_re_postid_tk = re.compile(r"tiktok\.com/@[^/]+/video/(\d+)")

def platform_from_path(path):
    bn = os.path.basename(path).lower()
    if "/ig/" in path or "\\ig\\" in path or bn.startswith("ig_"): return "Instagram"
    return "TikTok"

def pick(o, keys):
    for k in keys:
        if k in o and o[k] not in (None, ""):
            return o[k]
    return None

def as_text(x):
    if x is None: return ""
    if isinstance(x,(dict,list)): return json.dumps(x, ensure_ascii=False)
    return str(x)

def extract_handle(obj, platform, path):
    cand = pick(obj, ["username","user_name","owner_username","author_username","author","author_name","creator_username","uniqueId","nickname","screen_name"])
    if isinstance(cand, dict):
        cand = pick(cand, ["username","uniqueId","nickname","name"])
    if cand: return "@"+str(cand).lstrip("@").strip()
    url = pick(obj, ["url","post_url","share_url","href","permalink","link"])
    if url:
        m = (_re_handle_ig if platform=="Instagram" else _re_handle_tk).search(str(url))
        if m: return "@"+m.group(1)
    user = obj.get("author") if isinstance(obj.get("author"), dict) else obj.get("user")
    if isinstance(user, dict):
        cand = pick(user, ["uniqueId","username","nickname","name"])
        if cand: return "@"+str(cand).lstrip("@").strip()
    owner = obj.get("owner") if isinstance(obj.get("owner"), dict) else None
    if isinstance(owner, dict):
        cand = pick(owner, ["username","name"])
        if cand: return "@"+str(cand).lstrip("@").strip()
    return "@desconocido"

def extract_post_id_and_url(obj, platform):
    url = pick(obj, ["url","post_url","share_url","permalink","link","href"])
    post_id = None
    if platform=="Instagram":
        post_id = pick(obj, ["shortcode","post_shortcode","id","post_id"])
        if not post_id and url:
            m = _re_postid_ig.search(str(url))
            if m: post_id = m.group(1)
    else:
        post_id = pick(obj, ["video_id","aweme_id","id","post_id"])
        if not post_id and url:
            m = _re_postid_tk.search(str(url))
            if m: post_id = m.group(1)
    return (as_text(post_id or ""), as_text(url or ""))

def is_comment(o):
    ks = {k.lower() for k in o.keys()}
    if any(k in ks for k in ["comment","comment_text","text","comment_id","cid","reply_to","commenter","comment_timestamp","comment_created_at","comment_time"]):
        return True
    if o.get("type") in ("comment","comments"): return True
    return False

def is_post(o):
    ks = {k.lower() for k in o.keys()}
    if any(k in ks for k in ["like_count","likes","play_count","view_count","caption","description","shortcode","video_id","aweme_id","comment_count","save_count","collects"]):
        return True
    s = as_text(o)
    return ("instagram.com/p/" in s) or ("/video/" in s)

def is_profile(o):
    ks = {k.lower() for k in o.keys()}
    return any(k in ks for k in [
        "followers","follower_count","followers_count","following","biography","bio","is_verified",
        "sec_uid","uniqueId","username","full_name","external_url","website","profile_pic_url"
    ])

def metric_views(o):
    return pick(o, ["view_count","views","play_count","video_play_count","plays"]) or ""

def metric_likes(o):
    return pick(o, ["like_count","likes","digg_count","favorite_count","heart_count"]) or ""

def metric_comments(o):
    return pick(o, ["comment_count","comments","comments_count"]) or ""

def metric_saves(o):
    # Instagram a veces: saved_count, save_count, collections; TikTok: collects
    return pick(o, ["save_count","saved_count","collections","collects"]) or ""

def to_json_str(d):
    return json.dumps(d, ensure_ascii=False)

# --- Ingesta y armado de filas ---
files = list_files()
if not files:
    print("No se encontraron archivos en ./ig y ./tk")
    sys.exit(0)

# Estructuras temporales por post para tener métricas agregadas + comentarios
# clave: (plataforma, handle, post_id or url)
POSTS = {}  # -> {"profile_meta":{}, "post_meta":{}, "stats":{views,likes,comments,saves}, "comments":[{...}]}

def ensure_post(platform, handle, post_id, post_url):
    key = (platform, handle, post_id or post_url)
    if key not in POSTS:
        POSTS[key] = {
            "platform": platform,
            "handle": handle,
            "post_id": post_id,
            "post_url": post_url,
            "profile_meta": {},   # última vista de perfil (se mergea)
            "post_meta": {},      # se mergea todo
            "stats": {"views":"", "likes":"", "comments":"", "saves":""},
            "comments": []        # lista de objetos comentario completos
        }
    return key

def deep_merge(dst, src):
    for k, v in src.items():
        if k not in dst:
            dst[k] = v
        else:
            if isinstance(dst[k], dict) and isinstance(v, dict):
                deep_merge(dst[k], v)
            else:
                # conserva la versión existente; si difiere, crea variante
                alt = f"{k}__alt"
                if alt not in dst:
                    dst[alt] = v

for path in files:
    rows = load_any(path)
    platform = platform_from_path(path)
    for obj in rows:
        handle = extract_handle(obj, platform, path)

        if is_profile(obj):
            # guardamos la última metadata de perfil encontrada por handle a nivel plataforma
            # luego al crear filas la inyectamos en cada post de ese handle
            # Para simplicidad, la ponemos en un diccionario temporal aparte por handle:
            # (usaremos merge al tocar posts)
            pass  # lo manejamos al ver posts/comentarios mediante deep_merge hacia POSTS[key]["profile_meta"]

        if is_post(obj):
            post_id, post_url = extract_post_id_and_url(obj, platform)
            key = ensure_post(platform, handle, post_id, post_url)
            # merge post_meta
            deep_merge(POSTS[key]["post_meta"], obj)
            # calzar métricas
            POSTS[key]["stats"]["views"]    = POSTS[key]["stats"]["views"]    or metric_views(obj)
            POSTS[key]["stats"]["likes"]    = POSTS[key]["stats"]["likes"]    or metric_likes(obj)
            POSTS[key]["stats"]["comments"] = POSTS[key]["stats"]["comments"] or metric_comments(obj)
            POSTS[key]["stats"]["saves"]    = POSTS[key]["stats"]["saves"]    or metric_saves(obj)
            # intenta extraer perfil embebido
            prof = obj.get("owner") or obj.get("author") or obj.get("user")
            if isinstance(prof, dict):
                deep_merge(POSTS[key]["profile_meta"], prof)
            continue

        if is_comment(obj):
            post_id, post_url = extract_post_id_and_url(obj, platform)
            key = ensure_post(platform, handle, post_id, post_url)
            POSTS[key]["comments"].append(obj)
            # algunas respuestas incluyen contadores a nivel comentario, igual los preservamos en comment_meta
            # si el comentario incluye author/user, también lo guardamos en profile_meta como referencia mínima
            prof = obj.get("author") or obj.get("user") or obj.get("commenter")
            if isinstance(prof, dict):
                deep_merge(POSTS[key]["profile_meta"], prof)
            continue

        # si no cae en profile/post/comment, lo anexamos a profile_meta.misc
        key = ensure_post(platform, handle, "", "")
        if "misc" not in POSTS[key]["profile_meta"]:
            POSTS[key]["profile_meta"]["misc"] = []
        POSTS[key]["profile_meta"]["misc"].append(obj)

# Construir filas requeridas (una por comentario; si no hay comentarios, una fila “vacía”)
rows_out = []
for key, p in POSTS.items():
    platform = p["platform"]
    handle   = p["handle"]
    post_id  = p["post_id"]
    post_url = p["post_url"]

    views    = p["stats"]["views"]
    likes    = p["stats"]["likes"]
    comm_cnt = p["stats"]["comments"]
    saves    = p["stats"]["saves"]

    profile_meta_str = to_json_str(p["profile_meta"])
    post_meta_str    = to_json_str(p["post_meta"])

    if p["comments"]:
        for cm in p["comments"]:
            row = {
                "creadora_handle": handle,
                "plataforma": platform,
                "vistas_reproducciones": views,
                "post_id": post_id,
                "post_url": post_url,
                "comentarios_count": comm_cnt,
                "likes_count": likes,
                "saves_count": saves,
                "comment_text": as_text(pick(cm, ["comment","comment_text","text"]) or ""),
                "profile_meta": profile_meta_str,
                "post_meta": post_meta_str,
                "comment_meta": to_json_str(cm)
            }
            rows_out.append(row)
    else:
        # sin comentarios: una sola fila del post
        row = {
            "creadora_handle": handle,
            "plataforma": platform,
            "vistas_reproducciones": views,
            "post_id": post_id,
            "post_url": post_url,
            "comentarios_count": comm_cnt,
            "likes_count": likes,
            "saves_count": saves,
            "comment_text": "",
            "profile_meta": profile_meta_str,
            "post_meta": post_meta_str,
            "comment_meta": "{}"
        }
        rows_out.append(row)

# Ordenar por creadora, plataforma y luego post_id
rows_out.sort(key=lambda r: (r["creadora_handle"], r["plataforma"], r["post_id"], r["post_url"]))

# Guardar CSV y JSON (UTF-8, preserva emojis)
field_order = [
    "creadora_handle","plataforma","vistas_reproducciones",
    "post_id","post_url","comentarios_count","likes_count","saves_count",
    "comment_text","profile_meta","post_meta","comment_meta"
]

with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=field_order, extrasaction="ignore")
    w.writeheader()
    for r in rows_out:
        w.writerow(r)

with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False, indent=2)

print(f"✅ CSV:  {OUT_CSV}  (filas={len(rows_out)})")
print(f"✅ JSON: {OUT_JSON}")
