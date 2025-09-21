# configurar_proyecto.py

import os

# --- Contenido de los Archivos ---

# Contenido para .env en la raíz del proyecto
contenido_env = """
BRIGHTDATA_API_TOKEN="83fee9375c31f2ea844489a3ea3d49cd3f69657b313d6d1d07c7f9dcaa477f0a"
"""

# Contenido para manifiesto.json en la raíz del proyecto
contenido_manifiesto = """
{
  "tareas_pendientes": [
    {
      "id_tarea": "piloto_001_MAMI_A_BORDO_ig",
      "creadora": "MAMI A BORDO",
      "plataforma": "instagram",
      "url": "https://www.instagram.com/p/DKDCQWCS883/"
    },
    {
      "id_tarea": "piloto_002_MAMI_A_BORDO_tk",
      "creadora": "MAMI A BORDO",
      "plataforma": "tiktok",
      "url": "https://www.tiktok.com/@mamiabordo/video/7504007535339244846"
    },
    {
      "id_tarea": "piloto_003_PAPÁS_DE_4_ig",
      "creadora": "PAPÁS DE 4",
      "plataforma": "instagram",
      "url": "https://www.instagram.com/p/DMYrYfuB6AJ/"
    },
    {
      "id_tarea": "piloto_004_PAPÁS_DE_4_tk",
      "creadora": "PAPÁS DE 4",
      "plataforma": "tiktok",
      "url": "https://www.tiktok.com/@papas.de.cuatro/video/7530390174774136082"
    },
    {
      "id_tarea": "piloto_005_GIANNA_CRISTANTE_ig",
      "creadora": "GIANNA CRISTANTE",
      "plataforma": "instagram",
      "url": "https://www.instagram.com/p/DKYSBWIM6fu/"
    },
    {
      "id_tarea": "piloto_006_GIANNA_CRISTANTE_tk",
      "creadora": "GIANNA CRISTANTE",
      "plataforma": "tiktok",
      "url": "https://www.tiktok.com/@giannacristante/video/7498383730898193672"
    }
  ],
  "tareas_completadas": []
}
"""

# Contenido para recolector/recolector_definitivo.py
contenido_recolector = """
# recolector_definitivo.py (Versión 7.0 - Arquitectura Final)

import requests
import json
import os
import time
from dotenv import load_dotenv

def recolectar_con_brightdata(target_url):
    print(f"--- Iniciando recolección para: {target_url} ---")
    
    load_dotenv()
    API_TOKEN = os.getenv("BRIGHTDATA_API_TOKEN")

    if not API_TOKEN:
        print("❌ ERROR: No se encontró BRIGHTDATA_API_TOKEN en el archivo .env.")
        return None, "Error de credenciales"

    api_endpoint = "https://api.brightdata.com/request"
    
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "zone": "web_unlocker1",
        "url": target_url
    }

    print(f"Enviando solicitud a {api_endpoint}...")
    
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
    print("--- Iniciando Recolector v7.0 (Arquitectura Final) ---")
    ruta_manifiesto = 'manifiesto.json'
    
    try:
        with open(ruta_manifiesto, 'r', encoding='utf-8') as f:
            manifiesto = json.load(f)
        
        tareas_a_procesar = list(manifiesto.get("tareas_pendientes", []))
        
        if not tareas_a_procesar:
            print("No hay tareas pendientes en el manifiesto. Finalizando.")
        else:
            for i, tarea in enumerate(tareas_a_procesar):
                print(f"\\n--- Procesando Tarea ({i+1}/{len(tareas_a_procesar)}): {tarea.get('id_tarea')} ---")
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
            
            print("\\n--- Procesamiento del manifiesto completado. ---")

    except Exception as e:
        print(f"❌ ERROR INESPERADO: {e}")
"""

# --- Lógica del Constructor ---

def construir_entorno():
    print("--- Iniciando Constructor de Entorno ---")
    
    # 1. Crear/Actualizar .env
    try:
        with open(".env", "w") as f:
            f.write(contenido_env.strip())
        print("✅ Archivo .env creado/actualizado en la raíz del proyecto.")
    except Exception as e:
        print(f"❌ ERROR al escribir .env: {e}")
        return

    # 2. Crear/Actualizar manifiesto.json
    try:
        with open("manifiesto.json", "w") as f:
            f.write(contenido_manifiesto.strip())
        print("✅ Archivo manifiesto.json creado/actualizado en la raíz del proyecto.")
    except Exception as e:
        print(f"❌ ERROR al escribir manifiesto.json: {e}")
        return

    # 3. Crear/Actualizar recolector_definitivo.py
    ruta_recolector = os.path.join("recolector", "recolector_definitivo.py")
    try:
        # Asegurarse de que la carpeta 'recolector' exista
        os.makedirs("recolector", exist_ok=True)
        with open(ruta_recolector, "w") as f:
            f.write(contenido_recolector.strip())
        print(f"✅ Archivo {ruta_recolector} creado/actualizado.")
    except Exception as e:
        print(f"❌ ERROR al escribir {ruta_recolector}: {e}")
        return
        
    print("\n--- ✅ Entorno configurado exitosamente. ---")
    print("Ahora puedes ejecutar el recolector.")

if __name__ == "__main__":
    construir_entorno()