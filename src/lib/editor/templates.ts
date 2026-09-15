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

function page(name: string, theme: Theme, build: (add: Add) => void, size?: { w: number; h: number }): Page {
  const p: Page = {
    id: uid("page"),
    name,
    bg: theme.paper,
    w: size?.w,
    h: size?.h,
    elements: [],
  };
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

function header(add: Add, theme: Theme, title: string, w = 210) {
  add("shape", {
    name: "رأس الصفحة",
    x: 0,
    y: 0,
    w,
    h: 24,
    style: { fill: theme.primary, borderWidth: 0, radius: 0 },
  });
  add("line", {
    name: "خط ذهبي",
    x: 0,
    y: 24.5,
    w,
    h: 3,
    style: { color: theme.accent, stroke: 0.7 },
  });
  add("text", {
    name: "عنوان الصفحة",
    x: 22,
    y: 6,
    w: w - 70,
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
  add("logo", { name: "شعار مصغر", x: w - 34, y: 4, w: 16, h: 16 });
}

function footer(add: Add, theme: Theme, org: string, w = 210, h = 297) {
  add("line", {
    name: "خط سفلي",
    x: 24,
    y: h - 21,
    w: w - 48,
    h: 3,
    style: { color: theme.line, stroke: 0.35 },
  });
  add("text", {
    name: "تذييل",
    x: 24,
    y: h - 16,
    w: w - 48,
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

/**
 * Standalone builders reused by the page-template gallery. Each returns a fresh
 * page (new ids), so inserting one never touches the template source.
 */
function statsInfographicPage(theme: Theme, org: string): Page {
  return page("لوحة مؤشرات", theme, (add) => {
    header(add, theme, "لوحة المؤشرات — بيانات تجريبية");
    add("progress", {
      name: "مؤشر تقدم",
      x: 24,
      y: 40,
      w: 162,
      h: 14,
      content: "نسبة الإنجاز العام",
      style: { value: 78, fill: theme.primary },
    });
    add("progress", {
      name: "مؤشر تقدم",
      x: 24,
      y: 60,
      w: 162,
      h: 14,
      content: "رضا المستفيدين",
      style: { value: 92, fill: theme.accent },
    });
    add("progress", {
      name: "مؤشر تقدم",
      x: 24,
      y: 80,
      w: 162,
      h: 14,
      content: "الالتزام بالجدول الزمني",
      style: { value: 64, fill: theme.primarySoft },
    });
    const cards: [string, string][] = [
      ["904", "إجمالي الحالات"],
      ["27", "إصابة"],
      ["96%", "نسبة الاكتمال"],
      ["12", "فرق ميدانية"],
    ];
    cards.forEach(([value, label], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 24 + col * 84;
      const y = 104 + row * 44;
      add("shape", {
        name: `خلفية بطاقة ${i + 1}`,
        x,
        y,
        w: 78,
        h: 38,
        style: { fill: theme.surface, borderColor: theme.line, borderWidth: 0.35, radius: 4 },
      });
      add("text", {
        name: `رقم ${i + 1}`,
        x,
        y: y + 4,
        w: 78,
        h: 16,
        content: value,
        style: {
          fontFamily: "Tajawal",
          fontSize: 26,
          color: theme.primary,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.1,
        },
      });
      add("text", {
        name: `تسمية ${i + 1}`,
        x,
        y: y + 23,
        w: 78,
        h: 8,
        content: label,
        style: {
          fontFamily: "Cairo",
          fontSize: 10,
          color: theme.muted,
          fontWeight: 600,
          textAlign: "center",
        },
      });
    });
    add("text", {
      name: "تنويه بيانات",
      x: 24,
      y: 196,
      w: 162,
      h: 8,
      content: "بيانات تجريبية للعرض فقط — استبدلها بأرقامك الفعلية",
      style: {
        fontFamily: "Cairo",
        fontSize: 9,
        color: theme.muted,
        fontWeight: 600,
        textAlign: "center",
      },
    });
    footer(add, theme, org);
  });
}

function tablePage(theme: Theme, org: string): Page {
  return page("جدول بيانات", theme, (add) => {
    header(add, theme, "جدول البيانات التفصيلي — بيانات تجريبية");
    add("table", {
      name: "جدول تفصيلي",
      x: 22,
      y: 40,
      w: 166,
      h: 96,
      content: JSON.stringify([
        ["البند", "الوحدة", "المستهدف", "المتحقق", "الفارق"],
        ["البنود 1", "حالة", "100", "94", "-6"],
        ["البنود 2", "حالة", "80", "83", "+3"],
        ["البنود 3", "حالة", "60", "57", "-3"],
        ["البنود 4", "حالة", "40", "41", "+1"],
        ["الإجمالي", "—", "280", "275", "-5"],
      ]),
      style: {
        cols: 5,
        rows: 6,
        fontSize: 10.5,
        cellAlign: "center",
      },
    });
    add("text", {
      name: "مصدر",
      x: 22,
      y: 142,
      w: 166,
      h: 8,
      content: "المصدر: بيانات تجريبية (Demo) — عدّل الخلايا من لوحة الخصائص",
      style: {
        fontFamily: "Cairo",
        fontSize: 9,
        color: theme.muted,
        fontWeight: 600,
        textAlign: "right",
      },
    });
    footer(add, theme, org);
  });
}

function infographicPage(theme: Theme, org: string): Page {
  return page("إنفوجرافيك", theme, (add) => {
    add("shape", {
      name: "خلفية",
      x: 0,
      y: 0,
      w: 210,
      h: 297,
      style: { fill: theme.surface, borderWidth: 0 },
    });
    add("shape", {
      name: "شريط رأسي",
      x: 0,
      y: 0,
      w: 14,
      h: 297,
      style: { fill: theme.primary, borderWidth: 0 },
    });
    add("text", {
      name: "العنوان",
      x: 30,
      y: 28,
      w: 156,
      h: 20,
      content: "مسار العمل في خمس مراحل",
      style: {
        fontFamily: "Tajawal",
        fontSize: 24,
        color: theme.primary,
        fontWeight: 800,
        textAlign: "right",
      },
    });
    add("line", { name: "خط ذهبي", x: 30, y: 52, w: 60, h: 4, style: { color: theme.accent, stroke: 1 } });
    const steps: [string, string][] = [
      ["01", "التخطيط وتحديد النطاق"],
      ["02", "جمع البيانات والتحقق منها"],
      ["03", "التحليل واستخراج المؤشرات"],
      ["04", "إعداد التقرير وإخراجه"],
      ["05", "المتابعة وقياس الأثر"],
    ];
    steps.forEach(([num, label], i) => {
      const y = 72 + i * 40;
      add("shape", {
        name: `دائرة ${num}`,
        x: 162,
        y,
        w: 24,
        h: 24,
        style: { fill: theme.primary, shape: "circle", borderWidth: 0 },
      });
      add("text", {
        name: `رقم ${num}`,
        x: 162,
        y: y + 6,
        w: 24,
        h: 12,
        content: num,
        style: {
          fontFamily: "Cairo",
          fontSize: 13,
          color: "#ffffff",
          fontWeight: 800,
          textAlign: "center",
        },
      });
      add("box", {
        name: `مرحلة ${num}`,
        x: 30,
        y,
        w: 124,
        h: 24,
        content: label,
        style: {
          fontFamily: "Cairo",
          fontSize: 12,
          color: theme.ink,
          fill: "#ffffff",
          borderColor: theme.line,
          borderWidth: 0.35,
          radius: 4,
          padding: 5,
          textAlign: "right",
          fontWeight: 600,
        },
      });
      if (i < steps.length - 1) {
        add("line", {
          name: `وصلة ${num}`,
          x: 173,
          y: y + 25,
          w: 2,
          h: 14,
          style: { color: theme.line, stroke: 0.5 },
        });
      }
    });
    footer(add, theme, org);
  });
}

function coverPage(theme: Theme, org: string): Page {
  return officialPages(theme, org)[0];
}

function slidesPages(theme: Theme, org: string): Page[] {
  const size = { w: 338.7, h: 190.5 };
  return [
    page(
      "شريحة الغلاف",
      theme,
      (add) => {
        add("shape", {
          name: "خلفية",
          x: 0,
          y: 0,
          w: 338.7,
          h: 190.5,
          style: { fill: theme.primary, borderWidth: 0 },
        });
        add("shape", {
          name: "كتلة سفلية",
          x: 0,
          y: 140,
          w: 338.7,
          h: 50.5,
          style: { fill: theme.primarySoft, borderWidth: 0 },
        });
        add("line", {
          name: "خط ذهبي",
          x: 30,
          y: 126,
          w: 56,
          h: 4,
          style: { color: theme.accent, stroke: 1.6 },
        });
        add("logo", { name: "شعار", x: 284, y: 26, w: 30, h: 30 });
        add("text", {
          name: "عنوان العرض",
          x: 30,
          y: 62,
          w: 230,
          h: 36,
          content: "عرض تنفيذي\nللنتائج الرئيسية",
          style: {
            fontFamily: "Tajawal",
            fontSize: 34,
            color: "#ffffff",
            fontWeight: 800,
            textAlign: "right",
            lineHeight: 1.2,
          },
        });
        add("text", {
          name: "الجهة",
          x: 30,
          y: 156,
          w: 260,
          h: 16,
          content: `${org}  ·  بيانات تجريبية للعرض`,
          style: {
            fontFamily: "Cairo",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: 600,
            textAlign: "right",
          },
        });
      },
      size,
    ),
    page(
      "شريحة المؤشرات",
      theme,
      (add) => {
        header(add, theme, "المؤشرات الرئيسية — بيانات تجريبية", size.w);
        const cards: [string, string][] = [
          ["904", "إجمالي الحالات"],
          ["27", "إصابة"],
          ["96%", "نسبة الاكتمال"],
        ];
        cards.forEach(([value, label], i) => {
          const x = 28 + i * 100;
          add("shape", {
            name: `بطاقة ${i + 1}`,
            x,
            y: 48,
            w: 92,
            h: 62,
            style: { fill: theme.surface, borderColor: theme.line, borderWidth: 0.35, radius: 5 },
          });
          add("text", {
            name: `رقم ${i + 1}`,
            x,
            y: 58,
            w: 92,
            h: 24,
            content: value,
            style: {
              fontFamily: "Tajawal",
              fontSize: 30,
              color: theme.primary,
              fontWeight: 800,
              textAlign: "center",
              lineHeight: 1.1,
            },
          });
          add("text", {
            name: `تسمية ${i + 1}`,
            x,
            y: 86,
            w: 92,
            h: 10,
            content: label,
            style: {
              fontFamily: "Cairo",
              fontSize: 11,
              color: theme.muted,
              fontWeight: 600,
              textAlign: "center",
            },
          });
        });
        add("progress", {
          name: "مؤشر",
          x: 28,
          y: 124,
          w: 288,
          h: 16,
          content: "نسبة الإنجاز العام",
          style: { value: 78, fill: theme.primary },
        });
        footer(add, theme, org, size.w, size.h);
      },
      size,
    ),
  ];
}

export const PACKS: { id: PackId; title: string; desc: string; pages: string }[] = [
  { id: "official", title: "تقرير رسمي متكامل", desc: "غلاف، محتويات، ملخص، إنجازات، مؤشرات، خاتمة", pages: "6 صفحات" },
  { id: "eid", title: "تقرير فعالية ومناسبة", desc: "غلاف احتفالي، مؤشرات، معرض صور، ختام", pages: "4 صفحات" },
  { id: "briefing", title: "عرض قيادي موجز", desc: "غلاف عرض مع مؤشرات وخاتمة", pages: "3 صفحات" },
  { id: "slides", title: "عرض تقديمي 16:9", desc: "شرائح بنسبة 16:9 للاجتماعات", pages: "2 شريحة" },
  { id: "blank", title: "مستند فارغ A4", desc: "صفحة بيضاء مع رأس وتذييل خفيف", pages: "1 صفحة" },
];

export function createProject(pack: PackId, themeId: ThemeId = "official", orgName = ""): Project {
  const theme = THEMES[pack === "eid" ? (themeId === "official" ? "eid" : themeId) : themeId];
  const pages =
    pack === "official"
      ? officialPages(theme, orgName)
      : pack === "eid"
        ? eidPages(THEMES.eid, orgName)
        : pack === "briefing"
          ? briefingPages(theme, orgName)
          : pack === "slides"
            ? slidesPages(theme, orgName)
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
          : pack === "slides"
            ? "عرض تقديمي 16:9"
            : pack === "blank"
              ? "مستند جديد"
              : "تقرير رسمي",
    theme: pack === "eid" ? "eid" : themeId,
    orgName,
    defaultSize: pack === "slides" ? "slide-16-9" : "a4-portrait",
    pages,
  };
}

export type TemplateCategoryId =
  | "covers"
  | "reports"
  | "stats"
  | "tables"
  | "kpis"
  | "infographics"
  | "inner"
  | "slides";

export interface TemplateCategory {
  id: TemplateCategoryId;
  title: string;
  desc: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: "covers", title: "أغلفة التقارير", desc: "أغلفة رسمية وشريط هوية" },
  { id: "reports", title: "تقارير رسمية", desc: "صفحات نصية وملخصات" },
  { id: "inner", title: "صفحات داخلية", desc: "محتويات، إنجازات، ختام" },
  { id: "stats", title: "إحصائيات", desc: "بطاقات أرقام ولوحات" },
  { id: "tables", title: "جداول", desc: "جداول بيانات قابلة للتعديل" },
  { id: "kpis", title: "مؤشرات", desc: "مؤشرات ونِسب أداء" },
  { id: "infographics", title: "إنفوجرافيك", desc: "مسارات ومراحل عمل" },
  { id: "slides", title: "عروض 16:9", desc: "شرائح عريضة للاجتماعات" },
];

export interface PageTemplateDef {
  id: string;
  title: string;
  desc: string;
  category: TemplateCategoryId;
  size?: { w: number; h: number };
}

const A4_SIZE = { w: 210, h: 297 };
const SLIDE_SIZE = { w: 338.7, h: 190.5 };

export const PAGE_TEMPLATES: PageTemplateDef[] = [
  { id: "cover", title: "غلاف رسمي", desc: "شريط كحلي وشعار وعنوان", category: "covers", size: A4_SIZE },
  { id: "cover-celebration", title: "غلاف مناسبة", desc: "غلاف احتفالي بخلفية داكنة", category: "covers", size: A4_SIZE },
  { id: "text", title: "صفحة نصية", desc: "عنوان وفقرة وجدول", category: "reports", size: A4_SIZE },
  { id: "contents", title: "محتويات", desc: "فهرس بنود مرقم", category: "inner", size: A4_SIZE },
  { id: "achievements", title: "إنجازات", desc: "بطاقات أثر", category: "inner", size: A4_SIZE },
  { id: "images", title: "معرض صور", desc: "أربع صور مع تعليق", category: "inner", size: A4_SIZE },
  { id: "thanks", title: "شكر وختام", desc: "صفحة ختامية هادئة", category: "inner", size: A4_SIZE },
  { id: "closing", title: "توقيع وختم", desc: "خلاصة وتوقيع", category: "inner", size: A4_SIZE },
  { id: "stats", title: "مؤشرات ميدانية", desc: "أرقام ورسم أعمدة", category: "kpis", size: A4_SIZE },
  { id: "stats-board", title: "لوحة مؤشرات", desc: "أربع بطاقات أرقام وأشرطة تقدم", category: "stats", size: A4_SIZE },
  { id: "table-data", title: "جدول تفصيلي", desc: "جدول خمسة أعمدة للمقارنة", category: "tables", size: A4_SIZE },
  { id: "infographic", title: "مسار من خمس مراحل", desc: "إنفوجرافيك عمودي جاهز", category: "infographics", size: A4_SIZE },
  { id: "slide-cover", title: "شريحة غلاف", desc: "شريحة عريضة للعرض", category: "slides", size: SLIDE_SIZE },
  { id: "slide-stats", title: "شريحة مؤشرات", desc: "ثلاث بطاقات ومؤشر تقدم", category: "slides", size: SLIDE_SIZE },
];

export function templateById(id: string): PageTemplateDef | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Builds a fresh page for a gallery entry. Every call returns new element ids,
 * so inserting a template copies it rather than editing the template source.
 */
export function createTemplatePage(id: string, theme: Theme, org: string): Page {
  switch (id) {
    case "cover":
      return coverPage(theme, org);
    case "cover-celebration":
      return eidPages(theme, org)[0];
    case "contents":
      return officialPages(theme, org)[1];
    case "text":
      return officialPages(theme, org)[2];
    case "achievements":
      return officialPages(theme, org)[3];
    case "stats":
      return officialPages(theme, org)[4];
    case "closing":
      return officialPages(theme, org)[5];
    case "images":
      return eidPages(theme, org)[2];
    case "thanks":
      return eidPages(theme, org)[3];
    case "stats-board":
      return statsInfographicPage(theme, org);
    case "table-data":
      return tablePage(theme, org);
    case "infographic":
      return infographicPage(theme, org);
    case "slide-cover":
      return slidesPages(theme, org)[0];
    case "slide-stats":
      return slidesPages(theme, org)[1];
    default:
      return coverPage(theme, org);
  }
}

/** Pages of a starter pack, for the "new project from template" flow. */
export function packPages(pack: PackId, theme: Theme, org: string): Page[] {
  return createProject(pack, theme.id, org).pages;
}
