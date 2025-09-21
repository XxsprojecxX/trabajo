import csv

input_file = "/Users/ivanuribe/Library/CloudStorage/GoogleDrive-ivanuribecampos.1975@gmail.com/Mi unidad/ig_master.csv"
output_file = "/Users/ivanuribe/galletas_maria_project/PROYECTO-GALLETAS-MARIA/DATA/ig_master_clean.csv"

with open(input_file, "r", encoding="utf-8", errors="ignore") as infile, \
     open(output_file, "w", newline="", encoding="utf-8") as outfile:

    reader = csv.reader(infile, delimiter=",", quotechar='"')
    writer = csv.writer(outfile, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL)

    for row in reader:
        # Elimina saltos de línea internos y espacios extra
        row = [col.strip().replace("\n", " ") for col in row]
        writer.writerow(row)

print(f"Archivo limpio generado en: {output_file}")
