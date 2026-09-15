import {
  Type,
  Image as ImageIcon,
  Shapes,
  Minus,
  Star,
  Table2,
  Square,
  SeparatorHorizontal,
  Stamp,
  QrCode,
  BadgePercent,
  LayoutTemplate,
  Palette,
} from "lucide-react";
import type { ElType } from "@/lib/editor/model";
import { THEMES, TYPE_NAME } from "@/lib/editor/model";
import { PAGE_TEMPLATES } from "@/lib/editor/templates";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

const TOOLS: { type: ElType; label: string; icon: typeof Type }[] = [
  { type: "text", label: "نص", icon: Type },
  { type: "logo", label: "شعار", icon: BadgePercent },
  { type: "image", label: "صورة", icon: ImageIcon },
  { type: "shape", label: "شكل", icon: Shapes },
  { type: "line", label: "خط زخرفي", icon: Minus },
  { type: "icon", label: "أيقونة", icon: Star },
  { type: "table", label: "جدول", icon: Table2 },
  { type: "box", label: "مربع محتوى", icon: Square },
  { type: "divider", label: "فاصل", icon: SeparatorHorizontal },
  { type: "stamp", label: "ختم", icon: Stamp },
  { type: "qr", label: "رمز QR", icon: QrCode },
  { type: "stat", label: "مؤشر", icon: BadgePercent },
];

export function LeftPanel({ onUpload }: { onUpload: (kind: "image" | "logo" | "font") => void }) {
  const tab = useEditor((s) => s.leftTab);
  const setLeftTab = useEditor((s) => s.setLeftTab);
  const addElement = useEditor((s) => s.addElement);
  const addTemplatePage = useEditor((s) => s.addTemplatePage);
  const theme = useEditor((s) => s.theme);
  const setTheme = useEditor((s) => s.setTheme);
  const orgName = useEditor((s) => s.orgName);
  const setOrg = useEditor((s) => s.setOrg);
  const name = useEditor((s) => s.name);
  const setName = useEditor((s) => s.setName);

  const add = async (type: ElType) => {
    if (type === "image" || type === "logo") {
      onUpload(type);
      return;
    }
    if (type === "qr") {
      try {
        const QRCode = (await import("qrcode")).default;
        const text = window.prompt("رابط أو نص الرمز", "https://") || "https://";
        const src = await QRCode.toDataURL(text, { margin: 1, width: 512, color: { dark: "#071d3d", light: "#ffffff" } });
        addElement("qr", { content: text, src });
      } catch {
        addElement("qr");
      }
      return;
    }
    addElement(type);
  };

  return (
    <aside className="flex min-h-0 flex-col border-l border-line bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#1b2433]/90">
      <div className="grid grid-cols-3 gap-1.5 border-b border-line p-2.5 dark:border-white/10">
        {(
          [
            ["elements", "عناصر", LayoutTemplate],
            ["templates", "قوالب", LayoutTemplate],
            ["theme", "سمة", Palette],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLeftTab(id)}
            className={cn(
              "h-9 rounded-[8px] text-[12px] font-extrabold",
              tab === id ? "bg-navy-2 text-white" : "bg-white text-muted ring-1 ring-line dark:bg-white/5 dark:text-white/70",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "elements" && (
          <section className="p-3.5">
            <header className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-extrabold">إضافة عنصر</h2>
              <small className="text-[11px] text-muted">A4</small>
            </header>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => add(t.type)}
                    className="flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white/70 text-[12px] font-bold transition hover:border-gold hover:bg-gold/10 dark:border-white/10 dark:bg-white/5"
                    title={TYPE_NAME[t.type]}
                  >
                    <Icon className="size-5 text-navy-2 dark:text-gold-2" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onUpload("font")}
              className="mt-3 h-10 w-full rounded-[8px] border border-line bg-white text-[12px] font-extrabold dark:border-white/10 dark:bg-white/5"
            >
              تحميل خط مخصص
            </button>
          </section>
        )}

        {tab === "templates" && (
          <section className="p-3.5">
            <header className="mb-2.5">
              <h2 className="text-[13px] font-extrabold">صفحات جاهزة</h2>
              <p className="mt-1 text-[11px] text-muted">تُضاف كصفحة جديدة في المستند الحالي</p>
            </header>
            <div className="grid gap-2">
              {PAGE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addTemplatePage(t.id)}
                  className="grid grid-cols-[42px_1fr] items-center gap-2.5 rounded-[8px] border border-line bg-white/70 p-2.5 text-right transition hover:border-gold hover:bg-gold/10 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="relative h-[54px] w-[42px] overflow-hidden rounded border border-line bg-white">
                    <span className="absolute inset-x-0 top-0 h-3 bg-navy/80" />
                    <span className="absolute top-3 inset-x-0 h-0.5 bg-gold" />
                  </span>
                  <span>
                    <strong className="block text-[12px]">{t.title}</strong>
                    <span className="text-[11px] text-muted">{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "theme" && (
          <section className="p-3.5">
            <header className="mb-2.5">
              <h2 className="text-[13px] font-extrabold">سمة المستند</h2>
            </header>
            <label className="mb-3 block text-[11px] font-extrabold text-muted">
              اسم التقرير
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9 w-full rounded-[8px] border border-line bg-white px-2.5 text-[13px] font-semibold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
            <label className="mb-3 block text-[11px] font-extrabold text-muted">
              اسم الجهة
              <input
                value={orgName}
                onChange={(e) => setOrg(e.target.value)}
                className="mt-1 h-9 w-full rounded-[8px] border border-line bg-white px-2.5 text-[13px] font-semibold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
            <div className="grid gap-2">
              {(Object.values(THEMES) as (typeof THEMES)[keyof typeof THEMES][]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[8px] border p-2.5 text-right",
                    theme === t.id ? "border-gold bg-gold/10" : "border-line bg-white/70 dark:border-white/10 dark:bg-white/5",
                  )}
                >
                  <span className="flex size-9 overflow-hidden rounded-md">
                    <span className="w-1/2" style={{ background: t.primary }} />
                    <span className="w-1/2" style={{ background: t.accent }} />
                  </span>
                  <span>
                    <strong className="block text-[12px]">{t.name}</strong>
                    <span className="text-[11px] text-muted">{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              السمة تُطبَّق على العناصر الجديدة. الصفحات الحالية تحتفظ بألوانها ما لم تُعد إدراج قالب.
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}
