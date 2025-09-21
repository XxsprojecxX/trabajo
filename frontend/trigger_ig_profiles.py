import requests
import json

url = "https://api.brightdata.com/datasets/v3/trigger"

headers = {
    "Authorization": "Bearer ec865a7d-823e-43e5-b5ef-fdf48701d88b",
    "Content-Type": "application/json",
}

params = {
    "dataset_id": "gd_l1vikfch901nx3by4",  # Instagram - Profiles
    "include_errors": "true",
    "type": "discover_new",
    "discover_by": "user_name"
}

data = [
    {"user_name": "@papa.de.cuatro"},
    {"user_name": "@giannacristante"},
    {"user_name": "@mami.a.bordo"}
]

response = requests.post(url, headers=headers, params=params, json=data)

# Imprimir salida bonita
print(json.dumps(response.json(), indent=2))
