# diagnosticar_orquestador.py

import requests
import json
import os
import subprocess

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
        return None

def probar_orquestador(token):
    """
    Envía una Cápsula de Conversación perfecta y simple para probar el Orquestador.
    """
    texto_de_prueba = "Hoy preparé la clásica carlota de limón con galletas María para la tarde. Ver a mis hijos disfrutarla me recuerda tanto a cuando mi mamá nos la hacía a nosotros."
    
    capsula = {
        "id_conversacion": "prueba_diagnostico_001",
        "fuente_principal": {
            "tipo_contenido": "post_creador",
            "texto_input": texto_de_prueba, # Un texto simple y perfecto
            "metadatos": { "plataforma": "instagram", "creadora": "diagnostico" }
        },
        "respuestas_comunidad": []
    }
    
    print("Enviando cápsula de prueba al Orquestador...")
    print(f"Texto enviado: '{texto_de_prueba}'")
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(ORQUESTADOR_URL, headers=headers, json=capsula, timeout=300)
        
        print("\n--- RESULTADO DEL DIAGNÓSTICO ---")
        print(f"Status Code recibido: {response.status_code}")
        print("Respuesta del Orquestador:")
        # Imprimimos la respuesta en formato JSON legible
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"\n❌ ERROR: Ocurrió un error en la petición: {e}")

if __name__ == '__main__':
    print("--- Iniciando Diagnóstico del Orquestador ---")
    token_identidad = get_gcloud_token()
    if token_identidad:
        probar_orquestador(token_identidad)