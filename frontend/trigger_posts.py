import requests
import json

url = "https://api.brightdata.com/datasets/v3/trigger"

headers = {
    "Authorization": "Bearer ec865a7d-823e-43e5-b5ef-fdf48701d88b",
    "Content-Type": "application/json",
}

params = {
    "dataset_id": "gd_lu702nij2f790tmv9h",  # TikTok - Posts
    "include_errors": "true"
}

data = [
    {"url": "https://www.tiktok.com/@papas.de.cuatro/video/7546401957578018066", "country": "MX"},
    {"url": "https://www.tiktok.com/@giannacristante/video/7546393355052158229", "country": "MX"},
    {"url": "https://www.tiktok.com/@mamiabordo/video/7546389990930943245", "country": "MX"},
]

response = requests.post(url, headers=headers, params=params, json=data)

# Imprimir salida bonita
print(json.dumps(response.json(), indent=2))
