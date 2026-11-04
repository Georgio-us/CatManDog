#!/usr/bin/env python3
"""Create private upload snapshots for the ACANA/ORIJEN Excel and Albet Churu audit."""

import json
import re
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "research/supplier-files/2026-10-29-champion-acana-orijen/email-attachments/Pedido_Catmandog_ACANA_ORIJEN_2026.xlsx"
OUTPUT = ROOT / "research/supplier-files/parsed-price-snapshots"
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def workbook_rows():
    with ZipFile(INPUT) as archive:
        strings = ["".join(t.text or "" for t in item.findall(".//x:t", NS))
                   for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("x:si", NS)]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in sheet.findall(".//x:row", NS):
            number = int(row.get("r"))
            if number < 10 or number > 147:
                continue
            cells = {}
            for cell in row.findall("x:c", NS):
                value = cell.find("x:v", NS)
                if value is None:
                    continue
                column = re.match(r"[A-Z]+", cell.get("r", ""))
                if column:
                    cells[column.group()] = strings[int(value.text)] if cell.get("t") == "s" else value.text
            if cells.get("C"):
                yield number, cells


def amount_cents(value):
    if not value:
        return None
    return int((Decimal(value) * 100).quantize(Decimal("1")))


def write(snapshot):
    path = OUTPUT / f"{snapshot['id']}.json"
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    print(f"{path.relative_to(ROOT)}: {len(snapshot['items'])} rows")


def main():
    grouped = {"ACANA": [], "ORIJEN": []}
    for number, cells in workbook_rows():
        brand = cells.get("A", "").strip().upper()
        if brand not in grouped:
            continue
        code = cells["C"].strip()
        ean = cells.get("D", "").strip()
        if ean.isdigit() and len(ean) == 11:
            ean = "0" + ean
        weight_kg = Decimal(cells.get("I") or "0")
        weight = f"{weight_kg.normalize()} kg" if weight_kg else ""
        grouped[brand].append({
            "article": code, "name": cells.get("F", cells.get("E", "")).strip(),
            "line": cells.get("B", "").strip(), "weight": weight, "ean": ean,
            "shopPriceCents": amount_cents(cells.get("J")),
            "recommendedPriceCents": None, "minimumPriceCents": None,
            "rawPrices": {"sourceAmount": cells.get("J") or None,
                          "unitsPerCase": cells.get("H") or None,
                          "purchaseQuantityInAdrianDraft": cells.get("K") or None},
            "sourceRow": number,
        })
    for brand, items in grouped.items():
        if len(items) != (93 if brand == "ACANA" else 45):
            raise ValueError(f"Unexpected {brand} row count: {len(items)}")
        write({
            "id": f"distrivet-{brand.lower()}-2026-10-29", "supplierName": "Distrivet",
            "brand": brand, "priceDate": "2026-10-29",
            "sourceFile": INPUT.name, "shopPriceTaxBasis": "excludes_iva",
            "retailPriceTaxBasis": "unknown", "items": items,
        })

    churu = [
        ("940001", "Churu CAT atún", "12 × 4 × 14 g", 2112),
        ("940003", "Churu CAT pollo", "12 × 4 × 14 g", 2112),
        ("940004", "Churu CAT atún con vieira", "12 × 4 × 14 g", 2112),
        ("940007", "Churu CAT pollo con queso", "12 × 4 × 14 g", 2112),
        ("949577", "Churu CAT Variedades Salmón y Pollo", "20 × 14 g", 834),
    ]
    write({
        "id": "albet-churu-2026-11-03", "supplierName": "Albet", "brand": "Churu",
        "priceDate": "2026-11-03", "sourceFile": "Albet live catalog and checkout; FIRST-PURCHASE.md",
        "shopPriceTaxBasis": "excludes_iva", "retailPriceTaxBasis": "unknown",
        "items": [{"article": code, "name": name, "line": "Inaba CIAO / Churu",
                   "weight": weight, "ean": "", "shopPriceCents": price,
                   "recommendedPriceCents": None, "minimumPriceCents": None,
                   "rawPrices": {"source": "Authenticated Albet catalog, 2026-11-03",
                                  "unit": "purchase box"}, "sourceRow": index}
                  for index, (code, name, weight, price) in enumerate(churu, 1)],
    })


if __name__ == "__main__":
    main()
