 # recolector/diagnostico_selector.py - v2.0 con Login

import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import dotenv
import json, datetime, re, request 

# --- CONFIGURACIÓN ---
# Carga las credenciales del .env del recolector
RECOLECTOR_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(RECOLECTOR_DIR, '.env'))
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

URL_A_PROBAR = "https://www.instagram.com/p/DHcQE-gPk_F/"
XPATH_A_PROBAR = "//h1" # El selector que estamos probando para el post
# ------------------------------------ 

def parse_int_commas(texto):
    """Convierte strings con comas a enteros. Ej: '1,234' -> 1234"""
    try:
        return int(texto.replace(",", "").strip())
    except Exception:
        return None

def clean_text(txt):
    """Limpia espacios y saltos de línea de un texto"""
    return re.sub(r'\s+', ' ', txt).strip()

def standardize_instagram_post(raw):
    """Devuelve un diccionario normalizado de un post de Instagram"""
    return {
        "caption": clean_text(raw.get("caption", "")),
        "likes": parse_int_commas(raw.get("likes", "0")),
        "comments": [clean_text(c) for c in raw.get("comments", [])],
        "url": raw.get("url", ""),
        "scraped_index": raw.get("scraped_index", 0)
    }

# -------------------------
# Función de login
# -------------------------
def login_instagram(driver):
    """Inicia sesión en Instagram."""
    print("Iniciando sesión en Instagram...")
    driver.get("https://www.instagram.com/accounts/login/")
    try:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, 'username')))
        driver.find_element(By.NAME, 'username').send_keys(INSTAGRAM_USERNAME)
        driver.find_element(By.NAME, 'password').send_keys(INSTAGRAM_PASSWORD)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//*[contains(@href, '/direct/inbox/')]")))
        print("Sesión iniciada exitosamente.")
        return True
    except Exception as e:
        print(f"Error durante el inicio de sesión: {e}")
        return False


print("--- Iniciando Script de Diagnóstico de Selectores (con Login) ---")
driver_path = os.path.join(RECOLECTOR_DIR, 'chromedriver')
service = Service(executable_path=driver_path)
driver = webdriver.Chrome(service=service)

# Ejecutamos el login primero
if login_instagram(driver):
    print(f"\nNavegando a: {URL_A_PROBAR}")
    driver.get(URL_A_PROBAR)

    print(f"Esperando 10 segundos a que la página cargue completamente...")
    time.sleep(10)

    try:
        print(f"Intentando encontrar elementos con el XPath: {XPATH_A_PROBAR}")
        elementos = driver.find_elements(By.XPATH, XPATH_A_PROBAR)

        if elementos:
            print(f"\n¡ÉXITO! Se encontraron {len(elementos)} elemento(s).")

            processed = []
            for i, el in enumerate(elementos):
                raw_post = {
                    "caption": el.text,
                    "likes": "0",              # 🔹 aquí luego metes el selector de likes real
                    "comments": [],            # 🔹 aquí luego metes los comentarios extraídos
                    "url": URL_A_PROBAR,
                    "scraped_index": i
                }
                clean_post = standardize_instagram_post(raw_post)
                processed.append(clean_post)

            # Guardar resultados en JSON
            out_file = os.path.join(RECOLECTOR_DIR, "posts_normalizados.json")
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(processed, f, ensure_ascii=False, indent=4)

            print(f"\n✅ Datos normalizados guardados en: {out_file}")

        else:
            print("\nFALLO: No se encontró ningún elemento con ese XPath.")

    except Exception as e:
        print(f"\nERROR CATASTRÓFICO: El script falló con una excepción: {e}")

print("\nDiagnóstico completado. Cerrando navegador.")
driver.quit()