import { uid } from "@/lib/utils";
import {
  type CanvasEl,
  type PackId,
  type Page,
  type Project,
  type Theme,
  type ThemeId,
  THEMES,
  createElement,
  nextZ,
  normalizeZ,
} from "./model";

function page(name: string, theme: Theme, build: (add: Add) => void): Page {
  const p: Page = { id: uid("page"), name, bg: theme.paper, elements: [] };
  const add: Add = (type, over = {}) => {
    const el = createElement(type, over, theme);
    el.z = nextZ(p);
    p.elements.push(el);
    return el;
  };
  build(add);
  normalizeZ(p);
  return p;
}

type Add = (type: CanvasEl["type"], over?: Partial<CanvasEl>) => CanvasEl;

function header(add: Add, theme: Theme, title: string) {
  add("shape", {
    name: "رأس الصفحة",
    x: 0,
    y: 0,
    w: 210,
    h: 24,
    style: { fill: theme.primary, borderWidth: 0, radius: 0 },
  });
  add("line", {
    name: "خط ذهبي",
    x: 0,
    y: 24.5,
    w: 210,
    h: 3,
    style: { color: theme.accent, stroke: 0.7 },
  });
  add("text", {
    name: "عنوان الصفحة",
    x: 22,
    y: 6,
    w: 140,
    h: 12,
    content: title,
    style: {
      fontFamily: "Tajawal",
      fontSize: 16,
      color: "#ffffff",
      fontWeight: 800,
      textAlign: "right",
      lineHeight: 1,
    },
  });
  add("logo", { name: "شعار مصغر", x: 176, y: 4, w: 16, h: 16 });
}

function footer(add: Add, theme: Theme, org: string) {
  add("line", {
    name: "خط سفلي",
    x: 24,
    y: 276,
    w: 162,
    h: 3,
    style: { color: theme.line, stroke: 0.35 },
  });
  add("text", {
    name: "تذييل",
    x: 24,
    y: 281,
    w: 162,
    h: 8,
    content: `${org}  ·  وثيقة رسمية`,
    style: {
      fontFamily: "Cairo",
      fontSize: 8,
      color: theme.muted,
      fontWeight: 600,
      textAlign: "center",
      lineHeight: 1.2,
    },
  });
}

function officialPages(theme: Theme, org: string): Page[] {
  return [
    page("الغلاف", theme, (add) => {
      add("shape", {
        name: "الشريط الجانبي",
        x: 0,
        y: 0,
        w: 26,
        h: 297,
        style: { fill: theme.primary, borderWidth: 0 },
      });
      add("line", {
        name: "خط ذهبي رأسي",
        x: 29,
        y: 18,
        w: 1.4,
        h: 252,
        style: { color: theme.accent, stroke: 1.2 },
      });
      add("logo", { name: "شعار الجهة", x: 154, y: 18, w: 32, h: 32 });
      add("text", {
        name: "تصنيف",
        x: 40,
        y: 64,
        w: 140,
        h: 8,
        content: "تقرير رسمي  ·  سري للاستخدام الداخلي",
        style: {
          fontFamily: "Cairo",
          fontSize: 10,
          color: theme.muted,
          fontWeight: 600,
          textAlign: "right",
        },
      });
      add("text", {
        name: "عنوان التقرير",
        x: 40,
        y: 80,
        w: 146,
        h: 40,
        content: "تقرير الأداء السنوي\nللجهة التنفيذية",
        style: {
          fontFamily: "Tajawal",
          fontSize: 28,
          color: theme.primary,
          fontWeight: 800,
          textAlign: "right",
          lineHeight: 1.2,
        },
      });
      add("box", {
        name: "نبذة الغلاف",
        x: 40,
        y: 132,
        w: 132,
        h: 44,
        content:
          "ملخص تنفيذي موجز يعرض نطاق التقرير، أبرز النتائج، والمؤشرات الرئيسية، مع توصيات قابلة للتنفيذ خلال الدورة القادمة.",
        style: {
          fontFamily: "Cairo",
          fontSize: 12,
          color: theme.ink,
          fill: theme.surface,
          borderColor: theme.line,
          borderWidth: 0.35,
          radius: 4,
          fontWeight: 500,
          textAlign: "right",
          lineHeight: 1.7,
          padding: 4,
        },
      });
      add("text", {
        name: "الجهة",
        x: 40,
        y: 188,
        w: 130,
        h: 10,
        content: org,
        style: {
          fontFamily: "IBM Plex Sans Arabic",
          fontSize: 12,
          color: theme.primary,
          fontWeight: 700,
          textAlign: "right",
        },
      });
      add("text", {
        name: "التاريخ",
        x: 40,
        y: 236,
        w: 90,
        h: 10,
        content: "سبتمبر 2026  ·  محرم 1448 هـ",
        style: {
          fontFamily: "IBM Plex Sans Arabic",
          fontSize: 11,
          color: theme.muted,
          fontWeight: 600,
          textAlign: "right",
        },
      });
      add("stamp", {
        name: "ختم رسمي",
        x: 142,
        y: 216,
        w: 40,
        h: 40,
        content: "رسمي",
      });
    }),
    page("المحتويات", theme, (add) => {
      header(add, theme, "المحتويات");
      [
        ["المقدمة والنطاق", "03"],
        ["الأهداف الاستراتيجية", "04"],
        ["الإنجازات الرئيسية", "05"],
        ["المؤشرات والإحصائيات", "06"],
        ["التوصيات", "07"],
        ["الخاتمة", "08"],
      ].forEach(([item, num], i) => {
        add("text", {
          name: `بند ${i + 1}`,
          x: 28,
          y: 48 + i * 22,
          w: 154,
          h: 12,
          content: `${item}  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ${num}`,
          style: {
            fontFamily: "Cairo",
            fontSize: 13,
            color: theme.ink,
            fontWeight: 600,
            textAlign: "right",
            lineHeight: 1.2,
          },
        });
      });
      footer(add, theme, org);
    }),
    page("ملخص تنفيذي", theme, (add) => {
      header(add, theme, "ملخص تنفيذي");
      add("text", {
        name: "عنوان فقرة",
        x: 24,
        y: 38,
        w: 162,
        h: 12,
        content: "نظرة عامة",
        style: {
          fontFamily: "Tajawal",
          fontSize: 18,
          color: theme.primary,
          fontWeight: 800,
          textAlign: "right",
        },
      });
      add("box", {
        name: "فقرة رئيسية",
        x: 24,
        y: 54,
        w: 162,
        h: 78,
        content:
          "يستعرض هذا القسم المعلومات الأساسية للتقرير بلغة واضحة ومنظمة. يمكن تعديل النص، الخط، اللون، التباعد، والمحاذاة من لوحة الخصائص بدقة كاملة. يُبرز الملخص أهم النتائج والتوصيات ليكون قابلاً للعرض أمام القيادة دون الحاجة إلى قراءة الوثيقة كاملة.",
        style: {
          fontFamily: "Cairo",
          fontSize: 12.5,
          color: theme.ink,
          fill: "#ffffff",
          borderColor: theme.line,
          borderWidth: 0.35,
          radius: 4,
          fontWeight: 500,
          textAlign: "right",
          lineHeight: 1.85,
          padding: 5,
        },
      });
      add("divider", { x: 36, y: 142, w: 138, h: 8 });
      add("table", {
        name: "جدول ملخص",
        x: 24,
        y: 158,
        w: 162,
        h: 72,
        content: JSON.stringify([
          ["المحور", "المستهدف", "المتحقق"],
          ["التشغيل", "100%", "94%"],
          ["الرضا", "4.5", "4.7"],
          ["المبادرات", "20", "18"],
        ]),
        style: {
          cols: 3,
          rows: 4,
          fontSize: 11,
          fontFamily: "Cairo",
          headerBg: theme.primary,
          headerColor: "#ffffff",
          tableBg: "#ffffff",
          borderColor: theme.line,
        },
      });
      footer(add, theme, org);
    }),
    page("الإنجازات", theme, (add) => {
      header(add, theme, "الإنجازات");
      for (let i = 0; i < 4; i++) {
        add("box", {
          name: `بطاقة إنجاز ${i + 1}`,
          x: 24,
          y: 40 + i * 50,
          w: 162,
          h: 42,
          content: `إنجاز رقم ${i + 1}\nوصف مختصر للأثر والنتيجة المتحققة خلال الفترة، مع الإشارة إلى الجهة المنفذة والمؤشر المرتبط.`,
          style: {
            fontFamily: "Cairo",
            fontSize: 12,
            color: theme.ink,
            fill: theme.surface,
            borderColor: theme.line,
            borderWidth: 0.35,
            radius: 4,
            fontWeight: 600,
            textAlign: "right",
            lineHeight: 1.55,
            padding: 4,
          },
        });
        add("icon", {
          name: `أيقونة ${i + 1}`,
          icon: "check",
          x: 168,
          y: 48 + i * 50,
          w: 12,
          h: 12,
          style: { color: "#087f5b", stroke: 2 },
        });
      }
      footer(add, theme, org);
    }),
    page("المؤشرات", theme, (add) => {
      header(add, theme, "المؤشرات والإحصائيات");
      const stats: [string, string][] = [
        ["94%", "نسبة الإنجاز"],
        ["18", "مبادرة مكتملة"],
        ["4.7", "متوسط الرضا"],
        ["12", "شراكة فاعلة"],
      ];
      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        add("stat", {
          name: `مؤشر ${i + 1}`,
          x: 24 + col * 84,
          y: 42 + row * 52,
          w: 76,
          h: 42,
          content: `${stat[0]}\n${stat[1]}`,
        });
      });
      add("shape", {
        name: "خلفية الرسم",
        x: 24,
        y: 152,
        w: 162,
        h: 88,
        style: { fill: theme.surface, borderColor: theme.line, borderWidth: 0.35, radius: 4 },
      });
      [42, 58, 70, 84, 96].forEach((height, i) => {
        add("shape", {
          name: `عمود ${i + 1}`,
          x: 42 + i * 28,
          y: 228 - height * 0.7,
          w: 14,
          h: height * 0.7,
          style: {
            fill: i === 4 ? theme.accent : theme.primary,
            borderWidth: 0,
            radius: 2,
          },
        });
      });
      footer(add, theme, org);
    }),
    page("الخاتمة", theme, (add) => {
      header(add, theme, "الخاتمة والتوصيات");
      add("box", {
        name: "خلاصة",
        x: 24,
        y: 44,
        w: 162,
        h: 70,
        content:
          "تؤكد نتائج التقرير أهمية الاستمرار في تنفيذ المبادرات وفق منهجية واضحة، مع قياس مستمر للأثر وتحسين دوري للعمليات. نوصي بتعزيز التكامل بين الوحدات وتوثيق الدروس المستفادة للعام القادم.",
        style: {
          fontFamily: "Cairo",
          fontSize: 13,
          color: theme.ink,
          fill: "#ffffff",
          borderColor: theme.line,
          borderWidth: 0.35,
          radius: 4,
          fontWeight: 500,
          textAlign: "right",
          lineHeight: 1.8,
          padding: 5,
        },
      });
      add("stamp", { x: 140, y: 132, w: 42, h: 42, content: "خُتم" });
      add("line", { x: 28, y: 168, w: 78, h: 4, style: { color: theme.ink, stroke: 0.4 } });
      add("text", {
        name: "توقيع",
        x: 28,
        y: 174,
        w: 78,
        h: 16,
        content: "اسم المسؤول\nالمنصب",
        style: {
          fontFamily: "Cairo",
          fontSize: 11,
          color: theme.ink,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.45,
        },
      });
      footer(add, theme, org);
    }),
  ];
}

function eidPages(theme: Theme, org: string): Page[] {
  return [
    page("غلاف العيد", theme, (add) => {
      add("shape", {
        name: "خلفية الغلاف",
        x: 0,
        y: 0,
        w: 210,
        h: 297,
        style: { fill: theme.primary, borderWidth: 0 },
      });
      add("shape", {
        name: "شريط ذهبي",
        x: 0,
        y: 0,
        w: 210,
        h: 6,
        style: { fill: theme.accent, borderWidth: 0 },
      });
      add("logo", { name: "شعار", x: 16, y: 16, w: 28, h: 16 });
      add("logo", { name: "شعار وطني", x: 166, y: 16, w: 28, h: 16 });
      add("text", {
        name: "عنوان علوي",
        x: 24,
        y: 48,
        w: 162,
        h: 10,
        content: org,
        style: {
          fontFamily: "Tajawal",
          fontSize: 13,
          color: theme.accent,
          fontWeight: 700,
          textAlign: "center",
        },
      });
      add("text", {
        name: "عنوان التقرير",
        x: 18,
        y: 72,
        w: 174,
        h: 36,
        content: "مجهودات فعاليات\nعيد الأضحى المبارك",
        style: {
          fontFamily: "Amiri",
          fontSize: 28,
          color: "#ffffff",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.35,
        },
      });
      add("text", {
        name: "السنة",
        x: 24,
        y: 112,
        w: 162,
        h: 10,
        content: "١٤٤٧ هـ",
        style: {
          fontFamily: "Amiri",
          fontSize: 16,
          color: theme.accent,
          fontWeight: 700,
          textAlign: "center",
        },
      });
      add("image", {
        name: "صورة الغلاف",
        x: 18,
        y: 132,
        w: 174,
        h: 96,
        style: { objectFit: "cover", radius: 3 },
      });
      add("text", {
        name: "جهة الإصدار",
        x: 24,
        y: 244,
        w: 162,
        h: 16,
        content: "إدارة الإعلام والاتصال المؤسسي",
        style: {
          fontFamily: "Cairo",
          fontSize: 12,
          color: "#ffffff",
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.4,
        },
      });
      add("shape", {
        name: "شريط سفلي",
        x: 0,
        y: 291,
        w: 210,
        h: 6,
        style: { fill: theme.accent, borderWidth: 0 },
      });
    }),
    page("المؤشرات الميدانية", theme, (add) => {
      header(add, theme, "المؤشرات الميدانية");
      const stats: [string, string][] = [
        ["48", "موقعاً ميدانياً"],
        ["120", "مشاركة توعوية"],
        ["16", "فرقاً ميدانية"],
        ["100%", "تغطية المنافذ"],
      ];
      stats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        add("stat", {
          x: 24 + col * 84,
          y: 42 + row * 52,
          w: 76,
          h: 42,
          content: `${stat[0]}\n${stat[1]}`,
        });
      });
      add("box", {
        x: 24,
        y: 154,
        w: 162,
        h: 86,
        content:
          "شملت الفعاليات تعزيز الحضور الميداني، وتنظيم الحركة، وبرامج التوعية للقادمين والمغادرين، مع توثيق بصري لكافة المحطات. يمكن استبدال هذا النص بتفاصيل الجهة وإرفاق الصور في الصفحة التالية.",
        style: {
          fontFamily: "Cairo",
          fontSize: 13,
          color: theme.ink,
          fill: theme.surface,
          borderColor: theme.line,
          borderWidth: 0.35,
          radius: 4,
          padding: 5,
          textAlign: "right",
          lineHeight: 1.75,
          fontWeight: 500,
        },
      });
      footer(add, theme, org);
    }),
    page("معرض الصور", theme, (add) => {
      header(add, theme, "التوثيق البصري");
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        add("image", {
          name: `صورة ${i + 1}`,
          x: 22 + col * 86,
          y: 40 + row * 100,
          w: 80,
          h: 72,
          style: { objectFit: "cover", radius: 3 },
        });
        add("text", {
          name: `تعليق ${i + 1}`,
          x: 22 + col * 86,
          y: 114 + row * 100,
          w: 80,
          h: 8,
          content: "تعليق مختصر للصورة",
          style: {
            fontFamily: "Cairo",
            fontSize: 9,
            color: theme.muted,
            fontWeight: 600,
            textAlign: "center",
          },
        });
      }
      footer(add, theme, org);
    }),
    page("ختام", theme, (add) => {
      add("shape", {
        x: 0,
        y: 0,
        w: 210,
        h: 297,
        style: { fill: theme.primary, borderWidth: 0 },
      });
      add("logo", { x: 88, y: 52, w: 34, h: 34 });
      add("text", {
        x: 24,
        y: 104,
        w: 162,
        h: 22,
        content: "شكراً لكم",
        style: {
          fontFamily: "Amiri",
          fontSize: 32,
          color: "#ffffff",
          fontWeight: 700,
          textAlign: "center",
        },
      });
      add("divider", { x: 70, y: 132, w: 70, h: 8, style: { color: theme.accent } });
      add("text", {
        x: 30,
        y: 148,
        w: 150,
        h: 28,
        content: "نقدر جهود الفرق الميدانية والإسناد الإعلامي، ونتطلع إلى مواصلة العمل بروح الفريق.",
        style: {
          fontFamily: "Cairo",
          fontSize: 13,
          color: "#e8efe9",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: 1.7,
        },
      });
      add("text", {
        x: 24,
        y: 220,
        w: 162,
        h: 20,
        content: `${org}\nإدارة الإعلام والاتصال المؤسسي`,
        style: {
          fontFamily: "Tajawal",
          fontSize: 13,
          color: theme.accent,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.5,
        },
      });
    }),
  ];
}

function briefingPages(theme: Theme, org: string): Page[] {
  return [
    page("غلاف العرض", theme, (add) => {
      add("shape", {
        x: 0,
        y: 0,
        w: 210,
        h: 297,
        style: { fill: theme.primary, borderWidth: 0 },
      });
      add("shape", {
        x: 0,
        y: 210,
        w: 210,
        h: 87,
        style: { fill: theme.primarySoft, borderWidth: 0 },
      });
      add("line", {
        x: 28,
        y: 198,
        w: 40,
        h: 4,
        style: { color: theme.accent, stroke: 1.4 },
      });
      add("logo", { x: 28, y: 28, w: 28, h: 28 });
      add("text", {
        x: 28,
        y: 88,
        w: 154,
        h: 40,
        content: "عرض موجز\nللقيادة",
        style: {
          fontFamily: "Tajawal",
          fontSize: 32,
          color: "#ffffff",
          fontWeight: 800,
          textAlign: "right",
          lineHeight: 1.2,
        },
      });
      add("text", {
        x: 28,
        y: 228,
        w: 154,
        h: 20,
        content: `${org}\nسبتمبر 2026`,
        style: {
          fontFamily: "Cairo",
          fontSize: 13,
          color: "#ffffff",
          fontWeight: 600,
          textAlign: "right",
          lineHeight: 1.5,
        },
      });
    }),
    ...officialPages(theme, org).slice(4, 6),
  ];
}

export const PACKS: { id: PackId; title: string; desc: string; pages: string }[] = [
  { id: "official", title: "تقرير رسمي متكامل", desc: "غلاف، محتويات، ملخص، إنجازات، مؤشرات، خاتمة", pages: "6 صفحات" },
  { id: "eid", title: "تقرير فعالية ومناسبة", desc: "غلاف احتفالي، مؤشرات، معرض صور، ختام", pages: "4 صفحات" },
  { id: "briefing", title: "عرض قيادي موجز", desc: "غلاف عرض مع مؤشرات وخاتمة", pages: "3 صفحات" },
  { id: "blank", title: "مستند فارغ A4", desc: "صفحة بيضاء مع رأس وتذييل خفيف", pages: "1 صفحة" },
];

export function createProject(pack: PackId, themeId: ThemeId = "official", orgName = "الجهة الرسمية"): Project {
  const theme = THEMES[pack === "eid" ? (themeId === "official" ? "eid" : themeId) : themeId];
  const pages =
    pack === "official"
      ? officialPages(theme, orgName)
      : pack === "eid"
        ? eidPages(THEMES.eid, orgName)
        : pack === "briefing"
          ? briefingPages(theme, orgName)
          : [
              page("صفحة 1", theme, (add) => {
                header(add, theme, "مستند جديد");
                footer(add, theme, orgName);
              }),
            ];

  return {
    version: 2,
    name:
      pack === "eid"
        ? "تقرير فعالية"
        : pack === "briefing"
          ? "عرض قيادي"
          : pack === "blank"
            ? "مستند جديد"
            : "تقرير رسمي",
    theme: pack === "eid" ? "eid" : themeId,
    orgName,
    pages,
  };
}

export function createTemplatePage(id: string, theme: Theme, org: string): Page {
  const pack = officialPages(theme, org);
  const map: Record<string, number> = {
    cover: 0,
    contents: 1,
    text: 2,
    achievements: 3,
    stats: 4,
    closing: 5,
  };
  if (id === "images") {
    return eidPages(theme, org)[2];
  }
  if (id === "thanks") {
    return eidPages(theme, org)[3];
  }
  const idx = map[id] ?? 0;
  const src = pack[idx];
  return { ...src, id: uid("page"), elements: src.elements.map((e) => ({ ...e, id: uid("el") })) };
}

export const PAGE_TEMPLATES = [
  { id: "cover", title: "غلاف رسمي", desc: "شريط كحلي وشعار وعنوان" },
  { id: "contents", title: "محتويات", desc: "فهرس بنود مرقم" },
  { id: "text", title: "صفحة نصية", desc: "عنوان وفقرة وجدول" },
  { id: "images", title: "معرض صور", desc: "أربع صور مع تعليق" },
  { id: "achievements", title: "إنجازات", desc: "بطاقات أثر" },
  { id: "stats", title: "مؤشرات", desc: "أرقام ورسم أعمدة" },
  { id: "thanks", title: "شكر وختام", desc: "صفحة ختامية هادئة" },
  { id: "closing", title: "توقيع وختم", desc: "خلاصة وتوقيع" },
];
