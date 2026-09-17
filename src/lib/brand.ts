/**
 * Single source of truth for the platform identity.
 *
 * NASAQ is the product; the developer attribution is deliberately separate and
 * never folded into the product name. Arabic-facing copy uses `platform` and
 * `nameAr`, English-facing copy uses `platformEn` and `name`.
 *
 * The phone number is a personal contact detail: it is rendered only where a
 * visitor is actively looking for the owner (contact page, about page, footer,
 * contact button) — never scattered through the app chrome.
 */

export const BRAND = {
  /** Latin product name — the English-facing brand. */
  name: "NASAQ",
  /** Arabic product name — the Arabic-facing brand. */
  nameAr: "نَسَق",
  /** Primary bilingual lockup, for places that show the brand once. */
  lockup: "NASAQ | نَسَق",
  /** Arabic descriptor: the Arabic-facing product subtitle. */
  platform: "منصة التصميم والتحرير المؤسسي",
  /** English descriptor: the English-facing product subtitle. */
  platformEn: "Professional Design & Report Editor",
  /** Developer attribution, kept out of the product name. */
  owner: "فيصل سعود العنزي",
  developer: "Faisal Alenezi",
  tagline: "تصميم وتحرير التقارير والمستندات المؤسسية",
  description:
    "منصة التصميم والتحرير المؤسسي: تصميم وإخراج التقارير والمستندات الرسمية بصفحات متعددة وأغلفة وجداول ومؤشرات، مع تصدير PDF عالي الجودة بالعربية.",
} as const;

/** Local display form: what the owner hands out inside Saudi Arabia. */
export const CONTACT_PHONE_DISPLAY = "0552017111";

/** International form used in tel: and wa.me links. */
export const CONTACT_PHONE_INTL = "966552017111";

export function telHref() {
  return `tel:+${CONTACT_PHONE_INTL}`;
}

export function whatsappHref(message?: string) {
  const text = message ?? `السلام عليكم، أرغب بالاستفسار عن تصميم تقرير عبر ${BRAND.nameAr}.`;
  return `https://wa.me/${CONTACT_PHONE_INTL}?text=${encodeURIComponent(text)}`;
}

export interface NavItem {
  to: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "الرئيسية" },
  { to: "/projects", label: "المشاريع" },
  { to: "/templates", label: "القوالب" },
  { to: "/about", label: "عن المنصة" },
  { to: "/contact", label: "التواصل" },
  { to: "/account", label: "حسابي" },
];