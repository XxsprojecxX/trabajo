import json
import pandas as pd
import pprint
import random
import csv # Importamos la librería CSV

def load_data(filename):
    """Carga datos desde un archivo JSON."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"    -> !!! ERROR: El archivo '{filename}' no fue encontrado.")
        return None
    except json.JSONDecodeError:
        print(f"    -> !!! ERROR: El archivo '{filename}' no contiene un JSON válido.")
        return None

def unify_comments(master_dataset):
    """Unifica los comentarios de Instagram y TikTok en una sola lista estandarizada."""
    unified_list = []
    # Procesar Instagram
    for comment in master_dataset.get('ig_comments_results', []):
        unified_list.append({'platform': 'Instagram', 'user': comment.get('comment_user'), 'text': comment.get('comment'), 'post_url': comment.get('post_url')})
    # Procesar TikTok
    for comment in master_dataset.get('tiktok_comments_results', []):
        unified_list.append({'platform': 'TikTok', 'user': comment.get('commenter_user_name'), 'text': comment.get('comment_text'), 'post_url': comment.get('post_url')})
    return unified_list

def analyze_comment_with_ai(comment_text):
    """FUNCIÓN SIMULADA (MOCK)"""
    if not isinstance(comment_text, str):
        return {'sentiment': 'unknown', 'theme': 'unknown', 'archetype': 'unknown'}

    sentiments = ['positivo', 'negativo', 'neutral']
    themes = ['familia', 'nostalgia', 'practicidad', 'humor', 'consejo']
    archetypes = ['la madre protectora', 'la madre moderna', 'la hija', 'la amiga']

    return {
        'sentiment': random.choice(sentiments),
        'theme': random.choice(themes),
        'archetype': random.choice(archetypes)
    }

# --- Punto de Entrada Principal ---
if __name__ == "__main__":
    print(">>> Iniciando el Pipeline de Procesamiento y Análisis (Versión 4.1 - Blindada)...")

    data_files = ["galletas_maria_profiles.json", "ig_posts_results.json", "ig_comments_results.json", "tiktok_profiles_results.json", "tiktok_posts_results.json", "tiktok_comments_results.json"]
    master_dataset = {}

    for filename in data_files:
        data = load_data(filename)
        if data:
            master_dataset[filename.replace('.json', '')] = data

    df = pd.DataFrame(unify_comments(master_dataset))
    df['analysis_result'] = df['text'].apply(analyze_comment_with_ai)
    analysis_df = pd.json_normalize(df['analysis_result'])
    final_df = pd.concat([df.drop(columns=['analysis_result']), analysis_df], axis=1)

    # LÍNEA CORREGIDA PARA EXPORTACIÓN BLINDADA
    final_df.to_csv('final_analyzed_data.csv', index=False, encoding='utf-8-sig', quoting=csv.QUOTE_NONNUMERIC)

    print(">>> ¡Exportación Exitosa! Se ha creado el archivo 'final_analyzed_data.csv' (versión blindada).")
    print(">>> ¡PIPELINE COMPLETADO!") 