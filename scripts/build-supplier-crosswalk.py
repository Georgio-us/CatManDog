#!/usr/bin/env python3
"""Build checked supplier-row to storefront-SKU links from local source documents."""

import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "research/supplier-files/supplier-crosswalk-upload-2026-11-04.json"


def table(path, columns):
    for line in (ROOT / path).read_text().splitlines():
        if line.startswith("|"):
            parts = [part.strip() for part in line.strip().strip("|").split("|")]
            if len(parts) == columns:
                yield parts


def site_variants():
    script = """import {products} from './data.js';
console.log(JSON.stringify(products.flatMap(p => (p.variants || []).map(v => ({
  id:v.id, name:p.name, brand:p.brand, label:v.label || v.weight, ean:v.ean || ''
})))));"""
    result = subprocess.check_output(["node", "--input-type=module", "-e", script],
                                     cwd=ROOT, text=True)
    return {item["id"]: item for item in json.loads(result)}


def main():
    variants = site_variants()
    selected = json.loads((ROOT / "research/supplier-files/launch-basket-matches-upload-2026-11-04.json").read_text())["items"]
    links = {item["itemId"]: item["variantId"] for item in selected}
    source = {}
    for brand in ("acana", "orijen"):
        snapshot = json.loads((ROOT / f"research/supplier-files/parsed-price-snapshots/distrivet-{brand}-2026-10-29.json").read_text())
        source.update({f"{snapshot['id']}:{item['article']}": item for item in snapshot["items"]})
    acana_count = 0
    for parts in table("ACANA-ORIJEN-B2B-CATALOG-2026-10-31.md", 9):
        if not parts[0].isdigit() or parts[7] == "нет" or not parts[7]:
            continue
        variant_id = parts[7]
        if variant_id not in variants:
            raise ValueError(f"Storefront variant missing: {variant_id}")
        brand = variants[variant_id]["brand"].lower()
        if brand not in ("acana", "orijen"):
            raise ValueError(f"Wrong brand for {variant_id}")
        source_id = f"distrivet-{brand}-2026-10-29:{parts[2]}"
        item = source.get(source_id)
        if not item or (item["ean"].lstrip("0") != parts[3].lstrip("0")):
            raise ValueError(f"Source EAN mismatch: {source_id}")
        if item["shopPriceCents"] is None:
            continue
        if source_id in links and links[source_id] != variant_id:
            raise ValueError(f"Conflicting SKU for {source_id}")
        links[source_id] = variant_id
        acana_count += 1
    if acana_count != 52:
        raise ValueError(f"Expected 52 priced ACANA/ORIJEN storefront matches, got {acana_count}")

    # Source document records all 88 exact Royal Canin cat SKU pairings.
    # A unique name + selling format is required; EAN alone may describe a box.
    royal_source = json.loads((ROOT / "research/supplier-files/parsed-price-snapshots/royal-canin-2026-03-01.json").read_text())
    royal_by_article = {item["article"]: item for item in royal_source["items"]}
    royal_by_name_pack = {}
    for variant in variants.values():
        if variant["brand"] == "Royal Canin":
            royal_by_name_pack.setdefault((variant["name"].casefold(), variant["label"]), []).append(variant)
    royal_count = 0
    for parts in table("ROYAL-CANIN-SKU-CROSSWALK-2026-10-31.md", 8):
        if not parts[0].startswith("Royal Canin "):
            continue
        article = parts[2].replace(" *", "")
        if article not in royal_by_article:
            continue
        matches = royal_by_name_pack.get((parts[0].casefold(), parts[1]), [])
        if len(matches) != 1:
            continue
        item = royal_by_article[article]
        if item["ean"].lstrip("0") != parts[3].lstrip("0"):
            raise ValueError(f"Royal Canin EAN mismatch: {article}")
        source_id = f"royal-canin-2026-03-01:{article}"
        variant_id = matches[0]["id"]
        if source_id in links and links[source_id] != variant_id:
            raise ValueError(f"Conflicting SKU for {source_id}")
        links[source_id] = variant_id
        royal_count += 1

    if any(variant_id not in variants for variant_id in links.values()):
        raise ValueError("Unknown storefront SKU in first purchase")
    OUT.write_text(json.dumps({"items": [{"itemId": source_id, "variantId": variant_id}
                                         for source_id, variant_id in sorted(links.items())]},
                              ensure_ascii=False, indent=2) + "\n")
    print(f"{len(links)} checked links: {acana_count} ACANA/ORIJEN, {royal_count} Royal Canin rows")


if __name__ == "__main__":
    main()
