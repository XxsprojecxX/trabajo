# recolector_final_v4.py

import os
import requests
from dotenv import load_dotenv

def probar_conexion_proxy():
    """
    Realiza una prueba de conexión a través del proxy de Dataimpulse
    para verificar que la autenticación y el enrutamiento funcionan.
    """
    print("--- Iniciando Prueba de Conexión de Proxy (v4) ---")
    
    # --- Carga Segura de Credenciales ---
    load_dotenv()
    DI_USERNAME = os.getenv("DI_USERNAME")
    DI_PASSWORD = os.getenv("DI_PASSWORD")
    DI_HOST = os.getenv("DI_HOST")
    DI_PORT = os.getenv("DI_PORT")

    if not all([DI_USERNAME, DI_PASSWORD, DI_HOST, DI_PORT]):
        print("❌ ERROR: Faltan credenciales en el archivo .env. Asegúrate de que el archivo .env esté en la raíz del proyecto y tenga los 4 valores correctos sin comillas.")
        return

    # --- Construcción de la URL del Proxy ---
    proxy_url = f"http://{DI_USERNAME}:{DI_PASSWORD}@{DI_HOST}:{DI_PORT}"
    
    proxies = {
        "http": proxy_url,
        "httpsai": proxy_url,
    }

    url_de_prueba = "https://api.ipify.org?format=json"
    
    print(f"Usando el host del proxy: {DI_HOST}")
    print(f"Intentando conectar a: {url_de_prueba}")

    try:
        response = requests.get(url_de_prueba, proxies=proxies, timeout=30)
        response.raise_for_status() 
        
        ip_info = response.json()
        ip_publica = ip_info.get("ip")
        
        print("\n-----------------------------------------------------")
        print(f"✅ ¡ÉXITO! Conexión a través del proxy exitosa.")
        print(f"   Tu IP pública a través del proxy es: {ip_publica}")
        print("-----------------------------------------------------")

    except requests.exceptions.ProxyError as e:
        print("\n❌ FALLO: Error de Proxy.")
        print("   Esto generalmente significa que las credenciales (usuario/contraseña) son incorrectas.")
        print(f"   Detalle: {e}")
    except requests.exceptions.ConnectTimeout as e:
        print("\n❌ FALLO: Tiempo de espera de conexión agotado.")
        print("   Verifica que el HOST y el PUERTO del proxy son correctos y que no tienes un firewall bloqueando la conexión.")
        print(f"   Detalle: {e}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ FALLO: Ocurrió un error inesperado con la petición.")
        print(f"   Detalle: {e}")

if __name__ == '__main__':
    probar_conexion_proxy()
