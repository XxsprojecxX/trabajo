# orquestador/main.py — versión estable
import functions_framework, requests, os, json
import google.auth.transport.requests
import google.oauth2.id_token

URL_ANALIZADOR = "https://us-central1-galletas-piloto-ju-250726.cloudfunctions.net/analizar_texto_individual"
PROJECT_ID = "galletas-piloto-ju-250726"
BIGQUERY_DATASET = "analisis_galletas"
BIGQUERY_TABLE = "resultados_analizados"

client = None

def llamar_analizador(texto):
    try:
        auth_req = google.auth.transport.requests.Request()
        id_token = google.oauth2.id_token.fetch_id_token(auth_req, URL_ANALIZADOR)
        headers = {"Authorization": f"Bearer {id_token}"}
        resp = requests.post(URL_ANALIZADOR, headers=headers, json={"texto": texto})
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": f"Fallo en la comunicación con el analizador: {e}"}

def guardar_en_bigquery(datos):
    global client
    if client is None:
        from google.cloud import bigquery
        client = bigquery.Client(project=PROJECT_ID)
    try:
        import json as _json
        row = dict(datos)
        from datetime import datetime, timezone
        row["aggregated_at"] = datetime.now(timezone.utc).isoformat()
        # Serializar campos JSON a STRING (requerido cuando las columnas en BQ son tipo JSON)
        for k in ("analisis_fuente_principal", "analisis_respuestas_comunidad", "metadata_procesamiento"):
            if k in row:
                row[k] = _json.dumps(row[k], ensure_ascii=False)
        table_ref = client.dataset(BIGQUERY_DATASET).table(BIGQUERY_TABLE)
        errors = client.insert_rows_json(table_ref, [row])
        if not errors:
            print(f"Datos para '{row.get('id_conversacion')}' guardados en BigQuery.")
        else:
            print(f"Errores al guardar en BigQuery: {errors}")
    except Exception as e:
        print(f"Error fatal al intentar guardar en BigQuery: {e}")

@functions_framework.http
def orquestar_analisis_conversacion(request):
    request_json = request.get_json(silent=True)
    if not request_json or "fuente_principal" not in request_json:
        return {"error": "Petición JSON inválida."}, 400

    fp = request_json.get("fuente_principal", {})
    texto_a_analizar = fp.get("texto") or fp.get("texto_input")
    if not isinstance(texto_a_analizar, str) or not texto_a_analizar.strip():
        return {"error": 'Petición JSON inválida: falta "texto".'}, 400

    resultado_analisis = llamar_analizador(texto_a_analizar)

    resultado_final = {
        "id_conversacion": request_json.get("id_conversacion"),
        "url_post": fp.get("metadatos", {}).get("url"),
        "analisis_fuente_principal": resultado_analisis,
        "analisis_respuestas_comunidad": [],
        "metadata_procesamiento": {"version_analizador": "1.0", "comentarios_analizados": 0},
    }

    guardar_en_bigquery(resultado_final)
    return resultado_final, 200
