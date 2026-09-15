import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { PACKS, PAGE_TEMPLATES, TEMPLATE_CATEGORIES, type TemplateCategoryId } from "@/lib/editor/templates";
import { SIZE_PRESETS, THEMES, pageSize, type PackId } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const SIZE_OPTIONS = SIZE_PRESETS.filter((s) => s.id !== "custom");

export function TemplatesPage() {
  const hydrate = useEditor((s) => s.hydrate);
  const createProject = useEditor((s) => s.createProject);
  const [category, setCategory] = useState<TemplateCategoryId | "all">("all");
  const [theme, setTheme] = useState<keyof typeof THEMES>("official");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const templates = useMemo(
    () => PAGE_TEMPLATES.filter((t) => category === "all" || t.category === category),
    [category],
  );

  const startFrom = async (packId: string) => {
    const pack = PACKS.find((p) => p.id === packId);
    await createProject(packId as PackId, theme);
    toast.success(`تم إنشاء «${pack?.title || packId}»`);
    window.location.assign("/editor");
  };

  return (
    <div className="min-h-full bg-paper dark:bg-[#111722]">
      <SiteHeader current="/templates" />

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-[26px] font-extrabold">القوالب</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-7 text-muted">
          اختر قالب بداية لإنشاء مشروع كامل، أو انتقل إلى المحرر وأضف صفحات جاهزة من تصنيفات القوالب.
          أي قالب تختاره ينشئ نسخة جديدة — القالب الأصلي لا يتغير.
        </p>

        <section className="mt-8">
          <h2 className="text-[17px] font-extrabold">مشاريع جاهزة</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((s) => (
              <span
                key={s.id}
                className="rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-muted dark:border-white/10"
              >
                {s.name} — {s.w} × {s.h} مم
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col rounded-[12px] border border-line bg-white p-5 dark:border-white/10 dark:bg-white/5"
              >
                <strong className="text-[15px] font-extrabold">{pack.title}</strong>
                <span className="mt-1 text-[12px] leading-6 text-muted">{pack.desc}</span>
                <span className="mt-2 text-[11px] font-bold text-muted">{pack.pages}</span>
                <button
                  type="button"
                  onClick={() => void startFrom(pack.id)}
                  className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-navy text-[12px] font-extrabold text-white"
                >
                  <Plus className="size-3.5" />
                  إنشاء مشروع من هذا القالب
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-[17px] font-extrabold">صفحات داخل التقرير</h2>
          <p className="mt-1 text-[13px] text-muted">
            هذه الصفحات تُضاف داخل مشروع مفتوح من تبويب «قوالب» في المحرر.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Chip active={category === "all"} onClick={() => setCategory("all")} label="الكل" />
            {TEMPLATE_CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
                label={c.title}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(Object.keys(THEMES) as (keyof typeof THEMES)[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={theme === id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold",
                  theme === id ? "border-navy bg-navy text-white" : "border-line text-muted dark:border-white/10",
                )}
              >
                <span className="size-3 rounded-full" style={{ background: THEMES[id].primary }} />
                {THEMES[id].name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => {
              const size = pageSize({ w: t.size?.w, h: t.size?.h });
              const palette = THEMES[theme];
              return (
                <div
                  key={t.id}
                  className="rounded-[12px] border border-line bg-white p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <div
                    className="relative mb-3 overflow-hidden rounded-[6px] border border-line bg-white"
                    style={{ aspectRatio: `${size.w} / ${size.h}` }}
                  >
                    <span className="absolute inset-x-0 top-0 h-[9%]" style={{ background: palette.primary }} />
                    <span className="absolute inset-x-0 top-[9%] h-[2%]" style={{ background: palette.accent }} />
                    <span
                      className="absolute top-[16%] right-[6%] h-[5%] w-[46%] rounded-sm"
                      style={{ background: palette.primary, opacity: 0.75 }}
                    />
                    <span
                      className="absolute top-[24%] right-[6%] h-[3%] w-[66%] rounded-sm"
                      style={{ background: palette.muted, opacity: 0.4 }}
                    />
                    <span
                      className="absolute top-[31%] right-[6%] h-[3%] w-[58%] rounded-sm"
                      style={{ background: palette.muted, opacity: 0.3 }}
                    />
                    <span
                      className="absolute bottom-[10%] left-[6%] h-[16%] w-[38%] rounded-sm"
                      style={{ background: palette.surface, border: `1px solid ${palette.line}` }}
                    />
                  </div>
                  <strong className="block text-[14px] font-extrabold">{t.title}</strong>
                  <span className="mt-1 block text-[12px] leading-6 text-muted">{t.desc}</span>
                  <span className="mt-2 block text-[11px] font-bold text-muted tabular-nums">
                    {Math.round(size.w)} × {Math.round(size.h)} مم
                  </span>
                </div>
              );
            })}
          </div>

          <a
            href="/editor"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-[10px] bg-navy px-4 text-[13px] font-extrabold text-white"
          >
            اذهب إلى المحرر لإدراج القوالب
            <ArrowLeft className="size-4" />
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12px] font-bold",
        active ? "border-navy bg-navy text-white" : "border-line text-muted dark:border-white/10",
      )}
    >
      {label}
    </button>
  );
}