 # recolector_final_v5.0.py (Versión 5.1 - Puerto Corregido)

import os
import requests
import json
from dotenv import load_dotenv

def recolectar_con_dataimpulse(target_url):
    """
    Se conecta al endpoint correcto de la API de Dataimpulse para solicitar
    el scraping de una URL específica, usando el PUERTO CORRECTO.
    """
    print("--- Iniciando Recolección con API Dataimpulse (v5.1 - Puerto Corregido) ---")
    
    # --- Carga Segura de Credenciales ---
    load_dotenv()
    DI_USERNAME = os.getenv("DI_USERNAME")
    DI_PASSWORD = os.getenv("DI_PASSWORD")
    API_HOST = os.getenv("DI_HOST") 
    
    if not all([DI_USERNAME, DI_PASSWORD, API_HOST]):
        print("❌ ERROR: Faltan credenciales en el archivo .env.")
        return

    # --- Construcción de la Petición a la API CORRECTA ---
    # !! ESTE ES EL CAMBIO CRÍTICO: AÑADIMOS EL PUERTO :777 !!
    api_endpoint = f"https://{API_HOST}:777/api/v1/scrape/url" 

    payload = { "url": target_url }
    
    print(f"Enviando solicitud al endpoint de Dataimpulse: {api_endpoint}")
    print(f"URL objetivo: {target_url}")

    try:
        response = requests.post(
            api_endpoint,
            auth=(DI_USERNAME, DI_PASSWORD),
            json=payload,
            timeout=180,
            verify=False # Añadimos esto para ser más flexibles con certificados SSL no estándar
        )
        response.raise_for_status() 
        
        datos_recibidos = response.json()
        
        print("\n-----------------------------------------------------")
        print(f"✅ ¡CONEXIÓN Y RECOLECCIÓN EXITOSAS!")
        print(f"   Se recibieron datos del servidor de Dataimpulse.")
        print("-----------------------------------------------------")
        return datos_recibidos

    except requests.exceptions.HTTPError as e:
        print(f"\n❌ FALLO: Error HTTP {e.response.status_code}")
        print(f"   Respuesta del servidor: {e.response.text}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FALLO: Ocurrió un error de conexión inesperado.")
        print(f"   Detalle: {e}")

if __name__ == '__main__':
    url_de_prueba_real = "https://www.instagram.com/p/DKDCQWCS883/"
    resultado = recolectar_con_dataimpulse(url_de_prueba_real)
    
    if resultado:
        nombre_archivo = "resultado_final_api.json"
        with open(nombre_archivo, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=4)
        print(f"Resultado guardado en '{nombre_archivo}'.")