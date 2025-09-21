import requests
import json

url = "https://api.brightdata.com/datasets/v3/trigger"

headers = {
    "Authorization": "Bearer ec865a7d-823e-43e5-b5ef-fdf48701d88b",
    "Content-Type": "application/json",
}

params = {
    "dataset_id": "gd_ltppn085pokosxh13",  # Instagram - Comments
    "include_errors": "true"
}

data = [
    {"url": "https://www.instagram.com/p/DOM3fIJCbkd/"},
    {"url": "https://www.instagram.com/p/DOMzsK4D7Zs/"},
    {"url": "https://www.instagram.com/p/DOMyARzjFL7/"}
]

response = requests.post(url, headers=headers, params=params, json=data)

# Imprimir salida bonita
print(json.dumps(response.json(), indent=2))
