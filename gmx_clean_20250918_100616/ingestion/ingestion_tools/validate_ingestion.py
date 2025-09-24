from __future__ import annotations
import json, sys, re
from pathlib import Path

def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise SystemExit(f"[ERROR] No pude leer {path}: {e}")

def guess_id_from_url(url: str, platform: str) -> str | None:
    if platform == "instagram":
        m = re.search(r"/p/([A-Za-z0-9_\-]+)/?", url)
        if m: return m.group(1)
    if platform == "tiktok":
        m = re.search(r"/video/(\d+)", url)
        if m: return m.group(1)
    return None

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

def main(folder: str):
    base = Path(folder)
    cap_f = base / "caption.json"
    com_f = base / "comments.json"
    assert cap_f.exists(), f"FALTA: {cap_f}"
    assert com_f.exists(), f"FALTA: {com_f}"

    cap = load_json(cap_f)
    com_raw = load_json(com_f)
    errors = []

    # caption.json
    caption = cap.get("caption")
    platform = (cap.get("platform") or "").lower()
    post_id = cap.get("post_id")
    url = cap.get("url") or cap.get("link") or ""

    if not isinstance(caption, str) or not caption.strip():
        errors.append("caption.json: 'caption' vacío o ausente.")
    if platform not in ("instagram","tiktok"):
        errors.append("caption.json: 'platform' debe ser 'instagram' o 'tiktok'.")

    if not post_id:
        post_id = guess_id_from_url(url, platform) if url else None
    if not post_id:
        errors.append("caption.json: 'post_id' ausente y no pude inferirlo de la URL.")

    # comments.json
    comments = normalize_comments(com_raw)
    if not isinstance(com_raw, list):
        errors.append("comments.json debe ser una LISTA.")
    if not comments:
        errors.append("comments.json no contiene comentarios válidos (strings o dicts con {comment_text|comment|text}).")

    if errors:
        print("\n".join(f"[FAIL] {e}" for e in errors))
        sys.exit(2)

    # OK → resumen
    id_conversacion = f"{platform}_{post_id}"
    print("[OK] caption.json y comments.json válidos.")
    print(f"     platform={platform}  post_id={post_id}  id_conversacion={id_conversacion}")
    print(f"     caption_len={len(caption or '')}  comments_count={len(comments)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Uso: python3 validate_ingestion.py <carpeta_del_post>")
    main(sys.argv[1])
