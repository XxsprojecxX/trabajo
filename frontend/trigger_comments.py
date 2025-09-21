import requests
import json

url = "https://api.brightdata.com/datasets/v3/trigger"

headers = {
    "Authorization": "Bearer ec865a7d-823e-43e5-b5ef-fdf48701d88b",
    "Content-Type": "application/json",
}

params = {
    "dataset_id": "gd_lkf2st302ap89utw5k",  # TikTok - Comments
    "include_errors": "true"
}

data = [
    {"url": "https://www.tiktok.com/@papas.de.cuatro/video/7546401957578018066"},
    {"url": "https://www.tiktok.com/@giannacristante/video/7546393355052158229"},
    {"url": "https://www.tiktok.com/@mamiabordo/video/7546389990930943245"},
]

response = requests.post(url, headers=headers, params=params, json=data)

# Imprimir salida bonita
print(json.dumps(response.json(), indent=2))
