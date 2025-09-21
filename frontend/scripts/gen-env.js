const fs = require("fs");
const path = require("path");
const saPath = path.join(process.cwd(), "secrets", "sa.json"); // <-- debe existir
if (!fs.existsSync(saPath)) {
  console.error("ERROR: No existe secrets/sa.json. Crea ese archivo con tu Service Account.");
  process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
// Asegura los \\n en private_key
sa.private_key = sa.private_key.replace(/\n/g, "\\n");
const line = "BIGQUERY_SERVICE_ACCOUNT_JSON=" + JSON.stringify(sa);
console.log(line);
