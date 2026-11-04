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
                  "albet-churu-2026-11-03", "royal-canin-2026-03-01")
    sources = [read(SNAPSHOTS / f"{source_id}.json") for source_id in source_ids]
    sources.append(read(PRIVATE / "2026-10-28-leonardo/albet-leonardo-2026-03-01.json"))
    matches = read(PRIVATE / "supplier-crosswalk-upload-2026-11-04.json")["items"]
    selected = read(PRIVATE / "launch-basket-selection-upload-2026-11-04.json")["items"]
    drafts = read(PRIVATE / "launch-supplier-drafts-upload-2026-11-04.json")["items"]
    source_articles = {f"{source['id']}:{item['article']}" for source in sources
                       for item in source["items"]}
    for item in matches + selected:
        if item["itemId"] not in source_articles:
            raise ValueError(f"Missing supplier source row: {item['itemId']}")
    if len(selected) != 50 or len(matches) != 158 or len(drafts) != 23:
        raise ValueError("Source selection or crosswalk count changed")
    if len({item["itemId"] for item in drafts}) != 23 or \
            {item["itemId"] for item in drafts} & {item["itemId"] for item in matches} or \
            not {item["itemId"] for item in drafts} <= {item["itemId"] for item in selected}:
        raise ValueError("Drafts must be selected source rows without an existing storefront link")
    OUT.write_text(json.dumps({"sources": sources, "matches": {"items": matches},
                               "drafts": {"items": drafts}, "selection": {"items": selected}}, ensure_ascii=False) + "\n")
    print(f"{OUT.relative_to(ROOT)}: {len(sources)} source files, {len(matches)} existing links, "
          f"{len(drafts)} drafts, {len(selected)} selected SKU")


if __name__ == "__main__":
    main()
