 # recolector_definitivo.py (Versión 7.3 - Sintaxis Corregida)

import requests
import json
import os
import time
from dotenv import load_dotenv

def recolectar_con_brightdata(target_url):
    print(f"--- Iniciando recolección para: {target_url} ---")
    
    load_dotenv()
    API_TOKEN = os.getenv("BRIGHTDATA_API_TOKEN")
    ZONE_NAME = os.getenv("BRIGHTDATA_ZONE_NAME")

    if not all([API_TOKEN, ZONE_NAME]):
        print("❌ ERROR: Faltan BRIGHTDATA_API_TOKEN o BRIGHTDATA_ZONE_NAME en .env.")
        return None, "Error de credenciales"

    api_endpoint = "https://api.brightdata.com/request"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "zone": ZONE_NAME,
        "url": target_url,
        "format": "raw"
    }

    print(f"Enviando solicitud a {api_endpoint} usando la zona '{ZONE_NAME}'...")
    
    try:
        response = requests.post(api_endpoint, headers=headers, json=payload, timeout=180)
        response.raise_for_status()
        
        try:
            datos_recibidos = json.loads(response.text)
        except json.JSONDecodeError:
            datos_recibidos = {"contenido_raw": response.text}

        print("✅ Datos recibidos exitosamente.")
        return datos_recibidos, "Éxito"
    except requests.exceptions.HTTPError as e:
        print(f"❌ FALLO: Error HTTP {e.response.status_code}")
        print(f"   Respuesta del servidor: {e.response.text}")
        return None, f"Error HTTP {e.response.status_code}"
    except requests.exceptions.RequestException as e:
        print(f"❌ FALLO: Ocurrió un error de conexión.")
        print(f"   Detalle: {e}")
        return None, str(e)

def guardar_manifiesto(manifiesto, ruta):
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    print("--- Iniciando Recolector v7.3 (Sintaxis Corregida) ---")
    ruta_manifiesto = 'manifiesto.json'
    
    try:
        with open(ruta_manifiesto, 'r', encoding='utf-8') as f:
            manifiesto = json.load(f)
        
        tareas_a_procesar = list(manifiesto.get("tareas_pendientes", []))
        
        if not tareas_a_procesar:
            print("No hay tareas pendientes en el manifiesto. Finalizando.")
        else:
            for i, tarea in enumerate(tareas_a_procesar):
                print(f"\n--- Procesando Tarea ({i+1}/{len(tareas_a_procesar)}): {tarea.get('id_tarea')} ---")
                resultado, status = recolectar_con_brightdata(tarea["url"])
                
                if resultado:
                    shortcode = tarea["url"].split("/")[-1] if tarea.get("plataforma") == 'tiktok' else tarea["url"].split("/")[-2]
                    nombre_archivo = f"resultado_{tarea.get('creadora', 'desconocida').replace(' ', '_')}_{tarea.get('plataforma', 'web')}_{shortcode}.json"
                    
                    with open(nombre_archivo, 'w', encoding='utf-8') as f:
                        json.dump(resultado, f, ensure_ascii=False, indent=4)
                    print(f"✅ Tarea Exitosa. Resultado guardado en: '{nombre_archivo}'.")

                    manifiesto["tareas_pendientes"].remove(tarea)
                    tarea['fecha_completado'] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                    if "tareas_completadas" not in manifiesto:
                        manifiesto["tareas_completadas"] = []
                    manifiesto["tareas_completadas"].append(tarea)
                    guardar_manifiesto(manifiesto, ruta_manifiesto)
                    print("Manifiesto actualizado.")
                else:
                    print(f"❌ Tarea Fallida: {tarea.get('id_tarea')}. Razón: {status}")

                if i < len(tareas_a_procesar) - 1:
                    print("Pausa de 5 segundos...")
                    time.sleep(5)
            
            print("\n--- Procesamiento del manifiesto completado. ---")
    except Exception as e:
        print(f"❌ ERROR INESPERADO: {e}")