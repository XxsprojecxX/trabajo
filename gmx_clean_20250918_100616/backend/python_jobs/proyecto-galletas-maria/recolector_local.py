# recolector_local.py (Versión Piloto Local)

import instaloader
import json
import os
import time
import sys

def recolectar_instagram_local(post_url, instagram_username):
    """
    Recolecta una conversación de Instagram usando Instaloader
    directamente desde la conexión local.
    """
    print("--- Iniciando instancia de Instaloader (Modo Local) ---")
    L = instaloader.Instaloader(
        # Añadimos User Agents para simular un navegador real
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    )

    # --- Manejo de Sesión de Instagram ---
    try:
        print(f"Intentando cargar sesión de Instagram para '{instagram_username}'...")
        L.load_session_from_file(instagram_username)
        print("Sesión de Instagram cargada exitosamente.")
    except FileNotFoundError:
        print("Archivo de sesión no encontrado. Se requerirá inicio de sesión interactivo.")
        L.interactive_login(instagram_username)
        L.save_session_to_file()
        print("Sesión de Instagram guardada para futuras ejecuciones.")

    # --- Extracción de Datos ---
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
        print("Uso: python recolector_local.py <TU_USUARIO_DE_INSTAGRAM>")
        sys.exit(1)
    
    instagram_user = sys.argv[1]
    
    print("--- Iniciando Recolector Piloto Local ---")
    ruta_manifiesto = 'manifiesto.json'
    
    try:
        with open(ruta_manifiesto, 'r', encoding='utf-8') as f:
            manifiesto = json.load(f)
        
        tareas_a_procesar = list(manifiesto["tareas_pendientes"])
        
        for i, tarea in enumerate(tareas_a_procesar):
            # Procesaremos tanto Instagram como TikTok con esta estrategia
            print(f"\n--- Procesando Tarea ({i+1}/{len(tareas_a_procesar)}): {tarea['id_tarea']} ---")
            
            resultado, status = recolectar_instagram_local(tarea["url"], instagram_user) if tarea['plataforma'] == 'instagram' else (None, "Plataforma no soportada en modo local por ahora.")
            
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
                print("Pausa de 30 segundos para simular comportamiento humano...")
                time.sleep(30)
        
        print("\n--- Procesamiento del manifiesto completado. ---")

    except Exception as e:
        print(f"❌ ERROR INESPERADO: {e}")