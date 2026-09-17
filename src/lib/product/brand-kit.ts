import { DEFAULT_BRAND_KIT, type BrandKit } from "./product";

const STORAGE_KEY = "diwan-brand-kit-v1";

export function readBrandKit(): BrandKit {
  if (typeof localStorage === "undefined") return DEFAULT_BRAND_KIT;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<BrandKit> | null;
    return { ...DEFAULT_BRAND_KIT, ...(parsed || {}) };
  } catch {
    return DEFAULT_BRAND_KIT;
  }
}

export function saveBrandKit(kit: BrandKit): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kit));
}

export function resetBrandKit(): BrandKit {
  saveBrandKit(DEFAULT_BRAND_KIT);
  return DEFAULT_BRAND_KIT;
}
