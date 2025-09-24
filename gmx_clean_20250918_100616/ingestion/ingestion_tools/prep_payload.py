from __future__ import annotations
import json, os, re, sys
from pathlib import Path

def import_comment_analizer():
    try:
        from comment_analizer import analyze_comment_list
        return analyze_comment_list
    except Exception:
        pass
    try:
        from backend.python_jobs.comment_analizer import analyze_comment_list
        return analyze_comment_list
    except Exception:
        pass
    try:
        from backend.python_jobs.proyecto_galletas_maria.comment_analizer import analyze_comment_list
        return analyze_comment_list
    except Exception:
        return None

ANALYZE = import_comment_analizer()

def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def normalize_comments(raw) -> list[str]:
    out = []
    if isinstance(raw, list):
        for c in raw:
            if isinstance(c, str) and c.strip():
                out.append(c.strip())
            elif isinstance(c, dict):
                for k in ("comment_text","comment","text"):
                    v = c.get(k)
                    if isinstance(v, str) and v.strip():
                        out.append(v.strip()); break
    return out

def guess_id_from_url(url: str, platform: str) -> str | None:
    if platform == "instagram":
        m = re.search(r"/p/([A-Za-z0-9_\-]+)/?", url)
        if m: return m.group(1)
    if platform == "tiktok":
        m = re.search(r"/video/(\d+)", url)
        if m: return m.group(1)
    return None

def main(in_folder: str, out_file: str):
    base = Path(in_folder)
    cap = load_json(base/"caption.json")
    com_raw = load_json(base/"comments.json")

    caption = cap.get("caption") or ""
    platform = (cap.get("platform") or "").lower()
    post_id = cap.get("post_id") or guess_id_from_url(cap.get("url") or "", platform) or "unknown"
    url = cap.get("url") or cap.get("link") or ""
    creator = cap.get("creator_handle") or cap.get("author") or ""

    comments = normalize_comments(com_raw)
    id_conversacion = f"{platform}_{post_id}"

    payload = {
        "id_conversacion": id_conversacion,
        "fuente_principal": {
            "texto": caption,   # <- contrato correcto
            "metadatos": {
                "url": url,
                "platform": platform,
                "post_id": post_id,
                "creator_handle": creator
            }
        },
        "respuestas_comunidad": comments,
    }

    metrics = None
    if ANALYZE and comments:
        try:
            metrics_obj = ANALYZE(comments, top_n=15)
            metrics = metrics_obj.asdict()
        except Exception as e:
            metrics = {"error": f"comment_analizer_failed: {e}"}

    out = {
        "payload_orquestador": payload,
        "comments_metrics": metrics
    }

    Path(out_file).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] payload listo → {out_file}")
    print(f"     id_conversacion={id_conversacion}  comentarios={len(comments)}  metrics={'yes' if metrics else 'no'}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("Uso: python3 prep_payload.py <carpeta_post> <salida.json>")
    main(sys.argv[1], sys.argv[2])
