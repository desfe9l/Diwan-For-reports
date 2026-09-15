/** Formats accepted by the image intake path. */
const ACCEPTED = /^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/i;

export interface PreparedImage {
  src: string;
  /** Intrinsic size in px, used to pick a sensible element box on drop. */
  width: number;
  height: number;
  /** True when the source was re-encoded rather than passed through. */
  resized: boolean;
}

export interface ImageLimits {
  /** Longest edge, in px, of the stored image. */
  maxEdge: number;
  /** Files at or below this size (bytes) are passed through untouched. */
  maxBytes: number;
}

export const IMAGE_LIMITS: ImageLimits = {
  // Report pages render at A4 print scale, so ~1600px on the long edge stays
  // sharp at 300dpi for a half-page figure while keeping stored projects small.
  maxEdge: 1600,
  maxBytes: 400_000,
};

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.test(file.type);
}

/**
 * Allow only image sources that cannot execute script.
 *
 * `src` on an image or logo element can arrive from an imported `.json` project,
 * so it is untrusted input: `javascript:` and `data:text/html` URLs must be
 * dropped rather than handed to the DOM or interpolated into an exported
 * document. Validating here, at the single point where imported data is
 * normalised, keeps the canvas and the exporter from drifting apart.
 */
export function safeImageSrc(src: unknown): string {
  const value = String(src ?? "").trim();
  if (!value) return "";
  // `data:image/<subtype>[;param=value][;base64],<payload>` — the platform's own
  // placeholder and QR artwork are URL-encoded SVG data URLs, so parameters such
  // as `;charset=UTF-8` must remain valid. Pinning the media type to `image/`
  // rejects `javascript:` and `data:text/html` sources. SVG is allowed because
  // both render paths load it through an <img>, where it cannot run script; the
  // exporter additionally escapes the value before writing it into an attribute.
  if (/^data:image\/[a-z0-9.+-]+(;[a-z0-9-]+=[a-z0-9-]+)*(;base64)?,[\s\S]*$/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^blob:/i.test(value)) return value;
  return "";
}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الصورة"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("صيغة الصورة غير مدعومة"));
    img.src = src;
  });
}

/**
 * Turn a picked/dropped file into a data URL sized for a print page.
 *
 * Projects are stored client-side, so a 12MP phone photo would otherwise become
 * a multi-megabyte base64 string inside every autosave and export. Downscaling
 * once at intake keeps storage and export bounded without the author noticing.
 * SVG and small files are passed through untouched: re-encoding vector art
 * would destroy it, and small files are already cheap.
 */
export async function prepareImage(file: File, limits: ImageLimits = IMAGE_LIMITS): Promise<PreparedImage> {
  if (!isAcceptedImage(file)) throw new Error("نوع الملف ليس صورة مدعومة");

  const raw = await readAsDataUrl(file);
  if (file.type === "image/svg+xml") {
    const img = await loadImage(raw);
    return { src: raw, width: img.naturalWidth, height: img.naturalHeight, resized: false };
  }

  const img = await loadImage(raw);
  const { naturalWidth: w, naturalHeight: h } = img;
  const longEdge = Math.max(w, h);
  const tooBig = longEdge > limits.maxEdge || file.size > limits.maxBytes;
  if (!tooBig) return { src: raw, width: w, height: h, resized: false };

  const scale = Math.min(1, limits.maxEdge / longEdge);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { src: raw, width: w, height: h, resized: false };
  // Photos are opaque; white avoids black edges if a source PNG has transparency.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, 0, 0, tw, th);
  return { src: canvas.toDataURL("image/jpeg", 0.92), width: tw, height: th, resized: true };
}

/**
 * Fit an image's box to the page: keep the aspect ratio, cap the longest edge at
 * `maxMm`, and never exceed the page.
 */
export function fitImageBox(
  image: { width: number; height: number },
  maxMm: { w: number; h: number },
): { w: number; h: number } {
  const ratio = image.width > 0 && image.height > 0 ? image.width / image.height : 1.5;
  let w = maxMm.w;
  let h = w / ratio;
  if (h > maxMm.h) {
    h = maxMm.h;
    w = h * ratio;
  }
  return { w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 };
}