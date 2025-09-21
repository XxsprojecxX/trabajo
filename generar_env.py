import json
import os

def generar_contenido_env():
    """
    Lee un archivo de credenciales JSON de Google Cloud y genera el contenido
    para un archivo .env.local, manejando correctamente la clave privada.
    """
    print("--- Asistente de Creación de .env.local ---")
    
    json_path_input = input("Por favor, arrastra tu archivo de clave JSON a esta terminal y presiona Enter: ").strip()
    
    # Limpia la ruta si viene con comillas o caracteres extra
    json_path = json_path_input.replace("'", "").replace("\"", "")

    if not os.path.exists(json_path):
        print(f"\nERROR: La ruta del archivo no es válida. '{json_path}' no existe. Inténtalo de nuevo.")
        return

    try:
        with open(json_path, 'r') as f:
            credentials = json.load(f)
        
        project_id = credentials.get('project_id')
        client_email = credentials.get('client_email')
        private_key = credentials.get('private_key')

        if not all([project_id, client_email, private_key]):
            print("\nERROR: El archivo JSON no contiene los campos esperados.")
            return

    except Exception as e:
        print(f"\nERROR al leer el archivo JSON: {e}")
        return

    # Construye el contenido línea por línea para mayor claridad
    lines = [
        f'GOOGLE_CLOUD_PROJECT_ID="{project_id}"',
        f'GOOGLE_CLOUD_CLIENT_EMAIL="{client_email}"',
        f'GOOGLE_CLOUD_PRIVATE_KEY="{private_key}"'
    ]
    env_content = "\n".join(lines)

    # Imprime el resultado para copiar y pegar
    print("\n" + "="*50)
    print(" CONTENIDO PARA .env.local (100% CORRECTO) ")
    print("="*50)
    print("\nCopia todo el bloque de texto entre las siguientes líneas:\n")
    print("--- INICIO DEL BLOQUE ---")
    print(env_content)
    print("--- FIN DEL BLOQUE ---")
    print("\nInstrucciones: Pega este bloque en tu archivo 'frontend/.env.local', reemplazando todo su contenido.")

if __name__ == "__main__":
    generar_contenido_env()