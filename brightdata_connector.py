import os, requests
from dotenv import load_dotenv

# Carga .env si existe
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

def get_bd_api_key() -> str:
    # Usa BD_API_KEY; si no, intenta BRIGHTDATA_API_KEY
    key = (os.getenv("BD_API_KEY") or os.getenv("BRIGHTDATA_API_KEY") or "").strip()
    if not key or len(key) < 20:
        raise RuntimeError("BD_API_KEY vacío o inválido. Revisa tu .env o variables de entorno.")
    return key

def bd_headers(use_x_api_key: bool = True) -> dict:
    key = get_bd_api_key()
    # Por defecto: x-api-key (lo más común en Bright Data)
    return {"x-api-key": key} if use_x_api_key else {"Authorization": f"Bearer {key}"}

def bd_get(url: str, *, headers: dict | None = None, timeout: int = 30, **kwargs) -> requests.Response:
    hdr = bd_headers() if headers is None else headers
    return requests.get(url, headers=hdr, timeout=timeout, **kwargs)

def bd_post(url: str, json_body: dict, *, headers: dict | None = None, timeout: int = 60, **kwargs) -> requests.Response:
    hdr = bd_headers() if headers is None else headers
    return requests.post(url, headers=hdr, json=json_body, timeout=timeout, **kwargs)

def safe_json(resp: requests.Response):
    try:
        return resp.json()
    except Exception:
        return {"status_code": resp.status_code, "text": resp.text[:500]}
