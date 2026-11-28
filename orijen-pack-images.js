// Approved studio packshots keyed by the exact customer-facing SKU.
export const orijenPackImages = new Map([
  ["orijen-fit-trim-1800g", ["orijen-fit-trim", null]],
  ["orijen-fit-trim-340g", ["orijen-fit-trim", null]],
  ["orijen-fit-trim-5400g", ["orijen-fit-trim", null]],
  ["dog-orijen-fit-trim-2-", ["dog-orijen-fit-trim", null]],
  ["dog-orijen-fit-trim-6-", ["dog-orijen-fit-trim", null]],
  ["orijen-guardian8-1800g", ["orijen-guardian8", null]],
  ["orijen-guardian8-340g", ["orijen-guardian8", null]],
  ["orijen-guardian8-4500g", ["orijen-guardian8", null]],
  ["orijen-kitten-1800g", ["orijen-kitten", null]],
  ["orijen-kitten-340g", ["orijen-kitten", null]],
  ["orijen-original-1800g", ["orijen-original", null]],
  ["orijen-original-340g", ["orijen-original", null]],
  ["orijen-original-5400g", ["orijen-original", null]],
  ["dog-orijen-original-11-4kg", ["dog-orijen-original", "/media/acana-orijen-selected-2026-11-09/orijen-original-dog-11-4kg.webp"]],
  ["dog-orijen-original-2-", ["dog-orijen-original", null]],
  ["dog-orijen-original-6-", ["dog-orijen-original", null]],
  ["dog-orijen-puppy-2-", ["dog-orijen-puppy", null]],
  ["dog-orijen-puppy-6-", ["dog-orijen-puppy", null]],
  ["orijen-regional-red-1800g", ["orijen-regional-red", null]],
  ["orijen-regional-red-340g", ["orijen-regional-red", null]],
  ["orijen-regional-red-5400g", ["orijen-regional-red", null]],
  ["orijen-regional-red-6kg", ["cmd-source-6d56f8fb416a81c4", "/media/acana-orijen-selected-2026-11-09/orijen-regional-red-6kg.webp"]],
  ["cmd-source-sku-a4c2f1233f0ab10d", ["cmd-source-6d56f8fb416a81c4", "https://img.catmandog.es/assets/launch-studio-2026-11-04/orijen-regional-red-dog-2kg.webp"]],
  ["orijen-six-fish-1800g", ["orijen-six-fish", null]],
  ["orijen-six-fish-340g", ["orijen-six-fish", null]],
  ["orijen-six-fish-5400g", ["orijen-six-fish", null]],
  ["dog-orijen-six-fish-2-", ["dog-orijen-six-fish", null]],
  ["dog-orijen-six-fish-6-", ["dog-orijen-six-fish", null]],
  ["dog-orijen-small-breed-1-8-", ["dog-orijen-small-breed", null]],
  ["dog-orijen-small-breed-4-5-", ["dog-orijen-small-breed", null]],
]);

const studioBase = "https://img.catmandog.es/assets/orijen-studio-2026-11-28/editorial/";
export const orijenPackImageUrl = variantId =>
  `${studioBase}${variantId.replace(/-$/u, '')}-studio-v2.webp`;
