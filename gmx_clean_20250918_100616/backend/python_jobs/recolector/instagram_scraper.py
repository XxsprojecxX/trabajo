import os
import time
import dotenv
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- CONFIGURACIÓN ---
RECOLECTOR_DIR = os.path.dirname(os.path.abspath(__file__))
dotenv.load_dotenv(os.path.join(RECOLECTOR_DIR, '.env'))

INSTAGRAM_USERNAME = os.getenv("INSTAGRAM_USERNAME")
INSTAGRAM_PASSWORD = os.getenv("INSTAGRAM_PASSWORD")


def login_instagram(driver):
    """Inicia sesión en Instagram."""
    print("🔑 Iniciando sesión en Instagram...")
    driver.get("https://www.instagram.com/accounts/login/")

    try:
        WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, 'username')))
        driver.find_element(By.NAME, 'username').send_keys(INSTAGRAM_USERNAME)
        driver.find_element(By.NAME, 'password').send_keys(INSTAGRAM_PASSWORD)
        driver.find_element(By.XPATH, "//button[@type='submit']").click()

        # Esperar a que cargue la página principal
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@href, '/direct/inbox/')]"))
        )
        print("✅ Sesión iniciada correctamente.")
        return True
    except Exception as e:
        print(f"❌ Error durante el login: {e}")
        return False


def get_post_comments(url_post, max_comments=50):
    """Extrae comentarios de un post de Instagram."""
    driver_path = os.path.join(RECOLECTOR_DIR, "chromedriver")
    service = Service(executable_path=driver_path)
    driver = webdriver.Chrome(service=service)

    comentarios = []

    try:
        if not login_instagram(driver):
            return []

        print(f"➡️ Navegando al post: {url_post}")
        driver.get(url_post)
        time.sleep(5)

        # Cargar más comentarios si es necesario
        while len(comentarios) < max_comments:
            try:
                more_button = driver.find_element(By.XPATH, "//span[contains(text(), 'Ver más comentarios')]")
                more_button.click()
                time.sleep(2)
            except:
                break

            # Extraer los comentarios visibles
            elements = driver.find_elements(By.XPATH, "//ul/div/li/div/div/div/div/span")
            for el in elements:
                texto = el.text.strip()
                if texto and texto not in comentarios:
                    comentarios.append(texto)

        print(f"📊 Se recolectaron {len(comentarios)} comentarios.")
        return [{"comentario": c} for c in comentarios[:max_comments]]

    except Exception as e:
        print(f"⚠️ Error en la recolección: {e}")
        return []
    finally:
        driver.quit()
