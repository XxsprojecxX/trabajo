# diagnostico_credenciales.py

import os
import requests
from dotenv import load_dotenv

print("--- Iniciando Diagnóstico de Credenciales ---")

# Cargar variables de entorno desde .env en la misma carpeta
load_dotenv()
DI_USERNAME = os.getenv("DI_USERNAME")
DI_PASSWORD = os.getenv("DI_PASSWORD")

# --- Verificación de Carga ---
print("\n[Paso 1: Verificación de Carga de Variables]")

if DI_USERNAME:
    print(f"✅ Username Cargado: '{DI_USERNAME}'")
else:
    print("❌ ERROR: La variable DI_USERNAME no se encontró o está vacía.")

if DI_PASSWORD:
    # Por seguridad, solo mostramos partes de la contraseña
    pw_len = len(DI_PASSWORD)
    pw_display = f"{DI_PASSWORD[:2]}...{DI_PASSWORD[-2:]}" if pw_len > 4 else "Demasiado corta para mostrar"
    print(f"✅ Password Cargado: '{pw_display}' (Longitud: {pw_len} caracteres)")
else:
    print("❌ ERROR: La variable DI_PASSWORD no se encontró o está vacía.")

if not DI_USERNAME or not DI_PASSWORD:
    print("\nDiagnóstico detenido. Corrige el archivo .env.")
else:
    # --- Prueba de Conexión ---
    print("\n[Paso 2: Prueba de Conexión a la API]")
    
    # El payload más simple posible para una prueba
    payload = {'source': 'universal', 'url': 'https://www.google.com'}
    
    try:
        response = requests.post(
            'https://data.oxylabs.io/v1/queries',
            auth=(DI_USERNAME, DI_PASSWORD),
            json=payload
        )
        
        print(f"-> Status Code recibido: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ ¡ÉXITO! La autenticación ha funcionado correctamente.")
        elif response.status_code == 401:
            print("❌ FALLO: Autenticación denegada (401 Unauthorized). Las credenciales son incorrectas.")
        else:
            print(f"⚠️ RESPUESTA INESPERADA: El servidor respondió con el código {response.status_code}.")
        
        print("-> Respuesta del servidor (texto):")
        print(response.text)

    except Exception as e:
        print(f"❌ ERROR CATASTRÓFICO: No se pudo realizar la petición. Error: {e}")

print("\n--- Fin del Diagnóstico ---")