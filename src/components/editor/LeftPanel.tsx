import { useState } from "react";
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
  Settings2,
  Layers,
  Ruler,
  Gauge,
  FileText,
  Upload,
  Baseline,
} from "lucide-react";
import {
  PROGRESS_PRESETS,
  SHAPE_TOOLS,
  SIZE_PRESETS,
  TEXT_PRESETS,
  THEMES,
  TYPE_NAME,
  pageSize,
  sizeIdOf,
  type CanvasEl,
  type ElStyle,
  type ElType,
  type ProgressPreset,
  type Theme,
  type ThemeId,
} from "@/lib/editor/model";
import { SHAPES, shapesByGroup } from "@/lib/editor/shapes";
import { detectPlatform } from "@/lib/editor/fonts";
import { PAGE_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategoryId } from "@/lib/editor/templates";
import { useEditor, type LeftTab } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import { ShapePreview } from "./ShapePreview";
import { AssetLibrary } from "./AssetLibrary";
import { TablePicker } from "./TablePicker";

const TABS: { id: LeftTab; label: string; icon: typeof Type }[] = [
  { id: "elements", label: "عناصر", icon: LayoutTemplate },
  { id: "shapes", label: "أشكال", icon: Shapes },
  { id: "templates", label: "قوالب", icon: FileText },
  { id: "pages", label: "صفحات", icon: Layers },
  { id: "theme", label: "سمة", icon: Palette },
  { id: "fonts", label: "خطوط", icon: Baseline },
  { id: "settings", label: "إعدادات", icon: Settings2 },
];

/** Element palette, grouped by intent so the list stays scannable. */
const TOOL_GROUPS: { title: string; items: { type: ElType; label: string; icon: typeof Type }[] }[] = [
  {
    title: "نص",
    items: [
      { type: "text", label: "نص", icon: Type },
      { type: "box", label: "مربع محتوى", icon: Square },
    ],
  },
  {
    title: "صور وشعارات",
    items: [
      { type: "image", label: "صورة", icon: ImageIcon },
      { type: "logo", label: "شعار", icon: BadgePercent },
      { type: "qr", label: "رمز QR", icon: QrCode },
    ],
  },
  {
    title: "جداول وإحصاءات",
    items: [
      { type: "table", label: "جدول", icon: Table2 },
      { type: "stat", label: "بطاقة رقم", icon: BadgePercent },
      { type: "progress", label: "شريط تقدم", icon: Gauge },
      { type: "stamp", label: "ختم", icon: Stamp },
    ],
  },
  {
    title: "خطوط وفواصل",
    items: [
      { type: "line", label: "خط", icon: Minus },
      { type: "divider", label: "فاصل", icon: SeparatorHorizontal },
      { type: "icon", label: "أيقونة", icon: Star },
    ],
  },
];

export function LeftPanel({ onUpload }: { onUpload: (kind: "image" | "logo" | "font" | "library") => void }) {
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
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const setActivePage = useEditor((s) => s.setActivePage);
  const setPageSize = useEditor((s) => s.setPageSize);
  const setAllPageSizes = useEditor((s) => s.setAllPageSizes);
  const addPage = useEditor((s) => s.addPage);
  const duplicatePage = useEditor((s) => s.duplicatePage);
  const deletePage = useEditor((s) => s.deletePage);
  const movePageById = useEditor((s) => s.movePageById);
  const renamePage = useEditor((s) => s.renamePage);
  const toggle = useEditor((s) => s.toggle);
  const showGrid = useEditor((s) => s.showGrid);
  const snapGrid = useEditor((s) => s.snapGrid);
  const snapElements = useEditor((s) => s.snapElements);
  const dark = useEditor((s) => s.dark);
  const storage = useEditor((s) => s.storage);

  const [category, setCategory] = useState<TemplateCategoryId | "all">("all");
  const [customSize, setCustomSize] = useState({ w: 210, h: 297 });
  const [qrBusy, setQrBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const page = pages.find((p) => p.id === activePageId);
  const activeSizeId = sizeIdOf(page);

  const add = async (type: ElType) => {
    if (type === "image" || type === "logo") {
      onUpload(type);
      return;
    }
    if (type === "table") {
      // A table needs a shape (rows/columns) before it exists, so the palette
      // opens the builder rather than dropping an arbitrary 3×4 grid.
      setPickerOpen(true);
      return;
    }
    if (type === "qr") {
      const text = window.prompt("رابط أو نص الرمز", "https://") || "";
      if (!text.trim()) return;
      setQrBusy(true);
      try {
        const QRCode = (await import("qrcode")).default;
        const src = await QRCode.toDataURL(text, {
          margin: 1,
          width: 512,
          color: { dark: "#071d3d", light: "#ffffff" },
        });
        addElement("qr", { content: text, src });
      } catch {
        // Encoding failures (an over-long payload) still leave a usable frame.
        addElement("qr", { content: text });
      } finally {
        setQrBusy(false);
      }
      return;
    }
    addElement(type);
  };

  const applyCustomSize = (scope: "page" | "all") => {
    const w = Math.max(20, Math.min(1000, customSize.w));
    const h = Math.max(20, Math.min(1000, customSize.h));
    if (scope === "all") setAllPageSizes("custom", { w, h });
    else if (page) setPageSize(page.id, "custom", { w, h });
  };

  const templates = PAGE_TEMPLATES.filter((t) => category === "all" || t.category === category);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-line bg-white dark:border-white/10 dark:bg-[#161c26]">
      <div className="grid shrink-0 grid-cols-7 gap-0.5 border-b border-line p-1.5 dark:border-white/10">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setLeftTab(t.id)}
              title={t.label}
              className={cn(
                "grid h-12 place-items-center gap-0.5 rounded-[8px] text-[9px] font-extrabold",
                tab === t.id
                  ? "bg-navy text-white"
                  : "text-muted hover:bg-line-2 dark:text-white/70 dark:hover:bg-white/5",
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="editor-pane-scroll min-h-0 flex-1 overflow-auto p-3">
        {tab === "elements" && (
          <div className="grid gap-4">
            {pickerOpen && (
              <TablePickerOverlay
                theme={THEMES[theme]}
                onClose={() => setPickerOpen(false)}
                onAdd={(over, style) => {
                  addElement("table", { ...over, style: { ...(over.style || {}), ...(style || {}) } });
                  setPickerOpen(false);
                }}
              />
            )}
            {TOOL_GROUPS.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">{group.title}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.type}
                        type="button"
                        disabled={qrBusy && t.type === "qr"}
                        onClick={() => void add(t.type)}
                        className="flex h-[64px] flex-col items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-bold transition hover:border-navy-2 hover:bg-navy-2/5 disabled:opacity-50 dark:border-white/10 dark:hover:border-gold/60"
                        title={TYPE_NAME[t.type]}
                      >
                        <Icon className="size-[18px] text-navy-2 dark:text-gold-2" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <section>
              <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">نص سريع</h3>
              <div className="grid gap-1.5">
                {TEXT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      addElement("text", {
                        content: p.sample,
                        w: p.w,
                        h: p.h,
                        name: p.label,
                        style: {
                          fontFamily: "Tajawal",
                          textAlign: "right",
                          color: THEMES[theme].ink,
                          ...p.style,
                        },
                      } as Partial<CanvasEl>)
                    }
                    className="flex items-center justify-between rounded-[8px] border border-line px-2.5 py-2 text-right hover:border-navy-2 dark:border-white/10"
                  >
                    <span className="text-[12px] font-bold">{p.label}</span>
                    <span className="text-[11px] text-muted">{Math.round(Number(p.style.fontSize) || 12)}pt</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">مؤشرات الإنجاز</h3>
              <div className="grid gap-1.5">
                {PROGRESS_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      addElement("progress", {
                        content: p.sample,
                        w: p.w,
                        h: p.h,
                        name: p.label,
                        style: {
                          fontFamily: "Tajawal",
                          color: THEMES[theme].ink,
                          fill: THEMES[theme].primary,
                          ...p.style,
                          variant: p.id === "ring" ? "ring" : "bar",
                        },
                      } as Partial<CanvasEl>)
                    }
                    className="flex items-center gap-2 rounded-[8px] border border-line px-2.5 py-2 text-right hover:border-navy-2 dark:border-white/10"
                  >
                    <ProgressPreview preset={p} color={THEMES[theme].primary} />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px]">{p.label}</strong>
                      <span className="text-[10px] text-muted">{Math.round(Number(p.style.value) || 0)}%</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">أشكال سريعة</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {SHAPE_TOOLS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      addElement("shape", {
                        w: s.w,
                        h: s.h,
                        name: s.label,
                        style: { fill: THEMES[theme].primary, shapeId: s.shapeId },
                      })
                    }
                    title={s.label}
                    className="grid aspect-square place-items-center rounded-[8px] border border-line p-1.5 text-navy-2 transition hover:border-navy-2 hover:bg-navy-2/5 dark:border-white/10 dark:text-gold-2"
                  >
                    <ShapePreview shapeId={s.shapeId} className="size-full max-h-7" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLeftTab("shapes")}
                className="mt-1.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
              >
                <Shapes className="size-3.5" /> كل الأشكال ({SHAPES.length})
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">صور وشعارات</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpload("image")}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-navy text-[11px] font-extrabold text-white"
                >
                  <ImageIcon className="size-3.5" /> رفع صورة
                </button>
                <button
                  type="button"
                  onClick={() => onUpload("logo")}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
                >
                  <BadgePercent className="size-3.5" /> رفع شعار
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-5 text-muted">
                أو اسحب الصورة وأفلتها على الصفحة مباشرة — تُضاف في موضع الإفلات.
              </p>
            </section>

            <AssetLibrary onUpload={() => onUpload("library")} />

            <button
              type="button"
              onClick={() => onUpload("font")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-line text-[12px] font-extrabold dark:border-white/10"
            >
              <Upload className="size-3.5" />
              تحميل خط مخصص (TTF/OTF)
            </button>
          </div>
        )}

        {tab === "shapes" && (
          <div className="grid gap-4">
            <header className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div>
                <h2 className="text-[13px] font-extrabold">الأشكال</h2>
                <p className="mt-0.5 text-[11px] leading-5 text-muted">
                  انقر لإضافة الشكل، ثم عدّل التعبئة والإطار من لوحة الخصائص.
                </p>
              </div>
              <span className="text-[11px] text-muted tabular-nums">{SHAPES.length}</span>
            </header>

            {shapesByGroup().map((group) => (
              <section key={group.group}>
                <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">{group.group}</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {group.items.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        addElement("shape", {
                          name: s.label,
                          style: { fill: THEMES[theme].primary, shapeId: s.id },
                        })
                      }
                      title={s.label}
                      className="grid aspect-square place-items-center rounded-[8px] border border-line p-1.5 text-navy-2 transition hover:border-navy-2 hover:bg-navy-2/5 dark:border-white/10 dark:text-gold-2"
                    >
                      <ShapePreview shapeId={s.id} className="size-full max-h-8" />
                    </button>
                  ))}
                </div>
              </section>
            ))}

            <section className="grid gap-1.5">
              <h3 className="text-[11px] font-extrabold tracking-wide text-muted">خطوط وفواصل</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => addElement("line")}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
                >
                  <Minus className="size-3.5" /> خط
                </button>
                <button
                  type="button"
                  onClick={() => addElement("divider")}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
                >
                  <SeparatorHorizontal className="size-3.5" /> فاصل
                </button>
              </div>
            </section>
          </div>
        )}

        {tab === "fonts" && <FontsTab onUpload={onUpload} />}

        {tab === "templates" && (
          <div>
            <header className="mb-2.5">
              <h2 className="text-[13px] font-extrabold">صفحات جاهزة</h2>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                تُضاف كصفحة جديدة في المشروع الحالي — القالب الأصلي لا يتغير.
              </p>
            </header>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <CategoryChip active={category === "all"} onClick={() => setCategory("all")} label="الكل" />
              {TEMPLATE_CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                  label={c.title}
                />
              ))}
            </div>
            <div className="grid gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addTemplatePage(t.id)}
                  className="grid grid-cols-[46px_1fr] items-center gap-2.5 rounded-[8px] border border-line p-2.5 text-right transition hover:border-navy-2 hover:bg-navy-2/5 dark:border-white/10"
                >
                  <span className="relative h-[58px] w-[46px] overflow-hidden rounded border border-line bg-white">
                    <span className="absolute inset-x-0 top-0 h-3 bg-navy/85" />
                    <span className="absolute inset-x-0 top-3 h-0.5 bg-gold" />
                    <span className="absolute top-6 left-1 h-1.5 w-5 bg-navy/20" />
                    <span className="absolute top-9 left-1 h-1 w-4 bg-navy/15" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[12px]">{t.title}</strong>
                    <span className="block text-[11px] leading-4 text-muted">{t.desc}</span>
                  </span>
                </button>
              ))}
              {!templates.length && (
                <p className="rounded-[8px] border border-dashed border-line p-4 text-center text-[12px] text-muted">
                  لا قوالب في هذا التصنيف
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "pages" && (
          <div className="grid gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-[13px] font-extrabold">الصفحات</h2>
              <span className="text-[11px] text-muted tabular-nums">{pages.length}</span>
            </header>
            <div className="grid gap-2">
              {pages.map((p, i) => (
                <div
                  key={p.id}
                  className={cn(
                    "rounded-[8px] border p-2",
                    p.id === activePageId ? "border-navy-2 bg-navy-2/5" : "border-line dark:border-white/10",
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="grid size-5 shrink-0 place-items-center rounded bg-line-2 text-[10px] font-extrabold text-muted dark:bg-white/10">
                      {i + 1}
                    </span>
                    <input
                      value={p.name}
                      onChange={(e) => renamePage(p.id, e.target.value)}
                      onFocus={() => setActivePage(p.id)}
                      aria-label={`اسم الصفحة ${i + 1}`}
                      className="h-7 min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-[12px] font-bold hover:border-line focus:border-navy-2 focus:bg-white dark:focus:bg-white/5"
                    />
                  </div>
                  <p className="mb-2 text-[10px] text-muted tabular-nums">
                    {Math.round(pageSize(p).w)} × {Math.round(pageSize(p).h)} مم · {p.elements.length} عنصر
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    <MiniButton onClick={() => duplicatePage(p.id)} label="نسخ">
                      نسخ
                    </MiniButton>
                    <MiniButton onClick={() => movePageById(p.id, -1)} label="تحريك لأعلى" disabled={i === 0}>
                      ↑
                    </MiniButton>
                    <MiniButton
                      onClick={() => movePageById(p.id, 1)}
                      label="تحريك لأسفل"
                      disabled={i === pages.length - 1}
                    >
                      ↓
                    </MiniButton>
                    <MiniButton onClick={() => deletePage(p.id)} label="حذف الصفحة" danger>
                      حذف
                    </MiniButton>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addPage()}
              className="h-10 rounded-[8px] bg-navy text-[12px] font-extrabold text-white"
            >
              إضافة صفحة
            </button>
            <p className="text-[11px] leading-5 text-muted">
              لإعادة الترتيب بالسحب والإفلات، استخدم شريط الصفحات أسفل منطقة التصميم.
            </p>
          </div>
        )}

        {tab === "theme" && (
          <div>
            <header className="mb-2.5">
              <h2 className="text-[13px] font-extrabold">سمة المستند</h2>
            </header>
            <label className="mb-3 block text-[11px] font-extrabold text-muted">
              اسم المشروع
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
                placeholder="اسم الجهة أو العميل"
                className="mt-1 h-9 w-full rounded-[8px] border border-line bg-white px-2.5 text-[13px] font-semibold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </label>
            <div className="grid gap-2">
              {(Object.values(THEMES) as (typeof THEMES)[ThemeId][]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[8px] border p-2.5 text-right",
                    theme === t.id ? "border-navy-2 bg-navy-2/5" : "border-line dark:border-white/10",
                  )}
                >
                  <span className="flex size-9 shrink-0 overflow-hidden rounded-md border border-line">
                    <span className="w-1/2" style={{ background: t.primary }} />
                    <span className="w-1/3" style={{ background: t.accent }} />
                    <span className="w-[16.6%]" style={{ background: t.surface }} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[12px]">{t.name}</strong>
                    <span className="text-[11px] text-muted">{t.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              السمة تُطبَّق على العناصر الجديدة والقوالب المُدرجة. العناصر الحالية تحتفظ بألوانها.
            </p>
          </div>
        )}

        {tab === "settings" && (
          <div className="grid gap-4">
            <section>
              <h2 className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-extrabold">
                <Ruler className="size-4" /> مقاس الصفحة
              </h2>
              <div className="grid gap-1.5">
                {SIZE_PRESETS.filter((s) => s.id !== "custom").map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => page && setPageSize(page.id, s.id)}
                    className={cn(
                      "rounded-[8px] border px-2.5 py-2 text-right",
                      activeSizeId === s.id ? "border-navy-2 bg-navy-2/5" : "border-line dark:border-white/10",
                    )}
                  >
                    <strong className="block text-[12px]">{s.name}</strong>
                    <span className="text-[11px] text-muted">{s.desc}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <label className="text-[10px] font-extrabold text-muted">
                  العرض مم
                  <input
                    type="number"
                    value={customSize.w}
                    onChange={(e) => setCustomSize((v) => ({ ...v, w: Number(e.target.value) }))}
                    className="mt-1 h-8 w-full rounded-[6px] border border-line px-2 text-[12px] dark:border-white/10 dark:bg-white/5"
                  />
                </label>
                <label className="text-[10px] font-extrabold text-muted">
                  الارتفاع مم
                  <input
                    type="number"
                    value={customSize.h}
                    onChange={(e) => setCustomSize((v) => ({ ...v, h: Number(e.target.value) }))}
                    className="mt-1 h-8 w-full rounded-[6px] border border-line px-2 text-[12px] dark:border-white/10 dark:bg-white/5"
                  />
                </label>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyCustomSize("page")}
                  className="h-9 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
                >
                  تطبيق على الصفحة
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomSize("all")}
                  className="h-9 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
                >
                  تطبيق على الكل
                </button>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-extrabold">الدقة والمحاذاة</h2>
              <div className="grid gap-1.5">
                <ToggleRow label="إظهار الشبكة" value={showGrid} onChange={() => toggle("showGrid")} />
                <ToggleRow label="التقاط للشبكة" value={snapGrid} onChange={() => toggle("snapGrid")} />
                <ToggleRow label="محاذاة العناصر" value={snapElements} onChange={() => toggle("snapElements")} />
                <ToggleRow label="الوضع الليلي" value={dark} onChange={() => toggle("dark")} />
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-extrabold">مكتبة الخطوط</h2>
              <p className="text-[11px] leading-5 text-muted">
                ثمانية خطوط عربية مضمّنة (Tajawal، Cairo، IBM Plex Sans Arabic، Noto Sans/Naskh/Kufi، Amiri،
                Reem Kufi)، مع إمكانية رفع خط مخصص بصيغة TTF/OTF/WOFF.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-[13px] font-extrabold">التخزين</h2>
              <p className="text-[11px] leading-5 text-muted">
                {storage.mode === "indexeddb"
                  ? "المشاريع محفوظة محلياً في IndexedDB داخل متصفحك ولا تُرفع إلى أي سيرفر."
                  : "IndexedDB غير متاح في هذا المتصفح؛ يتم الحفظ في LocalStorage بمساحة محدودة."}
              </p>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}

/** Miniature of a progress preset, drawn with the same shapes as the canvas. */
function ProgressPreview({ preset, color }: { preset: ProgressPreset; color: string }) {
  const value = Math.max(0, Math.min(100, Number(preset.style.value) || 0));
  if (preset.id === "ring") {
    const size = 22;
    const thickness = 3;
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="size-6 shrink-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf3" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${(c * value) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center" aria-hidden>
      <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line-2 dark:bg-white/15">
        <span className="block h-full" style={{ width: `${value}%`, background: color }} />
      </span>
    </span>
  );
}

/** Modal-style panel that wraps the table builder inside the elements tab. */
function TablePickerOverlay({
  theme,
  onAdd,
  onClose,
}: {
  theme: Theme;
  onAdd: (over: Partial<CanvasEl>, style?: Partial<ElStyle>) => void;
  onClose: () => void;
}) {
  return (
    <section className="rounded-[10px] border border-navy-2 bg-navy-2/5 p-3 dark:border-gold/40">
      <header className="mb-2 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-1.5 text-[12px] font-extrabold">
          <Table2 className="size-3.5" /> إنشاء جدول
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="h-7 rounded-[6px] border border-line px-2 text-[10px] font-extrabold dark:border-white/10"
        >
          إلغاء
        </button>
      </header>
      <TablePicker theme={theme} onAdd={onAdd} />
    </section>
  );
}

/**
 * Font library: bundled families, faces found on this device, and anything the
 * author uploaded. Applying a font here updates the selected text element, so
 * the panel doubles as the properties shortcut for typography.
 */
function FontsTab({ onUpload }: { onUpload: (kind: "image" | "logo" | "font") => void }) {
  const choices = useEditor((s) => s.fontChoices);
  const probed = useEditor((s) => s.fontsProbed);
  const selectedId = useEditor((s) => s.selectedId);
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const updateStyle = useEditor((s) => s.updateStyle);

  const page = pages.find((p) => p.id === activePageId);
  const selected = page?.elements.find((e) => e.id === selectedId);
  const current = selected?.style.fontFamily;
  const bundled = choices.filter((f) => f.source === "bundled");
  const system = choices.filter((f) => f.source === "system");
  const uploaded = choices.filter((f) => f.source === "uploaded");

  const apply = (family: string) => {
    if (!selected) return;
    updateStyle(selected.id, { fontFamily: family });
  };

  const group = (title: string, items: typeof choices, hint?: string) =>
    items.length > 0 && (
      <section key={title}>
        <h3 className="mb-2 text-[11px] font-extrabold tracking-wide text-muted">{title}</h3>
        {hint && <p className="mb-1.5 text-[10px] leading-4 text-muted">{hint}</p>}
        <div className="grid gap-1.5">
          {items.map((f) => (
            <button
              key={f.family}
              type="button"
              disabled={!selected}
              onClick={() => apply(f.family)}
              title={selected ? `تطبيق ${f.family}` : "اختر عنصر نص أولاً"}
              className={cn(
                "flex items-center justify-between gap-2 rounded-[8px] border px-2.5 py-2 text-right disabled:opacity-55",
                current === f.family
                  ? "border-navy-2 bg-navy-2/5"
                  : "border-line hover:border-navy-2 dark:border-white/10",
              )}
            >
              <span className="min-w-0">
                <span
                  className="block truncate text-[13px]"
                  style={{ fontFamily: `"${f.family.replace(/"/g, "")}", sans-serif` }}
                >
                  {f.family}
                </span>
                <span className="block truncate text-[10px] text-muted">{f.note}</span>
              </span>
              {current === f.family && <span className="shrink-0 text-[10px] font-extrabold text-navy-2">مُطبَّق</span>}
            </button>
          ))}
        </div>
      </section>
    );

  return (
    <div className="grid gap-4">
      <header>
        <h2 className="text-[13px] font-extrabold">مكتبة الخطوط</h2>
        <p className="mt-1 text-[11px] leading-5 text-muted">
          {probed
            ? `تم فحص خطوط هذا الجهاز (${detectPlatform()}). انقر على أي خط لتطبيقه على العنصر المحدد.`
            : "جارٍ فحص خطوط الجهاز…"}
        </p>
      </header>

      {!selected && (
        <p className="rounded-[8px] border border-dashed border-line p-3 text-[11px] leading-5 text-muted">
          حدّد عنصر نص على الصفحة لتفعيل تطبيق الخطوط. يمكنك تصفّح القائمة الآن.
        </p>
      )}

      {group("خطوط مضمّنة", bundled, "تُحمَّل مع المنصة وتظهر بنفس الشكل على أي جهاز.")}
      {group("خطوط جهازك", system, "خطوط مثبّتة على هذا الجهاز — قد لا تتوفر على جهاز آخر.")}
      {group("خطوط مرفوعة", uploaded, "خطوط أضفتها أنت في هذا المتصفح.")}

      <button
        type="button"
        onClick={() => onUpload("font")}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-line text-[12px] font-extrabold dark:border-white/10"
      >
        <Upload className="size-3.5" /> تحميل خط مخصص (TTF / OTF / WOFF)
      </button>

      <p className="text-[10px] leading-5 text-muted">
        ملاحظة: الخطوط المرفوعة تُسجَّل في هذا المتصفح فقط. عند فتح المشروع على جهاز آخر، ثبّت الخط عليه أو
        استخدم أحد الخطوط المضمّنة لضمان تطابق التصدير.
      </p>
    </div>
  );
}

function MiniButton({
  onClick,
  label,
  danger,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "h-7 rounded-[6px] border text-[10px] font-extrabold disabled:opacity-40",
        danger
          ? "border-red-200 text-danger hover:bg-red-50"
          : "border-line text-muted hover:border-navy-2 hover:text-ink dark:border-white/10 dark:text-white/70",
      )}
    >
      {children}
    </button>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-bold",
        active ? "border-navy-2 bg-navy-2 text-white" : "border-line text-muted dark:border-white/10",
      )}
    >
      {label}
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={value}
      className="flex items-center justify-between rounded-[8px] border border-line px-2.5 py-2 text-[12px] font-bold dark:border-white/10"
    >
      <span>{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors", value ? "bg-navy-2" : "bg-line")}>
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
            value ? "right-0.5" : "right-[18px]",
          )}
        />
      </span>
    </button>
  );
}