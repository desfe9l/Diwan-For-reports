import type { CanvasEl } from "./model";
import { fitFontSize, normalizeArabic } from "./arabic";

/** Types whose font size may be auto-fitted to the element box. */
const FIT_TYPES = new Set(["text", "box", "stat", "stamp"]);

export interface PreparedText {
  /** Content after numeral/tashkeel/line-break normalisation. */
  text: string;
  /** Font size to render at, after any auto-fit. */
  fontSize: number;
  /** True when auto-fit reduced the size, so the panel can flag it. */
  overflow: boolean;
}

/**
 * Resolve an element's text for rendering: apply its Arabic options, then (when
 * the author asked for it) shrink the font until the string fits the box.
 *
 * Shared by the canvas and the HTML exporter so both derive the same string and
 * the same size — implementing it twice is how the editor and the exported PDF
 * drift apart.
 */
export function prepareText(el: CanvasEl): PreparedText {
  const s = el.style || {};
  const text = normalizeArabic(String(el.content ?? ""), {
    numerals: s.numerals,
    stripTashkeel: s.stripTashkeel,
    unwrap: !s.preserveBreaks,
    bindUnits: s.bindUnits,
    punctuation: s.arabicPunctuation,
  });
  const base = Number(s.fontSize) || 14;
  const fontSize = FIT_TYPES.has(el.type)
    ? fitFontSize(text, { w: el.w, h: el.h }, base, s.lineHeight || 1.45, s.textFit || "clip")
    : base;
  return { text, fontSize, overflow: fontSize < base - 0.05 };
}

/** Writing direction for an element's text, as a CSS value. */
export function textDirection(): "rtl" {
  return "rtl";
}