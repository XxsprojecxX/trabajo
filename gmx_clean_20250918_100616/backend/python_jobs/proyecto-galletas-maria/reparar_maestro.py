# reparar_maestro.py
import os

# Contenido completo y correcto para maestro_ejecucion/main.py
contenido_maestro_correcto = """
# maestro_ejecucion/main.py (Versión 2.1 - Sintaxis Corregida)

import requests
import json
import os
import glob
import time
import subprocess

# ---------------- CONFIGURACIÓN ----------------
ORQUESTADOR_URL = "https://us-central1-galletas-piloto-ju-250726.cloudfunctions.net/orquestar_analisis_conversacion"
# ---------------------------------------------

def get_gcloud_token():
    \"\"\"Obtiene un token de identidad de gcloud para autenticar la petición.\"\"\"
    try:
        token = subprocess.check_output(['gcloud', 'auth', 'print-identity-token'], text=True).strip()
        return token
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print("❌ ERROR: No se pudo obtener el token de gcloud. Asegúrate de que gcloud CLI está instalado y autenticado.")
        print("Ejecuta 'gcloud auth application-default login' en tu terminal.")
        return None

def enviar_a_orquestador(datos_recolectados, info_archivo, token):
    \"\"\"
    Envía los datos de un archivo JSON a la Cloud Function Orquestador.
    \"\"\"
    capsula = {
        "id_conversacion": info_archivo.get("id_tarea", "piloto_local"),
        "fuente_principal": {
            "tipo_contenido": "post_completo_raw",
            "texto_input": json.dumps(datos_recolectados),
            "metadatos": {
                "plataforma": info_archivo.get("plataforma", "desconocida"),
                "creadora": info_archivo.get("creadora", "desconocida"),
                "url": info_archivo.get("url", "")
            }
        },
        "respuestas_comunidad": []
    }
    
    print(f"Enviando datos de '{info_archivo.get('id_tarea')}' al Orquestador...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(ORQUESTADOR_URL, headers=headers, json=capsula, timeout=300)
        
        if response.status_code == 200:
            print(f"✅ Enviado exitosamente. Respuesta: {response.text}")
            return True
        else:
            print(f"❌ Error al enviar. Status: {response.status_code}, Respuesta: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión al Orquestador: {e}")
        return False

if __name__ == '__main__':
    print("--- Iniciando Script Maestro v2.1 ---")

    token_identidad = get_gcloud_token()

    if not token_identidad:
        print("Proceso detenido por fallo de autenticación.")
    else:
        archivos_json = glob.glob('resultado_*.json')
        
        if not archivos_json:
            print("No se encontraron archivos 'resultado_*.json' para procesar.")
        else:
            print(f"Se encontraron {len(archivos_json)} archivos de resultados para procesar.")
            
            try:
                with open('manifiesto.json', 'r', encoding='utf-8') as f:
                    manifiesto = json.load(f)
                tareas_completadas = manifiesto.get("tareas_completadas", [])
            except FileNotFoundError:
                print("Advertencia: No se encontró manifiesto.json. Los metadatos serán limitados.")
                tareas_completadas = []

            for archivo_path in archivos_json:
                print(f"\\n--- Procesando archivo: {archivo_path} ---")
                
                shortcode = archivo_path.split('_')[-1].replace('.json', '')
                info_tarea = next((t for t in tareas_completadas if shortcode in t['url']), {})

                with open(archivo_path, 'r', encoding='utf-8') as f:
                    datos = json.load(f)
                
                enviado = enviar_a_orquestador(datos, info_tarea, token_identidad)
                if not enviado:
                    print(f"Fallo al procesar {archivo_path}. Revisa los errores.")
                
                time.sleep(1)

            print("\\n--- Procesamiento de archivos locales completado. ---")
"""

# Lógica del reparador
ruta_objetivo = os.path.join("maestro_ejecucion", "main.py")
try:
    with open(ruta_objetivo, "w") as f:
        f.write(contenido_maestro_correcto.strip())
    print(f"✅ ÉXITO: El archivo '{ruta_objetivo}' ha sido reparado y guardado correctamente.")
    print("--- Ahora puedes ejecutar el Script Maestro. ---")
except Exception as e:
    print(f"❌ ERROR: No se pudo reparar el archivo. Detalle: {e}")