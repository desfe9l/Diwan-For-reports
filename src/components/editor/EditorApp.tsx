import { useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FolderOpen,
  Grid3x3,
  Home,
  Moon,
  Plus,
  Redo2,
  Save,
  Sun,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { HomeScreen } from "./HomeScreen";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { CanvasStage } from "./CanvasStage";
import { ExportDialog } from "./ExportDialog";
import { cn } from "@/lib/utils";

export function EditorApp() {
  const hydrate = useEditor((s) => s.hydrate);
  const hydrated = useEditor((s) => s.hydrated);
  const view = useEditor((s) => s.view);
  const loadProject = useEditor((s) => s.loadProject);

  const projectInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);
  const imageIntent = useRef<{ type: "image" | "logo" | "replace"; targetId?: string }>({ type: "image" });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const openProjectFile = () => projectInput.current?.click();

  if (!hydrated) {
    return (
      <div className="grid h-full place-items-center bg-navy text-white">
        <p className="text-[14px] font-bold text-gold-2">ديوان التقارير</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <Toaster position="top-center" richColors dir="rtl" />
      <input
        ref={projectInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              loadProject(JSON.parse(String(reader.result)));
            } catch {
              toast.error("تعذر قراءة الملف");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const src = String(reader.result);
            const intent = imageIntent.current;
            const api = useEditor.getState();
            if (intent.type === "replace" && intent.targetId) {
              api.updateElement(intent.targetId, { src });
            } else {
              const kind = intent.type === "logo" ? "logo" : "image";
              api.addElement(kind, {
                src,
                name: kind === "logo" ? "شعار" : "صورة",
                w: kind === "logo" ? 32 : 84,
                h: kind === "logo" ? 32 : 56,
              });
            }
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <input
        ref={fontInput}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const fontName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
            const face = new FontFace(fontName, `url(${reader.result})`);
            face
              .load()
              .then((loaded) => {
                document.fonts.add(loaded);
                toast.success(`تم تحميل الخط: ${fontName}`);
              })
              .catch(() => toast.error("تعذر تحميل الخط"));
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />

      {view === "home" ? (
        <HomeScreen onOpenFile={openProjectFile} />
      ) : (
        <Studio
          onOpenFile={openProjectFile}
          onUpload={(kind) => {
            if (kind === "font") fontInput.current?.click();
            else {
              imageIntent.current = { type: kind };
              imageInput.current?.click();
            }
          }}
          onReplaceImage={(id) => {
            imageIntent.current = { type: "replace", targetId: id };
            imageInput.current?.click();
          }}
        />
      )}
    </div>
  );
}

function Studio({
  onOpenFile,
  onUpload,
  onReplaceImage,
}: {
  onOpenFile: () => void;
  onUpload: (kind: "image" | "logo" | "font") => void;
  onReplaceImage: (id: string) => void;
}) {
  const name = useEditor((s) => s.name);
  const setName = useEditor((s) => s.setName);
  const zoom = useEditor((s) => s.zoom);
  const setZoom = useEditor((s) => s.setZoom);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const dark = useEditor((s) => s.dark);
  const toggle = useEditor((s) => s.toggle);
  const showGrid = useEditor((s) => s.showGrid);
  const previewAll = useEditor((s) => s.previewAll);
  const autosaveLabel = useEditor((s) => s.autosaveLabel);
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const setActivePage = useEditor((s) => s.setActivePage);
  const addPage = useEditor((s) => s.addPage);
  const duplicatePage = useEditor((s) => s.duplicatePage);
  const deletePage = useEditor((s) => s.deletePage);
  const movePage = useEditor((s) => s.movePage);
  const setView = useEditor((s) => s.setView);
  const leftOpen = useEditor((s) => s.leftOpen);
  const rightOpen = useEditor((s) => s.rightOpen);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const select = useEditor((s) => s.select);
  const updateElement = useEditor((s) => s.updateElement);
  const commit = useEditor((s) => s.commit);
  const selectedId = useEditor((s) => s.selectedId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggle("exportOpen");
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") select(null);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedId) {
        e.preventDefault();
        const el = useEditor.getState().pages.flatMap((p) => p.elements).find((x) => x.id === selectedId);
        if (!el || el.locked) return;
        const step = e.shiftKey ? 5 : 1;
        const patch: { x?: number; y?: number } = {};
        if (e.key === "ArrowUp") patch.y = el.y - step;
        if (e.key === "ArrowDown") patch.y = el.y + step;
        if (e.key === "ArrowRight") patch.x = el.x + step;
        if (e.key === "ArrowLeft") patch.x = el.x - step;
        updateElement(el.id, patch);
        commit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, toggle, duplicateSelected, deleteSelected, select, selectedId, updateElement, commit]);

  return (
    <div className="grid h-full min-h-0 grid-rows-[56px_minmax(0,1fr)] bg-paper dark:bg-[#111722]">
      <header className="z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-gradient-to-l from-navy-2 to-navy px-3 text-white">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setView("home")} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8" title="الرئيسية">
            <Home className="size-4" />
          </button>
          <div className="hidden sm:block">
            <strong className="block text-[13px] font-extrabold leading-none">ديوان التقارير</strong>
            <span className="text-[10px] text-white/60">محرر A4 رسمي</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <button type="button" disabled={past.length <= 1} onClick={undo} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8 disabled:opacity-40" title="تراجع">
            <Undo2 className="size-4" />
          </button>
          <button type="button" disabled={!future.length} onClick={redo} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8 disabled:opacity-40" title="إعادة">
            <Redo2 className="size-4" />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mx-1 hidden h-9 max-w-[220px] min-w-0 rounded-[8px] border border-white/15 bg-white/8 px-3 text-center text-[13px] font-bold text-white outline-none md:block"
          />
          <button type="button" onClick={() => toggle("showGrid")} className={cn("grid size-9 place-items-center rounded-[8px] border border-white/15", showGrid ? "bg-white/20" : "bg-white/8")} title="الشبكة">
            <Grid3x3 className="size-4" />
          </button>
          <button type="button" onClick={() => setZoom(zoom - 0.08)} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8">
            <ZoomOut className="size-4" />
          </button>
          <span className="w-10 text-center text-[12px] font-bold">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(zoom + 0.08)} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8">
            <ZoomIn className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <span className="hidden text-[11px] text-white/55 lg:block">{autosaveLabel}</span>
          <button type="button" onClick={() => toggle("previewAll")} className={cn("hidden h-9 rounded-[8px] border border-white/15 px-2 text-[12px] font-bold sm:inline-flex sm:items-center", previewAll ? "bg-white/20" : "bg-white/8")}>
            كل الصفحات
          </button>
          <button type="button" onClick={() => toggle("dark")} className="grid size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8">
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button type="button" onClick={onOpenFile} className="hidden size-9 place-items-center rounded-[8px] border border-white/15 bg-white/8 sm:grid" title="فتح">
            <FolderOpen className="size-4" />
          </button>
          <button type="button" onClick={() => toggle("exportOpen")} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-gradient-to-l from-gold to-gold-2 px-3 text-[12px] font-extrabold text-navy">
            <Download className="size-4" />
            تصدير
          </button>
        </div>
      </header>

      <div className="relative grid min-h-0 lg:grid-cols-[280px_minmax(0,1fr)_128px_340px]">
        <div className={cn("min-h-0", "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:w-[280px] max-lg:shadow-2xl", !leftOpen && "max-lg:hidden")}>
          <LeftPanel onUpload={onUpload} />
        </div>

        <CanvasStage />

        <aside className="hidden min-h-0 flex-col overflow-auto border-x border-line bg-white/50 p-2.5 dark:border-white/10 dark:bg-white/5 lg:flex">
          <button type="button" onClick={addPage} className="mb-2 inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border border-line bg-white text-[12px] font-extrabold dark:border-white/10 dark:bg-white/5">
            <Plus className="size-3.5" /> صفحة
          </button>
          <div className="mb-2 grid grid-cols-3 gap-1">
            <button type="button" onClick={duplicatePage} className="grid h-8 place-items-center rounded-[8px] border border-line bg-white dark:border-white/10 dark:bg-white/5" title="نسخ الصفحة">
              <Copy className="size-3.5" />
            </button>
            <button type="button" onClick={() => movePage(-1)} className="grid h-8 place-items-center rounded-[8px] border border-line bg-white dark:border-white/10 dark:bg-white/5">
              <ChevronUp className="size-3.5" />
            </button>
            <button type="button" onClick={() => movePage(1)} className="grid h-8 place-items-center rounded-[8px] border border-line bg-white dark:border-white/10 dark:bg-white/5">
              <ChevronDown className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-2">
            {pages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePage(p.id)}
                className={cn(
                  "rounded-[8px] border p-1.5 text-right",
                  p.id === activePageId ? "border-gold bg-gold/10" : "border-line bg-white/70 dark:border-white/10 dark:bg-white/5",
                )}
              >
                <span className="mx-auto mb-1 block h-[92px] w-[64px] overflow-hidden rounded-[3px] border border-line bg-white shadow-sm">
                  <span className="block h-3 bg-navy/80" />
                  <span className="block h-0.5 bg-gold" />
                  <span className="mt-2 block h-1.5 w-10 bg-navy/20" />
                  <span className="mt-1 block h-1 w-8 bg-navy/15" />
                </span>
                <span className="flex items-center justify-between text-[10px] text-muted">
                  <strong className="max-w-[70px] truncate text-[11px] text-ink dark:text-white">{p.name}</strong>
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={deletePage} className="mt-2 inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-red-200 bg-red-50 text-[11px] font-bold text-danger">
            <Trash2 className="size-3.5" /> حذف الصفحة
          </button>
        </aside>

        <div className={cn("min-h-0", "max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:w-[320px] max-lg:shadow-2xl", !rightOpen && "max-lg:hidden")}>
          <RightPanel onReplaceImage={onReplaceImage} />
        </div>

        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:hidden">
          <button type="button" onClick={() => toggle("leftOpen")} className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white">
            عناصر
          </button>
          <button type="button" onClick={addPage} className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white">
            صفحة
          </button>
          <button type="button" onClick={() => toggle("rightOpen")} className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white">
            خصائص
          </button>
        </div>
      </div>
      <ExportDialog />
    </div>
  );
}
