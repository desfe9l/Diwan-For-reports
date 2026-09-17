import { useEffect, useRef } from "react";
import { ArrowLeft, FileText, FolderOpen, LayoutTemplate, Table2, Gauge, FileDown } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { PACKS } from "@/lib/editor/templates";
import { type PackId } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { ProjectCard } from "@/components/site/ProjectCard";

const HIGHLIGHTS: { icon: typeof FileText; title: string; desc: string }[] = [
  { icon: LayoutTemplate, title: "صفحات وأغلفة", desc: "أغلفة رسمية وصفحات داخلية جاهزة قابلة للتعديل." },
  { icon: Table2, title: "جداول وإحصاءات", desc: "جداول قابلة للتحرير وبطاقات أرقام ومؤشرات ونِسب." },
  { icon: Gauge, title: "ضبط دقيق", desc: "موضع، مقاس، دوران، شفافية، خطوط، ألوان، إطار وظل." },
  { icon: FileDown, title: "تصدير احترافي", desc: "PDF وPNG وJPG وPowerPoint وWord وHTML بأبعاد دقيقة." },
];

export function HomePage() {
  const createProject = useEditor((s) => s.createProject);
  const importProject = useEditor((s) => s.importProject);
  const projects = useEditor((s) => s.projects);
  const projectsLoading = useEditor((s) => s.projectsLoading);
  const hydrate = useEditor((s) => s.hydrate);
  const openProject = useEditor((s) => s.openProject);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const recent = projects.slice(0, 3);

  const start = async (pack: PackId) => {
    await createProject(pack);
    window.location.assign("/editor");
  };

  const openEditor = async (id: string) => {
    await openProject(id);
    window.location.assign("/editor");
  };

  return (
    <div className="min-h-full bg-paper dark:bg-[#111722]">
      <SiteHeader current="/" />

      <main>
        <section className="border-b border-line bg-white dark:border-white/10 dark:bg-[#161c26]">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="mb-3 text-[12px] font-bold tracking-[0.2em] text-navy-2 dark:text-gold-2">
              A4 · A3 · 16:9 · RTL أولاً
            </p>
            <h1 className="max-w-3xl text-[32px] font-extrabold leading-[1.3] sm:text-[44px]">
              صمّم تقاريرك باحتراف
            </h1>
            <p className="mt-3 text-[15px] font-bold text-navy-2 dark:text-gold-2">
              {BRAND.lockup} — {BRAND.platformEn}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-muted sm:text-[16px]">
              {BRAND.description} محرر صفحات متعددة بنصوص وجداول وصور وشعارات ومؤشرات، مع
              تصدير PDF عالي الجودة ومقاسات دقيقة للمطبوعات.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void start("official")}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-navy px-5 text-[14px] font-extrabold text-white"
              >
                إنشاء مشروع جديد
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-line px-5 text-[14px] font-bold dark:border-white/10"
              >
                <FolderOpen className="size-4" />
                فتح مشروع من ملف
              </button>
              <a
                href="/projects"
                className="inline-flex h-12 items-center rounded-[10px] px-3 text-[14px] font-bold text-navy-2 underline decoration-line underline-offset-4 dark:text-gold-2"
              >
                كل مشاريعي
              </a>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const parsed = JSON.parse(String(reader.result));
                    void importProject(parsed).then(() => window.location.assign("/editor"));
                  } catch {
                    toast.error("تعذر قراءة الملف — تأكد أنه ملف مشروع بصJSON");
                  }
                };
                reader.onerror = () => toast.error("تعذر قراءة الملف");
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-[20px] font-extrabold">أحدث المشاريع</h2>
          <p className="mt-1 text-[13px] text-muted">
            المشاريع محفوظة محلياً في متصفحك — لا تُرسل إلى أي سيرفر.
          </p>

          {projectsLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[136px] animate-pulse rounded-[12px] border border-line bg-white dark:border-white/10 dark:bg-white/5" />
              ))}
            </div>
          ) : recent.length ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} onOpen={openEditor} compact />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[12px] border border-dashed border-line p-8 text-center dark:border-white/15">
              <p className="text-[14px] font-bold">لا توجد مشاريع بعد</p>
              <p className="mt-1 text-[13px] text-muted">ابدأ بتقرير رسمي جاهز أو بصفحة فارغة.</p>
            </div>
          )}
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6">
          <h2 className="text-[20px] font-extrabold">قوالب البداية</h2>
          <p className="mt-1 text-[13px] text-muted">كل قالب ينشئ نسخة جديدة داخل مشروعك.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => void start(pack.id as PackId)}
                className="rounded-[12px] border border-line bg-white p-5 text-right transition hover:border-navy-2 dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-[9px] bg-navy/5 text-navy-2 dark:bg-white/10 dark:text-gold-2">
                    {pack.id === "blank" ? <FileText className="size-5" /> : <LayoutTemplate className="size-5" />}
                  </span>
                  <span className="text-[11px] font-bold text-muted">{pack.pages}</span>
                </div>
                <strong className="block text-[15px] font-extrabold">{pack.title}</strong>
                <span className="mt-1 block text-[12px] leading-6 text-muted">{pack.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-line bg-white dark:border-white/10 dark:bg-[#161c26]">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-[20px] font-extrabold">ماذا تتضمن المنصة</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((h) => {
                const Icon = h.icon;
                return (
                  <div key={h.title}>
                    <span className="grid size-10 place-items-center rounded-[9px] bg-navy/5 text-navy-2 dark:bg-white/10 dark:text-gold-2">
                      <Icon className="size-5" />
                    </span>
                    <strong className="mt-3 block text-[14px] font-extrabold">{h.title}</strong>
                    <p className="mt-1 text-[12px] leading-6 text-muted">{h.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/templates"
                className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13px] font-bold dark:border-white/10"
              >
                استعرض القوالب
              </a>
              <a
                href="/about"
                className="inline-flex h-11 items-center rounded-[10px] border border-line px-4 text-[13px] font-bold dark:border-white/10"
              >
                عن المنصة
              </a>
            </div>
            <p className="mt-6 text-[12px] text-muted">
              من تطوير {BRAND.owner} — Developed by {BRAND.developer}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

