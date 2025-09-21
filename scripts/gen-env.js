// scripts/gen-env.js
const fs = require("fs");
const path = require("path");

// Ruta de tu service account JSON (ajústala si está en otro lado)
const saPath = path.join(process.cwd(), "secrets", "sa.json");

// Cargar y parsear
const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));

// Convertir el private_key (reemplaza saltos reales por \\n)
sa.private_key = sa.private_key.replace(/\n/g, "\\n");

// Armar el JSON en una sola línea
const line = JSON.stringify(sa);

// Mostrar el resultado formateado para pegar en .env.local
console.log(`BIGQUERY_SERVICE_ACCOUNT_JSON=${line}`);