 # maestro_ejecucion/main.py (Versión 3.0 - El Maestro Traductor)

import requests
import json
import os
import glob
import time
import subprocess
from bs4 import BeautifulSoup

# ---------------- CONFIGURACIÓN ----------------
ORQUESTADOR_URL = "https://us-central1-galletas-piloto-ju-250726.cloudfunctions.net/orquestar_analisis_conversacion"
# ---------------------------------------------

def get_gcloud_token():
    """Obtiene un token de identidad de gcloud para autenticar la petición."""
    try:
        token = subprocess.check_output(['gcloud', 'auth', 'print-identity-token'], text=True).strip()
        return token
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ ERROR: No se pudo obtener el token de gcloud.")
        print("Asegúrate de que gcloud CLI está instalado y autenticado.")
        return None

def extraer_texto_de_html(html_crudo, plataforma):
    """
    Usa BeautifulSoup para extraer el texto principal de la descripción de un post.
    """
    if not html_crudo:
        return ""
    
    soup = BeautifulSoup(html_crudo, 'html.parser')
    
    # La extracción de texto es diferente para cada plataforma.
    # Por ahora, nos enfocamos en la meta-etiqueta, que funciona para ambas.
    meta_tag = soup.find('meta', property='og:description')
    
    if meta_tag and meta_tag.get('content'):
        full_content = meta_tag['content']
        # El formato suele ser "Likes, Comments - user on Date: 'TEXTO DEL POST'"
        # Intentamos separar por el primer ':' para aislar el texto principal.
        parts = full_content.split(":", 1)
        if len(parts) > 1:
            text_part = parts[1].strip()
            # Quitamos comillas si existen
            if text_part.startswith(('"', "'")):
                text_part = text_part[1:]
            if text_part.endswith(('"', "'")):
                text_part = text_part[:-1]
            return text_part.strip()
        else:
            # Si no hay ':', devolvemos el contenido completo del tag
            return full_content.strip()
            
    return "No se pudo extraer la descripción del post desde las meta-etiquetas."


def enviar_a_orquestador(texto_a_analizar, info_archivo, token):
    """
    Envía los datos extraídos a la Cloud Function Orquestador.
    """
    capsula = {
        "id_conversacion": info_archivo.get("id_tarea", "piloto_local"),
        "fuente_principal": {
            "tipo_contenido": "post_creador",
            "texto": texto_a_analizar, # ¡Ahora enviamos solo el texto limpio!
            "metadatos": {
                "plataforma": info_archivo.get("plataforma", "desconocida"),
                "creadora": info_archivo.get("creadora", "desconocida"),
                "url": info_archivo.get("url", "")
            }
        },
        "respuestas_comunidad": []
    }
    
    print(f"Enviando texto extraído de '{info_archivo.get('id_tarea')}' al Orquestador...")
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(ORQUESTADOR_URL, headers=headers, json=capsula, timeout=300)
        
        if response.status_code == 200:
            print(f"✅ Enviado exitosamente. Respuesta del análisis:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        else:
            print(f"❌ Error al enviar. Status: {response.status_code}, Respuesta: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión al Orquestador: {e}")
        return False

if __name__ == '__main__':
    print("--- Iniciando Script Maestro v3.0 (El Maestro Traductor) ---")

    token_identidad = get_gcloud_token()

    if not token_identidad:
        print("Proceso detenido por fallo de autenticación.")
    else:
        archivos_json = glob.glob('resultado_*.json')
        
        if not archivos_json:
            print("No se encontraron archivos 'resultado_*.json' para procesar.")
        else:
            print(f"Se encontraron {len(archivos_json)} archivos de resultados para procesar.")
            
            manifiesto = {}
            try:
                with open('manifiesto.json', 'r', encoding='utf-8') as f:
                    manifiesto = json.load(f)
            except FileNotFoundError:
                print("Advertencia: No se encontró manifiesto.json.")

            # Unimos tareas pendientes y completadas para tener la metadata de todos los archivos
            todas_las_tareas = manifiesto.get("tareas_pendientes", []) + manifiesto.get("tareas_completadas", [])

            for archivo_path in archivos_json:
                print(f"\n--- Procesando archivo: {archivo_path} ---")
                
                info_tarea = next((t for t in todas_las_tareas if os.path.basename(archivo_path) in t.get('archivo_resultado', '') or any(part in archivo_path for part in t['url'].split('/') if len(part) > 5)), {})
                if not info_tarea:
                    print(f"Advertencia: No se encontró metadata para {archivo_path} en el manifiesto.")
                    info_tarea = {"plataforma": "desconocida"}


                with open(archivo_path, 'r', encoding='utf-8') as f:
                    datos_crudos = json.load(f)
                
                html = datos_crudos.get("contenido_raw", "")
                texto_extraido = extraer_texto_de_html(html, info_tarea.get("plataforma"))

                if texto_extraido:
                    print(f"Texto extraído: '{texto_extraido[:100]}...'")
                    enviado = enviar_a_orquestador(texto_extraido, info_tarea, token_identidad)
                    if not enviado:
                        print(f"Fallo al procesar {archivo_path}.")
                else:
                    print(f"No se pudo extraer texto del archivo {archivo_path}.")

                time.sleep(1)

            print("\n--- Procesamiento de archivos locales completado. ---")