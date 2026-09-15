import { FilePlus2, FolderOpen, LayoutTemplate, RotateCcw } from "lucide-react";
import { PACKS } from "@/lib/editor/templates";
import { STORE_KEY, type PackId } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";

export function HomeScreen({ onOpenFile }: { onOpenFile: () => void }) {
  const newFromPack = useEditor((s) => s.newFromPack);
  const loadProject = useEditor((s) => s.loadProject);
  const setView = useEditor((s) => s.setView);
  const pages = useEditor((s) => s.pages);
  const name = useEditor((s) => s.name);
  const hydrated = useEditor((s) => s.hydrated);

  const hasAutosave = hydrated && pages.length > 0;

  const restore = () => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      loadProject(JSON.parse(raw));
      setView("editor");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(800px 400px at 80% 0%, rgba(198,160,90,.22), transparent 55%)" }} />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[10px] border border-gold/50 bg-white/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="14" height="18" rx="1.5" stroke="#e8c978" strokeWidth="1.6" />
              <path d="M8 8h6M8 12h6M8 16h4" stroke="#e8c978" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <strong className="block text-[15px] font-extrabold">ديوان التقارير</strong>
            <span className="text-[11px] text-white/60">استوديو تصميم المستندات الرسمية A4</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenFile}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-white/15 px-3 text-[13px] font-bold"
          >
            <FolderOpen className="size-4" />
            فتح مشروع
          </button>
          {hasAutosave && (
            <button
              type="button"
              onClick={() => setView("editor")}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-gradient-to-l from-gold to-gold-2 px-3 text-[13px] font-extrabold text-navy"
            >
              متابعة العمل
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 pb-16 pt-6">
        <p className="mb-2 text-[12px] font-bold tracking-[0.22em] text-gold-2">A4  ·  RTL  ·  PDF / PPTX / DOCX</p>
        <h1 className="max-w-2xl text-[34px] font-extrabold leading-[1.25] sm:text-[42px]">
          صمّم تقريراً رسمياً، ثم صدّره إلى كل الصيغ من صفحة واحدة
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/70">
          محرر صفحات A4 بالعربية: نصوص، جداول، صور، أختام، ومحاذاة دقيقة. تصدير PDF وPowerPoint وWord وHTML وصورة، مع قوالب حكومية ومناسبات.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => newFromPack(pack.id as PackId)}
              className="group rounded-[16px] border border-white/12 bg-white/5 p-5 text-right transition hover:border-gold/50 hover:bg-white/8"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-[10px] bg-white/8 text-gold-2">
                  {pack.id === "blank" ? <FilePlus2 className="size-5" /> : <LayoutTemplate className="size-5" />}
                </span>
                <span className="text-[11px] font-bold text-white/45">{pack.pages}</span>
              </div>
              <strong className="block text-[16px]">{pack.title}</strong>
              <span className="mt-1 block text-[13px] leading-6 text-white/60">{pack.desc}</span>
            </button>
          ))}
        </div>

        {hasAutosave && (
          <button
            type="button"
            onClick={restore}
            className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-gold-2"
          >
            <RotateCcw className="size-4" />
            استعادة آخر حفظ تلقائي — {name}
          </button>
        )}
      </main>
    </div>
  );
}
