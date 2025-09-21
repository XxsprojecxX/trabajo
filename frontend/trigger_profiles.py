import requests
import json

url = "https://api.brightdata.com/datasets/v3/trigger"

headers = {
    "Authorization": "Bearer ec865a7d-823e-43e5-b5ef-fdf48701d88b",
    "Content-Type": "application/json",
}

params = {
    "dataset_id": "gd_l1villgoiiidt09ci",  # TikTok - Profiles
    "include_errors": "true"
}

data = [
    {"url": "https://www.tiktok.com/@papas.de.cuatro", "country": "MX"},
    {"url": "https://www.tiktok.com/@giannacristante/", "country": "MX"},
    {"url": "https://www.tiktok.com/@mamiabordo", "country": "MX"},
]

response = requests.post(url, headers=headers, params=params, json=data)

# Imprimir salida bonita
print(json.dumps(response.json(), indent=2))
