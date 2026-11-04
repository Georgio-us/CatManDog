#!/usr/bin/env python3
"""Prepare private, unpublished storefront drafts for selected supplier rows without a SKU."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / "research/supplier-files"
REGISTRY = PRIVATE / "launch-basket-registry-2026-11-04.json"
OUTPUT = PRIVATE / "launch-supplier-drafts-upload-2026-11-04.json"


def identifier(prefix, value):
    return prefix + hashlib.sha256(value.encode()).hexdigest()[:16]


def main():
    registry = json.loads(REGISTRY.read_text())
    missing = [row for row in registry["items"] if not row["siteVariantId"]]
    if len(missing) != 24:
        raise ValueError(f"Expected 24 missing storefront SKU, got {len(missing)}")
    snapshots = {}
    for row in missing:
        source_id = row["sourceItemId"].split(":", 1)[0]
        if source_id not in snapshots:
            path = PRIVATE / "parsed-price-snapshots" / f"{source_id}.json"
            if not path.exists() and source_id == "albet-leonardo-2026-03-01":
                path = PRIVATE / "2026-10-28-leonardo" / f"{source_id}.json"
            snapshot = json.loads(path.read_text())
            snapshots[source_id] = {item["article"]: item for item in snapshot["items"]}
    drafts = []
    for row in missing:
        source_id, article = row["sourceItemId"].split(":", 1)
        source = snapshots[source_id].get(article)
        supplier_cost = source and source["shopPriceCents"] * (
            16 if row["supplierCode"] == "931251" else 1)
        if source is None or supplier_cost != row["unitCostCents"]:
            raise ValueError(f"Supplier row or cost mismatch: {row['sourceItemId']}")
        if source["ean"] and source["ean"].lstrip("0") != str(row["ean"]).lstrip("0"):
            raise ValueError(f"EAN mismatch: {row['sourceItemId']}")
        if row["brand"] == "Churu":
            name, label, pet, category, food_type = (
                "Churu Variedades Salmón y Pollo", "20 × 14 г", "cat", "Лакомства", None)
        elif row["brand"] == "Leonardo":
            name, label, pet, category, food_type = (
                "Leonardo Puro en Pollo", "85 г", "cat", "Корм", "wet")
        else:
            name, label, pet, category, food_type = (
                row["name"], row["purchaseUnit"], "dog", "Корм", "dry")
        drafts.append({
            "itemId": row["sourceItemId"],
            "productId": identifier("cmd-source-", f"{row['brand']}:{name}"),
            "variantId": identifier("cmd-source-sku-", row["sourceItemId"]),
            "name": name, "brand": row["brand"], "category": category,
            "pet": pet, "foodType": food_type, "label": label, "ean": source["ean"],
        })
    if len({row["variantId"] for row in drafts}) != 24:
        raise ValueError("Duplicate draft SKU")
    OUTPUT.write_text(json.dumps({"items": drafts}, ensure_ascii=False, indent=2) + "\n")
    print(f"{OUTPUT.relative_to(ROOT)}: {len(drafts)} hidden SKU drafts, "
          f"{len({row['productId'] for row in drafts})} products")


if __name__ == "__main__":
    main()
