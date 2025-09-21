# backend/analyzer/comment_analyzer.py

import json
import re
from collections import Counter
import os

# --- FUNCIONES DE PROCESAMIENTO ---
def limpiar_texto(texto: str) -> str:
    """Limpia comentarios: elimina símbolos, links y minúsculas."""
    texto = texto.lower()
    texto = re.sub(r"http\S+", "", texto)  # links
    texto = re.sub(r"[^a-záéíóúñ ]", " ", texto)  # solo letras
    texto = re.sub(r"\s+", " ", texto).strip()  # espacios extra
    return texto

def analizar_comentarios(ruta_json: str, top_n: int = 10):
    """Lee un comments.json, procesa los comentarios y devuelve top N palabras."""
    
    if not os.path.exists(ruta_json):
        raise FileNotFoundError(f"No se encontró el archivo: {ruta_json}")

    with open(ruta_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Obtener todos los comentarios
    comentarios = [c["comment"] for c in data if "comment" in c]

    # Limpiar y tokenizar
    palabras = []
    for c in comentarios:
        limpio = limpiar_texto(c)
        palabras.extend(limpio.split(" "))

    # Filtrar palabras vacías (stopwords básicas)
    stopwords = {"el", "la", "de", "y", "que", "en", "a", "un", "una", "los", "las", "con", "por", "para"}
    palabras = [p for p in palabras if p and p not in stopwords]

    # Contar frecuencias
    conteo = Counter(palabras)
    total = sum(conteo.values())

    # Calcular porcentajes
    resultado = [
        {"keyword": palabra, "porcentaje": round((freq / total) * 100, 2)}
        for palabra, freq in conteo.most_common(top_n)
    ]

    return {"temas": resultado}


# --- PRUEBA RÁPIDA ---
if __name__ == "__main__":
    ruta = "backend/data/comments_instagram.json"  # ejemplo
    try:
        print(analizar_comentarios(ruta))
    except Exception as e:
        print(f"Error: {e}")
