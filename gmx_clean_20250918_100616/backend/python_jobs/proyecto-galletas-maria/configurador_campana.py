 # configurador_campana.py - v1.1, con descripción de Beat

import json
import datetime
import uuid

def configurar_nueva_campana():
    """
    Un script de terminal guiado para configurar una nueva campaña
    en la plataforma DK Content Insight.
    """
    print("--- Configurador de Campañas DK Content Insight ---")

    manifiesto = {
        "id_campana": f"CAMP-{uuid.uuid4().hex[:6].upper()}",
        "nombre_campana": "",
        "fecha_creacion": datetime.datetime.now().isoformat(),
        "creadoras": [],
        "beats": [],
        "asignaciones": []
    }

    # 1. Configurar Campaña
    print("\n--- PASO 1: Detalles de la Campaña ---")
    manifiesto["nombre_campana"] = input("Nombre de la Campaña (ej: Galletas Maria - Verano 2025): ")

    # 2. Registrar Creadoras
    print("\n--- PASO 2: Registrar Creadoras (UGCs) ---")
    while True:
        nombre_creadora = input("Nombre de la Creadora (o presiona Enter para terminar): ")
        if not nombre_creadora:
            break

        creadora = {
            "id_creadora": f"UGC-{uuid.uuid4().hex[:6].upper()}",
            "nombre_creadora": nombre_creadora,
            "handle_instagram": input(f"  Handle de Instagram para {nombre_creadora}: @"),
            "handle_tiktok": input(f"  Handle de TikTok para {nombre_creadora}: @")
        }
        manifiesto["creadoras"].append(creadora)
        print(f"-> Creadora '{nombre_creadora}' registrada con ID: {creadora['id_creadora']}")

    # 3. Registrar Beats
    print("\n--- PASO 3: Registrar Beats Creativos ---")
    while True:
        nombre_beat = input("Nombre del Beat (o presiona Enter para terminar): ")
        if not nombre_beat:
            break

        beat = {
            "id_beat": f"BEAT-{uuid.uuid4().hex[:6].upper()}",
            "nombre_beat": nombre_beat,
            "descripcion": input(f"  Descripción breve para '{nombre_beat}': ")
        }
        manifiesto["beats"].append(beat)
        print(f"-> Beat '{nombre_beat}' registrado con ID: {beat['id_beat']}")

    # 4. Asignar Posts
    print("\n--- PASO 4: Asignar y Programar Posts ---")
    if not manifiesto["creadoras"] or not manifiesto["beats"]:
        print("No hay suficientes creadoras o beats para hacer asignaciones.")
    else:
        while True:
            print("\nSelecciona una Creadora:")
            for i, c in enumerate(manifiesto["creadoras"]):
                print(f"  {i+1}. {c['nombre_creadora']}")

            try:
                seleccion_c = input("Elige el número de la Creadora (o presiona Enter para terminar): ")
                if not seleccion_c:
                    break
                creadora_seleccionada = manifiesto["creadoras"][int(seleccion_c) - 1]

                print("\nSelecciona un Beat:")
                for i, b in enumerate(manifiesto["beats"]):
                    print(f"  {i+1}. {b['nombre_beat']}")

                beat_seleccionado = manifiesto["beats"][int(input("Elige el número del Beat: ")) - 1]

                fecha_inicio = input("Fecha de inicio para este post (YYYY-MM-DD): ")
                url_post = input("URL del post una vez publicado (deja en blanco si aún no existe): ")

                asignacion = {
                    "id_asignacion": f"ASGN-{uuid.uuid4().hex[:6].upper()}",
                    "id_creadora": creadora_seleccionada["id_creadora"],
                    "id_beat": beat_seleccionado["id_beat"],
                    "fecha_inicio": fecha_inicio,
                    "plataforma": "instagram", # Simplificado para el piloto
                    "url_post": url_post if url_post else "PENDIENTE"
                }
                manifiesto["asignaciones"].append(asignacion)
                print("-> Asignación creada exitosamente.")

            except (ValueError, IndexError):
                print("Selección inválida. Inténtalo de nuevo.")

    # 5. Guardar Manifiesto
    with open('manifiesto.json', 'w', encoding='utf-8') as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=4)

    print("\n" + "="*50)
    print(" ¡Manifiesto de Campaña Creado Exitosamente! ")
    print("="*50)
    print("El archivo 'manifiesto.json' ha sido guardado en la raíz de tu proyecto.")
    print("Este archivo es ahora la fuente de verdad para nuestra campaña.")

if __name__ == "__main__":
    configurar_nueva_campana()