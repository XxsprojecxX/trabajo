 # recolector/recolector_api_externa.py

import requests
import json
import os
import random
from dotenv import load_dotenv

def recolectar_con_api_externa(post_url):
    """
    Utiliza una API comercial (Dataimpulse) para recolectar datos de un post,
    cargando las credenciales de forma segura desde el archivo .env.
    """
    # --- Carga Segura de Credenciales ---
    # Busca el .env en la carpeta raíz del proyecto
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
    DI_USERNAME = os.getenv("DI_USERNAME")
    DI_PASSWORD = os.getenv("DI_PASSWORD")
    DI_HOST = os.getenv("DI_HOST")
    DI_PORT = os.getenv("DI_PORT")

    # Validar que las credenciales se cargaron correctamente
    if not all([DI_USERNAME, DI_PASSWORD, DI_HOST, DI_PORT]):
        print("Error: Faltan credenciales en el archivo .env. Asegúrate de que todas las variables DI_* estén definidas.")
        return None

    print(f"Enviando solicitud para la URL: {post_url} a través de la API externa...")

    # --- Construcción de la Conexión de Proxy ---
    session_id = random.randint(1, 10000)
    proxy_url = (f'http://{DI_USERNAME}-session-{session_id}:{DI_PASSWORD}@'
                 f'{DI_HOST}:{DI_PORT}')
    
    proxies = {'http': proxy_url, 'https': proxy_url}
    
    payload = {
        'source': 'universal',
        'url': post_url
    }
    
    auth = (DI_USERNAME, DI_PASSWORD)

    try:
        response = requests.post(
            'https://data.oxylabs.io/v1/queries',
            auth=auth,
            json=payload
        )
        response.raise_for_status()
        
        datos_brutos = response.json()
        print("Datos recibidos exitosamente de la API externa.")
        
        return datos_brutos

    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con la API externa: {e}")
        print("Respuesta del servidor:", e.response.text if e.response else "Sin respuesta")
        return None

# --- Ejecución de Prueba ---
if __name__ == '__main__':
    url_prueba = "https://www.instagram.com/reel/C_c7_1tP7x3/"
    resultado = recolectar_con_api_externa(url_prueba)
    
    if resultado:
        # Guardar el resultado en la carpeta raíz del proyecto
        ruta_guardado = os.path.join(os.path.dirname(__file__), '..', 'resultado_api_externa.json')
        with open(ruta_guardado, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=4)
        print(f"¡Prueba exitosa! El resultado ha sido guardado en: '{ruta_guardado}'.")