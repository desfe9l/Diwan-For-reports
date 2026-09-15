import { clamp, uid } from "@/lib/utils";

export const A4 = { w: 210, h: 297 } as const;
export const MIN_SIZE = 4;
export const GRID = 5;
export const STORE_KEY = "diwan-report-project-v2";
export const UI_KEY = "diwan-report-ui-v2";

export type ElType =
  | "text"
  | "box"
  | "table"
  | "shape"
  | "line"
  | "divider"
  | "image"
  | "logo"
  | "icon"
  | "stamp"
  | "qr"
  | "stat";

export type ThemeId = "official" | "eid" | "ministry" | "slate" | "sand";
export type PackId = "official" | "eid" | "briefing" | "blank";

export interface ElStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  color?: string;
  background?: string;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  textAlign?: "right" | "center" | "left" | "justify";
  lineHeight?: number;
  textShadow?: string;
  objectFit?: "cover" | "contain" | "fill";
  objectX?: number;
  objectY?: number;
  stroke?: number;
  shape?: "rect" | "circle" | "rounded";
  cols?: number;
  rows?: number;
  headerBg?: string;
  headerColor?: string;
  tableBg?: string;
  padding?: number;
  shadow?: string;
  icon?: string;
}

export interface CanvasEl {
  id: string;
  type: ElType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  opacity: number;
  z: number;
  locked?: boolean;
  hidden?: boolean;
  content?: string;
  src?: string;
  icon?: string;
  style: ElStyle;
}

export interface Page {
  id: string;
  name: string;
  bg?: string;
  elements: CanvasEl[];
}

export interface Project {
  version: number;
  name: string;
  theme: ThemeId;
  orgName: string;
  pages: Page[];
}

export interface Theme {
  id: ThemeId;
  name: string;
  desc: string;
  primary: string;
  primarySoft: string;
  accent: string;
  paper: string;
  ink: string;
  muted: string;
  line: string;
  surface: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  official: {
    id: "official",
    name: "رسمي كحلي",
    desc: "وثائق حكومية وتقارير أداء",
    primary: "#071d3d",
    primarySoft: "#102d57",
    accent: "#c6a05a",
    paper: "#ffffff",
    ink: "#172033",
    muted: "#697184",
    line: "#d9dee8",
    surface: "#f7f8fb",
  },
  eid: {
    id: "eid",
    name: "عيد أخضر",
    desc: "فعاليات ومناسبات رسمية",
    primary: "#0c3d2c",
    primarySoft: "#145c42",
    accent: "#d4af37",
    paper: "#ffffff",
    ink: "#1a2e24",
    muted: "#5d7268",
    line: "#d7e3dc",
    surface: "#f3f7f4",
  },
  ministry: {
    id: "ministry",
    name: "وزاري",
    desc: "تقارير وزارية هادئة",
    primary: "#12344d",
    primarySoft: "#1b4b6b",
    accent: "#b08a4f",
    paper: "#ffffff",
    ink: "#1c2730",
    muted: "#667887",
    line: "#d5dde4",
    surface: "#f5f7f9",
  },
  slate: {
    id: "slate",
    name: "رمادي حديث",
    desc: "عرض تنفيذي معاصر",
    primary: "#1f2937",
    primarySoft: "#334155",
    accent: "#3b82c4",
    paper: "#ffffff",
    ink: "#111827",
    muted: "#64748b",
    line: "#e2e8f0",
    surface: "#f8fafc",
  },
  sand: {
    id: "sand",
    name: "رملي دافئ",
    desc: "تقارير ثقافية وإعلامية",
    primary: "#3f2e1f",
    primarySoft: "#5c4330",
    accent: "#c4a574",
    paper: "#fffdf8",
    ink: "#2a2118",
    muted: "#7a6a58",
    line: "#e6dccb",
    surface: "#faf6ee",
  },
};

export const FONTS = [
  "Tajawal",
  "Cairo",
  "IBM Plex Sans Arabic",
  "Noto Sans Arabic",
  "Noto Naskh Arabic",
  "Noto Kufi Arabic",
  "Amiri",
  "Reem Kufi",
];

export const ICONS: Record<string, string> = {
  star: "M12 3 14.8 9l6.2.7-4.6 4.2 1.2 6.1L12 16.8 6.4 20l1.2-6.1L3 9.7 9.2 9 12 3Z",
  check: "M5 13.2 9.2 17.5 19 7",
  shield: "M12 3 5 6v6c0 4.2 2.8 7.8 7 9 4.2-1.2 7-4.8 7-9V6l-7-3Z",
  award: "M8 11a4 4 0 1 0 8 0 4 4 0 0 0-8 0M9.2 14.2 8 21l4-2 4 2-1.2-6.8",
  building: "M5 21V5h14v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 21v-4h6v4",
  chart: "M4 19h16M7 16v-5M12 16V8M17 16v-8",
  flag: "M5 21V4h10l-1.5 4L15 12H5",
  users: "M16 19v-1.4A3.6 3.6 0 0 0 12.4 14H7.6A3.6 3.6 0 0 0 4 17.6V19M14.5 7.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 19v-1.2A3.2 3.2 0 0 0 17.4 14.8M19 8.2a2.4 2.4 0 0 1 0 4.4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01",
  leaf: "M5 19c8-1 13-8 14-16-8 1-14 7-14 16ZM5 19c3-4 8-7 14-8",
};

export const TYPE_NAME: Record<ElType, string> = {
  text: "نص",
  box: "مربع محتوى",
  table: "جدول",
  shape: "شكل",
  line: "خط زخرفي",
  divider: "فاصل",
  image: "صورة",
  logo: "شعار",
  icon: "أيقونة",
  stamp: "ختم",
  qr: "رمز QR",
  stat: "مؤشر",
};

export function placeholderImage(kind: "logo" | "image") {
  const title = kind === "logo" ? "LOGO" : "IMAGE";
  const bg = kind === "logo" ? "#ffffff" : "#f4f6fa";
  const stroke = kind === "logo" ? "#c6a05a" : "#d9dee8";
  const text = kind === "logo" ? "#071d3d" : "#697184";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="${bg}"/><rect x="30" y="30" width="740" height="460" rx="26" fill="none" stroke="${stroke}" stroke-width="10"/><path d="M180 350 310 220l92 105 72-70 146 155H160Z" fill="${stroke}" opacity=".45"/><circle cx="275" cy="162" r="42" fill="${stroke}" opacity=".55"/><text x="400" y="450" text-anchor="middle" font-family="Arial" font-size="54" font-weight="700" fill="${text}">${title}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function defaultTable(cols: number, rows: number) {
  const data: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(r === 0 ? `عنوان ${c + 1}` : `قيمة ${r}×${c + 1}`);
    }
    data.push(row);
  }
  return JSON.stringify(data);
}

export function parseTable(content: string | undefined, cols = 3, rows = 4): string[][] {
  try {
    const parsed = JSON.parse(content || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((row: unknown) =>
        Array.isArray(row) ? row.map((c) => String(c ?? "")) : [String(row)],
      );
    }
  } catch {
    /* fall through */
  }
  return JSON.parse(defaultTable(cols, rows)) as string[][];
}

export function createElement(type: ElType, over: Partial<CanvasEl> = {}, theme?: Theme): CanvasEl {
  const t = theme || THEMES.official;
  const defaults: Record<ElType, Partial<CanvasEl>> = {
    text: {
      w: 90,
      h: 18,
      content: "نص جديد",
      style: {
        fontFamily: "Tajawal",
        fontSize: 16,
        color: t.ink,
        fontWeight: 600,
        textAlign: "right",
        lineHeight: 1.45,
      },
    },
    box: {
      w: 92,
      h: 36,
      content: "محتوى المربع — يمكن تعديل النص والمحاذاة والخلفية من لوحة الخصائص.",
      style: {
        fontFamily: "Cairo",
        fontSize: 12,
        color: t.ink,
        fill: t.surface,
        borderColor: t.line,
        borderWidth: 0.35,
        radius: 4,
        fontWeight: 500,
        textAlign: "right",
        lineHeight: 1.7,
        padding: 4,
      },
    },
    table: {
      w: 154,
      h: 52,
      style: {
        cols: 3,
        rows: 4,
        fontSize: 11,
        fontFamily: "Cairo",
        headerBg: t.primary,
        headerColor: "#ffffff",
        tableBg: "#ffffff",
        borderColor: t.line,
        color: t.ink,
      },
    },
    shape: {
      w: 48,
      h: 28,
      style: { fill: t.primary, borderColor: t.primary, borderWidth: 0, radius: 0, shape: "rect" },
    },
    line: {
      w: 120,
      h: 4,
      style: { color: t.accent, stroke: 0.8 },
    },
    divider: {
      w: 140,
      h: 8,
      style: { color: t.accent, stroke: 0.6 },
    },
    image: {
      w: 72,
      h: 48,
      src: placeholderImage("image"),
      style: { objectFit: "cover", radius: 2 },
    },
    logo: {
      w: 28,
      h: 28,
      src: placeholderImage("logo"),
      style: { objectFit: "contain" },
    },
    icon: {
      w: 16,
      h: 16,
      icon: "star",
      style: { color: t.accent, stroke: 1.8 },
    },
    stamp: {
      w: 40,
      h: 40,
      content: "معتمد",
      style: {
        color: t.accent,
        borderColor: t.accent,
        fontFamily: "Amiri",
        fontSize: 13,
        fontWeight: 700,
        textAlign: "center",
      },
    },
    qr: {
      w: 28,
      h: 28,
      content: "https://",
      style: { fill: "#ffffff", color: t.primary },
    },
    stat: {
      w: 72,
      h: 36,
      content: "92%\nنسبة الإنجاز",
      style: {
        fontFamily: "Tajawal",
        fontSize: 22,
        color: t.primary,
        fill: "#ffffff",
        borderColor: t.accent,
        borderWidth: 0.45,
        radius: 4,
        fontWeight: 800,
        textAlign: "center",
        lineHeight: 1.3,
      },
    },
  };

  const d = defaults[type] || {};
  const el: CanvasEl = {
    id: uid("el"),
    type,
    name: over.name || TYPE_NAME[type],
    x: 28,
    y: 40,
    w: d.w || 40,
    h: d.h || 20,
    rotation: 0,
    opacity: 1,
    z: 1,
    style: {},
    ...d,
    ...over,
  };
  el.style = { ...(d.style || {}), ...(over.style || {}) };
  if (type === "table" && !el.content) el.content = defaultTable(el.style.cols || 3, el.style.rows || 4);
  return el;
}

export function constrainElement(el: CanvasEl) {
  el.w = clamp(Number(el.w) || MIN_SIZE, MIN_SIZE, A4.w);
  el.h = clamp(Number(el.h) || MIN_SIZE, MIN_SIZE, A4.h);
  el.x = clamp(Number(el.x) || 0, 0, A4.w - el.w);
  el.y = clamp(Number(el.y) || 0, 0, A4.h - el.h);
  el.opacity = clamp(Number(el.opacity) ?? 1, 0, 1);
  el.rotation = Number(el.rotation) || 0;
}

export function normalizeZ(page: Page) {
  page.elements
    .sort((a, b) => (a.z || 0) - (b.z || 0))
    .forEach((el, i) => {
      el.z = i + 1;
    });
}

export function nextZ(page: Page) {
  return Math.max(0, ...page.elements.map((e) => e.z || 0)) + 1;
}

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function cssFont(font?: string) {
  return `"${String(font || "Tajawal").replace(/"/g, "")}", "Cairo", sans-serif`;
}
