import { useState } from "react";
import { FileDown, FileText, Image as ImageIcon, Presentation, FileCode2, FileJson, X } from "lucide-react";
import { capturePages, runExport, type ExportFormat } from "@/lib/editor/export";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

const FORMATS: { id: ExportFormat; title: string; desc: string; icon: typeof FileDown }[] = [
  { id: "pdf", title: "PDF", desc: "طباعة وأرشفة رسمية", icon: FileDown },
  { id: "pptx", title: "PowerPoint", desc: "شريحة A4 لكل صفحة", icon: Presentation },
  { id: "docx", title: "Word", desc: "مستند بصري مطابق للتصميم", icon: FileText },
  { id: "png", title: "PNG", desc: "صور عالية الدقة أو أرشيف ZIP", icon: ImageIcon },
  { id: "html", title: "HTML مستقل", desc: "ملف واحد قابل للطباعة والتحرير", icon: FileCode2 },
  { id: "json", title: "ملف المشروع", desc: "حفظ لإعادة الفتح لاحقاً", icon: FileJson },
];

export function ExportDialog() {
  const open = useEditor((s) => s.exportOpen);
  const toggle = useEditor((s) => s.toggle);
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const name = useEditor((s) => s.name);
  const orgName = useEditor((s) => s.orgName);
  const theme = useEditor((s) => s.theme);
  const version = useEditor((s) => s.version);

  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [quality, setQuality] = useState<2 | 3 | 4>(2);
  const [scope, setScope] = useState<"all" | "current">("all");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  if (!open) return null;

  const run = async () => {
    const selected = scope === "all" ? pages : pages.filter((p) => p.id === activePageId);
    const project = { version, name, theme, orgName, pages };
    setBusy(true);
    try {
      let canvases: HTMLCanvasElement[] | null = null;
      if (!["json", "html"].includes(format)) {
        setProgress("تهيئة الصفحات...");
        const nodes = selected
          .map((p) => document.querySelector(`[data-export-page="${p.id}"]`) as HTMLElement | null)
          .filter((n): n is HTMLElement => Boolean(n));
        if (!nodes.length) throw new Error("missing pages");
        canvases = await capturePages(nodes, quality, (i, n) => {
          setProgress(`التقاط الصفحة ${i + 1} من ${n}`);
        });
      }
      setProgress("حفظ الملف...");
      await runExport(format, canvases, project, selected);
      toggle("exportOpen");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-navy/55 p-4 backdrop-blur-sm" onClick={() => !busy && toggle("exportOpen")}>
      <div
        className="w-full max-w-xl rounded-[16px] border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#1b2433]"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-extrabold text-navy dark:text-white">تصدير المستند</h2>
            <p className="text-[12px] text-muted">PDF · PowerPoint · Word · صور · HTML · مشروع</p>
          </div>
          <button type="button" className="grid size-9 place-items-center rounded-[8px] border border-line" onClick={() => toggle("exportOpen")}>
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={cn(
                  "rounded-[12px] border p-3 text-right",
                  format === f.id ? "border-gold bg-gold/10" : "border-line hover:border-gold/60",
                )}
              >
                <Icon className="mb-2 size-5 text-navy-2 dark:text-gold-2" />
                <strong className="block text-[13px]">{f.title}</strong>
                <span className="text-[11px] leading-4 text-muted">{f.desc}</span>
              </button>
            );
          })}
        </div>

        {!["json", "html"].includes(format) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-[11px] font-extrabold text-muted">
              الجودة
              <select
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value) as 2 | 3 | 4)}
                className="h-9 rounded-[8px] border border-line bg-white px-2 text-[13px] font-semibold"
              >
                <option value={2}>قياسية — أسرع</option>
                <option value={3}>عالية</option>
                <option value={4}>طباعة فائقة</option>
              </select>
            </label>
            <label className="grid gap-1 text-[11px] font-extrabold text-muted">
              النطاق
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as "all" | "current")}
                className="h-9 rounded-[8px] border border-line bg-white px-2 text-[13px] font-semibold"
              >
                <option value="all">كل الصفحات ({pages.length})</option>
                <option value="current">الصفحة الحالية فقط</option>
              </select>
            </label>
          </div>
        )}

        {busy && (
          <p className="mt-3 text-center text-[12px] font-bold text-navy-2 dark:text-gold-2">{progress || "جاري التصدير..."}</p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={run}
            className="h-11 flex-1 rounded-[10px] bg-gradient-to-l from-gold to-gold-2 text-[14px] font-extrabold text-navy disabled:opacity-50"
          >
            {busy ? "جاري التصدير..." : "تنزيل الملف"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => toggle("exportOpen")}
            className="h-11 rounded-[10px] border border-line px-4 text-[13px] font-bold"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
