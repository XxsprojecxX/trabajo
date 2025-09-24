# recolector/tiktok_scraper.py - v1.0
# Recolector de comentarios de un video de TikTok

import time
import os
import json
import dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURACIÓN ---
RECOLECTOR_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(RECOLECTOR_DIR, '.env'))

# URL del video de TikTok a analizar
TIKTOK_VIDEO_URL = "https://www.tiktok.com/@usuario/video/1234567890"

# Ruta al driver de Chrome
driver_path = os.path.join(RECOLECTOR_DIR, 'chromedriver')
service = Service(executable_path=driver_path)
driver = webdriver.Chrome(service=service)

print("--- Iniciando Recolector de TikTok ---")
driver.get(TIKTOK_VIDEO_URL)

# Esperar a que carguen comentarios
try:
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'comment')]"))
    )
    time.sleep(5)  # tiempo extra para que carguen varios comentarios
except Exception as e:
    print(f"⚠️ No se encontraron comentarios: {e}")

# Recolectar comentarios
comentarios = []
try:
    elementos = driver.find_elements(By.XPATH, "//p[contains(@class,'comment-text')]")
    for el in elementos:
        texto = el.text.strip()
        if texto:
            comentarios.append(texto)

    print(f"✅ Se recolectaron {len(comentarios)} comentarios.")

except Exception as e:
    print(f"❌ Error al extraer comentarios: {e}")

# Guardar resultados en JSON
salida = os.path.join(RECOLECTOR_DIR, "tiktok_comments.json")
with open(salida, "w", encoding="utf-8") as f:
    json.dump(comentarios, f, indent=2, ensure_ascii=False)

print(f"📂 Comentarios guardados en: {salida}")
driver.quit()
