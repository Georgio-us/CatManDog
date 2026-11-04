#!/usr/bin/env python3
"""Bundle private supplier snapshots and exact crosswalk for owner-only import."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PRIVATE = ROOT / "research/supplier-files"
SNAPSHOTS = PRIVATE / "parsed-price-snapshots"
OUT = PRIVATE / "sourcing-upload-bundle-2026-11-04.json"


def read(path):
    return json.loads(path.read_text())


def main():
    source_ids = ("distrivet-acana-2026-10-29", "distrivet-orijen-2026-10-29",
                  "albet-churu-2026-11-03")
    sources = [read(SNAPSHOTS / f"{source_id}.json") for source_id in source_ids]
    matches = read(PRIVATE / "supplier-crosswalk-upload-2026-11-04.json")["items"]
    selected = read(PRIVATE / "launch-basket-selection-upload-2026-11-04.json")["items"]
    source_articles = {f"{source['id']}:{item['article']}" for source in sources
                       for item in source["items"]}
    existing_sources = {"royal-canin-2026-03-01", "albet-leonardo-2026-03-01"}
    for item in matches + selected:
        source_id = item["itemId"].split(":", 1)[0]
        if item["itemId"] not in source_articles and source_id not in existing_sources:
            raise ValueError(f"Missing supplier source row: {item['itemId']}")
    if len(selected) != 50 or len(matches) != 157:
        raise ValueError("Source selection or crosswalk count changed")
    OUT.write_text(json.dumps({"sources": sources, "matches": {"items": matches},
                               "selection": {"items": selected}}, ensure_ascii=False) + "\n")
    print(f"{OUT.relative_to(ROOT)}: {len(sources)} source files, {len(matches)} links, {len(selected)} selected SKU")


if __name__ == "__main__":
    main()
