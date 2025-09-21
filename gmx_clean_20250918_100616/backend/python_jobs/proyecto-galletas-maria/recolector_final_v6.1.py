# recolector_final_v6.1.py

import instaloader
import json
import os
import time
import sys
from dotenv import load_dotenv

def recolectar_instagram_con_proxy(post_url, instagram_username):
    load_dotenv()
    DI_USERNAME = os.getenv("DI_USERNAME")
    DI_PASSWORD = os.getenv("DI_PASSWORD")
    DI_HOST = os.getenv("DI_HOST")
    DI_PORT = os.getenv("DI_PORT")

    if not all([DI_USERNAME, DI_PASSWORD, DI_HOST, DI_PORT]):
        return None, "Error: Faltan credenciales del proxy en el archivo .env."

    print("Iniciando instancia de Instaloader...")
    L = instaloader.Instaloader()

    print("Configurando proxy de Dataimpulse con Geo-Targeting a México...")
    # !! ESTE ES EL CAMBIO CRÍTICO: AÑADIMOS PARÁMETROS DE PAÍS AL USUARIO !!
    proxy_username_geo = f"{DI_USERNAME}-country-mx"
    proxy = f"http://{proxy_username_geo}:{DI_PASSWORD}@{DI_HOST}:{DI_PORT}"
    
    L.context.proxies = {'http': proxy, 'https': proxy}
    
    try:
        print(f"Intentando cargar sesión de Instagram para '{instagram_username}'...")
        L.load_session_from_file(instagram_username)
        print("Sesión de Instagram cargada exitosamente.")
    except FileNotFoundError:
        print("Archivo de sesión no encontrado. Se requerirá inicio de sesión interactivo.")
        L.interactive_login(instagram_username)
        L.save_session_to_file()
        print("Sesión de Instagram guardada para futuras ejecuciones.")

    try:
        shortcode = post_url.split("/")[-2]
        print(f"Obteniendo datos del post: {shortcode}...")
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        
        capsula = {
            "id_conversacion": f"instagram_{shortcode}",
            "fuente_principal": {
                "tipo_contenido": "post_creador",
                "texto_input": post.caption or "",
                "metadatos": { "plataforma": "instagram", "fecha": post.date_utc.strftime('%Y-%m-%d'), "likes": post.likes, "comments_count": post.comments, "url": post_url }
            },
            "respuestas_comunidad": []
        }

        print(f"Recolectando comentarios ({post.comments} en total)...")
        for comment in post.get_comments():
            capsula["respuestas_comunidad"].append({
                "tipo_contenido": "comentario", "texto_input": comment.text,
                "metadatos": { "fecha": comment.created_at_utc.strftime('%Y-%m-%d'), "likes_comentario": comment.likes_count, "autor": comment.owner.username }
            })
        
        print("Recolección de comentarios completada.")
        return capsula, "Éxito"

    except Exception as e:
        print(f"❌ Error durante la recolección con Instaloader: {e}")
        return None, str(e)

# --- El resto del script (la parte __main__) se mantiene exactamente igual ---
def guardar_manifiesto(manifiesto, ruta):
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Uso: python recolector_final_v6.1.py <TU_USUARIO_DE_INSTAGRAM>")
        sys.exit(1)
    
    instagram_user = sys.argv[1]
    
    print("--- Iniciando Recolector v6.1 (Arquitectura Final con Geo-Targeting) ---")
    ruta_manifiesto = 'manifiesto.json'
    
    try:
        with open(ruta_manifiesto, 'r', encoding='utf-8') as f:
            manifiesto = json.load(f)
        
        tareas_a_procesar = list(manifiesto["tareas_pendientes"])
        
        for i, tarea in enumerate(tareas_a_procesar):
            if tarea['plataforma'] != 'instagram':
                print(f"--- Saltando tarea no-Instagram: {tarea['id_tarea']} ---")
                continue
            
            print(f"\n--- Procesando Tarea ({i+1}/{len(tareas_a_procesar)}): {tarea['id_tarea']} ---")
            resultado, status = recolectar_instagram_con_proxy(tarea["url"], instagram_user)
            
            if resultado:
                shortcode = tarea["url"].split("/")[-2]
                nombre_archivo = f"resultado_{tarea['creadora'].replace(' ', '_')}_{tarea['plataforma']}_{shortcode}.json"
                
                with open(nombre_archivo, 'w', encoding='utf-8') as f:
                    json.dump(resultado, f, ensure_ascii=False, indent=4)
                print(f"✅ Tarea Exitosa. Resultado guardado en: '{nombre_archivo}'.")

                manifiesto["tareas_pendientes"].remove(tarea)
                tarea['fecha_completado'] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                manifiesto["tareas_completadas"].append(tarea)
                guardar_manifiesto(manifiesto, ruta_manifiesto)
                print("Manifiesto actualizado.")
            else:
                print(f"❌ Tarea Fallida: {tarea['id_tarea']}. Razón: {status}")

            if i < len(tareas_a_procesar) - 1:
                print("Pausa de 15 segundos para evitar bloqueos...")
                time.sleep(15)
        
        print("\n--- Procesamiento del manifiesto completado. ---")

    except Exception as e:
        print(f"❌ ERROR INESPERADO: {e}")
