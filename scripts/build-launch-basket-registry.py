#!/usr/bin/env python3
"""Reconcile the selected supplier baskets with the local storefront catalog.

The generated JSON stays under ignored research/supplier-files because it contains
private supplier costs. Run from the repository root with Python 3 and Node.js.
"""

from __future__ import annotations

import json
import re
import subprocess
from decimal import Decimal
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "research/supplier-files/launch-basket-registry-2026-11-04.json"
SELECTION_OUT = ROOT / "research/supplier-files/launch-basket-selection-upload-2026-11-04.json"
MATCHES_OUT = ROOT / "research/supplier-files/launch-basket-matches-upload-2026-11-04.json"
EXCEL = ROOT / "research/supplier-files/2026-10-29-champion-acana-orijen/email-attachments/Pedido_Catmandog_ACANA_ORIJEN_2026.xlsx"
RC_TARIFF = ROOT / "research/supplier-files/parsed-price-snapshots/royal-canin-2026-03-01.json"
LEONARDO_TARIFF = ROOT / "research/supplier-files/2026-10-28-leonardo/albet-leonardo-2026-03-01.json"


def table_rows(path: str, count: int) -> list[list[str]]:
    rows = []
    for line in (ROOT / path).read_text().splitlines():
        if not line.startswith("|"):
            continue
        parts = [x.strip() for x in line.strip().strip("|").split("|")]
        if len(parts) == count:
            rows.append(parts)
    return rows


def cents(text: str) -> int:
    match = re.search(r"\d+(?:[.,]\d+)?", text.replace(" ", ""))
    if not match:
        raise ValueError(f"No amount in {text!r}")
    return int(Decimal(match.group().replace(",", ".")) * 100)


def grams(text: str) -> int | None:
    match = re.search(r"(\d+(?:[.,]\d+)?)\s*(кг|kg|г|gr|g)\b", text.lower())
    if not match:
        return None
    value = Decimal(match.group(1).replace(",", "."))
    return int(value * (1000 if match.group(2) in ("кг", "kg") else 1))


def excel_rows(path: Path) -> dict[str, dict[str, str]]:
    ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
        strings = ["".join(t.text or "" for t in item.findall(".//x:t", ns))
                   for item in root.findall("x:si", ns)]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        result = {}
        for row in sheet.findall(".//x:row", ns):
            values = {}
            for cell in row.findall("x:c", ns):
                value = cell.find("x:v", ns)
                if value is None:
                    continue
                column = re.match(r"[A-Z]+", cell.get("r", ""))
                if column:
                    values[column.group()] = strings[int(value.text)] if cell.get("t") == "s" else value.text
            if values.get("C"):
                values["row"] = row.get("r")
                result[values["C"]] = values
    return result


def site_variants() -> dict[str, dict]:
    script = """import {products} from './data.js';
console.log(JSON.stringify(products.flatMap(p => (p.variants || []).map(v => ({
  id:v.id, productId:p.id, name:p.name, brand:p.brand, pet:p.pet || v.pet,
  weight:v.weight, ean:v.ean || null, priceStatus:v.priceStatus || null
})))));"""
    text = subprocess.check_output(["node", "--input-type=module", "-e", script], cwd=ROOT, text=True)
    return {item["id"]: item for item in json.loads(text)}


def main() -> None:
    site = site_variants()
    rows = []
    albet_map = {
        "940001": ("tc-4e50c58957-reference-pack", 12),
        "940003": ("tc-0707caf730-reference-pack", 12),
        "940004": ("tc-768abf17c2-reference-pack", 12),
        "940007": ("tc-dc3d6d94c2-reference-pack", 12),
        "949577": (None, None),  # Selling format not approved.
        "931046": ("leonardo-fresh-salmon-4000g", 1),
        "931045": ("leonardo-fresh-salmon-1500g", 1),
        "931293": ("leonardo-light-1800g", 1),
        "931251": (None, 16),  # Single pouch is not on the site yet.
    }
    leo = json.loads(LEONARDO_TARIFF.read_text())["items"]
    leo_ean = {
        "931046": "4002633757227", "931045": "4002633757210",
        "931293": "4002633753816", "931251": "4002633756312",
    }
    leo_article = {}
    for code, ean in leo_ean.items():
        matches = [item for item in leo if item["ean"] == ean]
        if len(matches) != 1:
            raise ValueError(f"Leonardo source EAN {ean} for {code}: {len(matches)} matches")
        leo_article[code] = matches[0]["article"]
    for parts in table_rows("FIRST-PURCHASE.md", 8):
        code = parts[2]
        if code not in albet_map:
            continue
        variant_id, pack_factor = albet_map[code]
        if variant_id and variant_id not in site:
            raise ValueError(f"Missing storefront variant {variant_id}")
        if variant_id and pack_factor == 1 and grams(site[variant_id]["weight"]) != grams(parts[3]):
            raise ValueError(f"Albet package mismatch: {code} / {variant_id}")
        rows.append({
            "supplier": "Albet", "brand": "Churu" if code.startswith("94") else "Leonardo",
            "supplierCode": code, "name": re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", parts[1]),
            "sourceItemId": f"albet-churu-2026-11-03:{code}" if code.startswith("94")
                else f"albet-leonardo-2026-03-01:{leo_article[code]}",
            "purchaseUnit": parts[3], "purchaseQuantity": int(parts[4]),
            "unitCostCents": cents(parts[5]), "lineCostCents": cents(parts[6]),
            "retailUnitsPerPurchaseUnit": pack_factor, "ean": leo_ean.get(code) or (site.get(variant_id, {}).get("ean") if variant_id else None),
            "siteVariantId": variant_id, "source": "FIRST-PURCHASE.md; Albet live basket 2026-11-03",
        })
    albet = [item for item in rows if item["supplier"] == "Albet"]
    if len(albet) != 9 or sum(item["lineCostCents"] for item in albet) != 16164:
        raise ValueError("Albet basket no longer matches the selected 9 lines / 161.64 EUR")

    rc_tariff = {item["article"]: item for item in json.loads(RC_TARIFF.read_text())["items"]}
    for order_code, base_code, variant_id, pack_factor in [
        ("2522451", "2522403", "rc-kitten-regular-4000g", 1),
        ("2537200", "2537200", "rc-sterilised-2000g", 1),
        ("4095002", "4095002", "rc-wet-85g", 12),
        ("4058002", "4058002", "royalcanin-93e8aeca-85g", 12),
    ]:
        if variant_id not in site or base_code not in rc_tariff:
            raise ValueError(f"Royal Canin mapping missing: {order_code} / {variant_id}")
        item = rc_tariff[base_code]
        if pack_factor == 1 and grams(site[variant_id]["weight"]) != grams(item["weight"]):
            raise ValueError(f"Royal Canin package mismatch: {order_code} / {variant_id}")
        rows.append({
            "supplier": "Royal Canin", "brand": "Royal Canin", "supplierCode": order_code,
            "sourceItemId": f"royal-canin-2026-03-01:{base_code}",
            "tariffCode": base_code, "name": item["name"], "purchaseUnit": item["weight"],
            "purchaseQuantity": 1, "unitCostCents": item["shopPriceCents"],
            "lineCostCents": item["shopPriceCents"],
            "retailUnitsPerPurchaseUnit": pack_factor, "ean": item["ean"],
            "siteVariantId": variant_id, "source": "Royal Canin March 2026 tariff; FIRST-PURCHASE.md",
            "note": "Promo order code; base tariff by matching EAN" if order_code != base_code else "",
        })

    source = excel_rows(EXCEL)
    b2b = {}
    for parts in table_rows("ACANA-ORIJEN-B2B-CATALOG-2026-10-31.md", 9):
        if parts[0].isdigit():
            b2b[parts[2]] = parts
    selected = []
    for parts in table_rows("ACANA-ORIJEN-FIRST-ORDER-SELECTED-2026-11-04.md", 7):
        if parts[0] not in ("Собака", "Кошка"):
            continue
        code = parts[2]
        raw = source.get(code)
        mapped = b2b.get(code)
        if not raw or not mapped:
            raise ValueError(f"B2B code missing: {code}")
        if abs(Decimal(raw["J"]) * 100 - cents(parts[5])) > 0.5:
            raise ValueError(f"B2B tariff changed: {code}")
        # Some source cells contain the EAN as a number and lose its leading zero.
        if raw["D"].lstrip("0") != mapped[3].lstrip("0"):
            raise ValueError(f"B2B EAN mismatch: {code}")
        variant_id = None if mapped[7] == "нет" else mapped[7]
        if variant_id and variant_id not in site:
            raise ValueError(f"Storefront variant missing: {variant_id}")
        if variant_id and grams(site[variant_id]["weight"]) != grams(parts[3]):
            raise ValueError(f"ACANA / ORIJEN package mismatch: {code} / {variant_id}")
        selected.append({
            "supplier": "Champion Petfoods / Distrivet",
            "brand": "ACANA" if parts[1].startswith("ACANA") else "ORIJEN",
            "sourceItemId": f"distrivet-{'acana' if parts[1].startswith('ACANA') else 'orijen'}-2026-10-29:{code}",
            "pet": "dog" if parts[0] == "Собака" else "cat",
            "supplierCode": code, "name": parts[1], "purchaseUnit": parts[3],
            "purchaseQuantity": int(parts[4]), "unitCostCents": cents(parts[5]),
            "lineCostCents": cents(parts[6]), "retailUnitsPerPurchaseUnit": 1,
            "ean": mapped[3], "siteVariantId": variant_id,
            "source": f"Pedido_Catmandog_ACANA_ORIJEN_2026.xlsx Hoja_Pedidos row {raw['row']}",
        })
    if len(selected) != 37 or sum(x["purchaseQuantity"] for x in selected) != 42 or sum(x["lineCostCents"] for x in selected) != 125035:
        raise ValueError("ACANA / ORIJEN basket no longer matches 37 SKUs / 42 units / 1250.35 EUR")
    rows.extend(selected)
    if len(rows) != 50 or sum(bool(x["siteVariantId"]) for x in rows) != 26:
        raise ValueError("Expected 50 selected SKUs, 26 on site, 24 missing")
    OUT.write_text(json.dumps({
        "asOf": "2026-11-04", "kind": "planned_purchase_reconciliation",
        "actualPurchaseReceived": False,
        "purpose": "Selected storefront availability for the current purchasing scenario",
        "counts": {"selectedSupplierSkus": 50, "onSite": 26, "missingOnSite": 24},
        "items": rows,
    }, ensure_ascii=False, indent=2) + "\n")
    selected_by_source = {}
    matches_by_source = {}
    for item in rows:
        source_id = item["sourceItemId"]
        if source_id not in selected_by_source:
            selected_by_source[source_id] = {
                "itemId": source_id, "quantity": 0,
                "retailUnitsPerPurchaseUnit": item["retailUnitsPerPurchaseUnit"],
            }
        elif selected_by_source[source_id]["retailUnitsPerPurchaseUnit"] != item["retailUnitsPerPurchaseUnit"]:
            raise ValueError(f"Conflicting purchase unit for {source_id}")
        selected_by_source[source_id]["quantity"] += item["purchaseQuantity"]
        if item["siteVariantId"]:
            if source_id in matches_by_source and matches_by_source[source_id] != item["siteVariantId"]:
                raise ValueError(f"Conflicting storefront SKU for {source_id}")
            matches_by_source[source_id] = item["siteVariantId"]
    if len(selected_by_source) != 50:
        raise ValueError("Expected 50 unique supplier SKUs")
    SELECTION_OUT.write_text(json.dumps({"items": list(selected_by_source.values())},
                                        ensure_ascii=False, indent=2) + "\n")
    MATCHES_OUT.write_text(json.dumps({"items": [
        {"itemId": source_id, "variantId": variant_id}
        for source_id, variant_id in matches_by_source.items()
    ]}, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {OUT.relative_to(ROOT)}: 50 SKUs, 26 on site, 24 missing")


if __name__ == "__main__":
    main()
