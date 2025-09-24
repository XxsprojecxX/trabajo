# INGESTIÓN — Scrapers, Validación y Glue
**Fecha:** 2025-09-22

Este módulo prepara el contenido de un post (**caption + comentarios**) para que el orquestador lo analice y lo persista en BigQuery.

---

## 1) Ubicación y estructura (actualizadas)
ingestion/
└── ingestion_tools/
├── validate_ingestion.py      # Valida carpeta de post: caption.json + comments.json
├── prep_payload.py            # Construye payload para el orquestador (y opcionalmente métricas)
└── data/
├── instagram/
│   └── demo_post/
│       ├── caption.json
│       └── comments.json
└── tiktok/
└── demo_post/
├── caption.json
└── comments.json
**Scrapers (productores de datos crudos):**
backend/python_jobs/recolector/
├── instagram_scraper.py
├── tiktok_scraper.py
└── diagnostico_selector.py
> **Nota de migración**: todas las referencias antiguas a 
> `backend/python_jobs/ingestion_tools` fueron actualizadas a 
> `ingestion/ingestion_tools`.

---

## 2) Contratos de entrada (estándar)

### 2.1 `caption.json`
Campos:
- `caption` (string, **requerido**)
- `platform` (`"instagram"` | `"tiktok"`, **requerido**)
- `post_id` (string, **recomendado**; si falta, se infiere desde `url`)
- `url` **o** `link` (string, opcional pero útil)
- `creator_handle` (string, opcional)

Ejemplo:
```json
{
  "caption": "Texto del post…",
  "platform": "instagram",
  "post_id": "xyz123",
  "url": "[https://www.instagram.com/p/xyz123/](https://www.instagram.com/p/xyz123/)",
  "creator_handle": "demo_creator"
}