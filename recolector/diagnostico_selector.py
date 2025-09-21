 # recolector/diagnostico_selector.py - v2.0 con Login

import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import dotenv

# --- CONFIGURACIÓN ---
# Carga las credenciales del .env del recolector
RECOLECTOR_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(RECOLECTOR_DIR, '.env'))
INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")

URL_A_PROBAR = "https://www.instagram.com/p/DHcQE-gPk_F/"
XPATH_A_PROBAR = "//h1" # El selector que estamos probando para el post
# ------------------------------------

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
            for i, el in enumerate(elementos):
                print(f"  - Texto del Elemento {i+1}: '{el.text[:100]}...'")
        else:
            print("\nFALLO: No se encontró ningún elemento con ese XPath.")

    except Exception as e:
        print(f"\nERROR CATASTRÓFICO: El script falló con una excepción: {e}")

print("\nDiagnóstico completado. Cerrando navegador.")
driver.quit()