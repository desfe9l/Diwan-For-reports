import { useEffect, useRef } from "react";
import {
  Check,
  Download,
  FolderOpen,
  Grid3x3,
  Home,
  Moon,
  Redo2,
  Save,
  Sun,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { useEditor, saveLabel, type SaveState } from "@/lib/editor/store";
import { pageSize } from "@/lib/editor/model";
import { fitImageBox, prepareImage } from "@/lib/editor/images";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { CanvasStage } from "./CanvasStage";
import { PageRail } from "./PageRail";
import { ExportDialog } from "./ExportDialog";
import { cn } from "@/lib/utils";

/**
 * The studio shell.
 *
 * Route-level concerns (site chrome, navigation) live in `SiteHeader`; this
 * component owns the editor chrome, the hidden file inputs the panels drive,
 * and the global keyboard map.
 */
export function EditorApp() {
  const hydrate = useEditor((s) => s.hydrate);
  const hydrated = useEditor((s) => s.hydrated);

  const projectInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fontInput = useRef<HTMLInputElement>(null);
  const imageIntent = useRef<{ type: "image" | "logo" | "replace"; targetId?: string }>({ type: "image" });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // The studio is a fixed-height shell; the marketing pages scroll normally.
  useEffect(() => {
    document.body.classList.add("is-editor");
    return () => document.body.classList.remove("is-editor");
  }, []);

  /**
   * Shared by the file picker and canvas drag-and-drop.
   *
   * `at` places a dropped image where the pointer landed instead of the
   * palette's default spot, which is what makes dropping feel direct.
   */
  const ingestImage = async (file: File, at?: { x: number; y: number }) => {
    const api = useEditor.getState();
    const intent = imageIntent.current;
    try {
      const img = await prepareImage(file);
      const kind = intent.type === "logo" ? "logo" : "image";

      if (intent.type === "replace" && intent.targetId) {
        // Swapping the source keeps the author's box, rotation, and effects.
        api.updateElement(intent.targetId, { src: img.src });
      } else {
        const max = kind === "logo" ? { w: 40, h: 40 } : { w: 110, h: 90 };
        const box = fitImageBox(img, max);
        const page = api.pages.find((p) => p.id === api.activePageId);
        const size = page ? pageSize(page) : { w: 210, h: 297 };
        api.addElement(kind, {
          src: img.src,
          name: kind === "logo" ? "شعار" : "صورة",
          w: box.w,
          h: box.h,
          x: at ? Math.max(0, Math.min(at.x - box.w / 2, size.w - box.w)) : undefined,
          y: at ? Math.max(0, Math.min(at.y - box.h / 2, size.h - box.h)) : undefined,
        });
      }

      if (img.resized) {
        toast.message("تم تصغير الصورة للحفظ", {
          description: "حُفظت بأبعاد مناسبة للطباعة لتخفيف حجم المشروع.",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر إضافة الصورة");
    } finally {
      imageIntent.current = { type: "image" };
    }
  };

  if (!hydrated) {
    return (
      <div className="grid h-full place-items-center bg-navy text-white">
        <div className="text-center">
          <p className="text-[15px] font-extrabold text-gold-2">فيصل العنزي</p>
          <p className="mt-1 text-[12px] text-white/60">جارٍ تحضير مساحة العمل…</p>
        </div>
      </div>
    );
  }

  const openFile = () => projectInput.current?.click();
  const upload = (kind: "image" | "logo" | "font") => {
    if (kind === "font") fontInput.current?.click();
    else {
      imageIntent.current = { type: kind };
      imageInput.current?.click();
    }
  };
  const replaceImage = (id: string) => {
    imageIntent.current = { type: "replace", targetId: id };
    imageInput.current?.click();
  };

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
              void useEditor.getState().importProject(JSON.parse(String(reader.result)));
            } catch {
              toast.error("تعذر قراءة الملف — تأكد أنه ملف مشروع بصيغة JSON");
            }
          };
          reader.onerror = () => toast.error("تعذر قراءة الملف");
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
          e.target.value = "";
          if (file) void ingestImage(file);
        }}
      />

      <input
        ref={fontInput}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const fontName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
            const face = new FontFace(fontName, `url(${reader.result})`);
            face
              .load()
              .then((loaded) => {
                document.fonts.add(loaded);
                // Registering with the store is what makes the font selectable;
                // adding it to `document.fonts` alone leaves it invisible to the UI.
                useEditor.getState().registerFont(fontName);
                toast.success(`تم تحميل الخط: ${fontName}`);
              })
              .catch(() => toast.error("تعذر تحميل الخط — تأكد من صيغة الملف"));
          };
          reader.onerror = () => toast.error("تعذر قراءة ملف الخط");
          reader.readAsDataURL(file);
        }}
      />

      <Studio onOpenFile={openFile} onUpload={upload} onReplaceImage={replaceImage} onDropImage={ingestImage} />
    </div>
  );
}

function Studio({
  onOpenFile,
  onUpload,
  onReplaceImage,
  onDropImage,
}: {
  onOpenFile: () => void;
  onUpload: (kind: "image" | "logo" | "font") => void;
  onReplaceImage: (id: string) => void;
  onDropImage: (file: File, at?: { x: number; y: number }) => Promise<void>;
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
  const saveState = useEditor((s) => s.saveState);
  const savedAt = useEditor((s) => s.savedAt);
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const addPage = useEditor((s) => s.addPage);
  const leftOpen = useEditor((s) => s.leftOpen);
  const rightOpen = useEditor((s) => s.rightOpen);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const copySelected = useEditor((s) => s.copySelected);
  const pasteClipboard = useEditor((s) => s.pasteClipboard);
  const select = useEditor((s) => s.select);
  const updateElement = useEditor((s) => s.updateElement);
  const commit = useEditor((s) => s.commit);
  const selectedId = useEditor((s) => s.selectedId);
  const saveNow = useEditor((s) => s.saveNow);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const activeSize = pageSize(activePage);

  // A 20 s heartbeat keeps "آخر حفظ منذ …" honest without a per-second store write.
  useEffect(() => {
    const id = setInterval(() => {
      useEditor.setState({ clockTick: Date.now() });
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // Flush pending work when the tab is hidden or closed mid-edit.
  useEffect(() => {
    const flush = () => {
      if (useEditor.getState().saveState === "dirty") void saveNow();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [saveNow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === "z") {
        // While the caret is in a field or the in-place text editor, the browser's
        // own undo stack owns Cmd/Ctrl+Z — hijacking it would revert whole project
        // states when the author meant to undo a few characters.
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && key === "y") {
        if (typing) return;
        e.preventDefault();
        redo();
        return;
      }
      if (meta && key === "s") {
        e.preventDefault();
        void saveNow();
        return;
      }
      if (meta && key === "e") {
        e.preventDefault();
        toggle("exportOpen");
        return;
      }
      if (meta && key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (meta && key === "c") {
        if (typing) return;
        e.preventDefault();
        copySelected();
        return;
      }
      if (meta && key === "v") {
        if (typing) return;
        e.preventDefault();
        pasteClipboard();
        return;
      }
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
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
  }, [
    undo,
    redo,
    saveNow,
    toggle,
    duplicateSelected,
    deleteSelected,
    copySelected,
    pasteClipboard,
    select,
    selectedId,
    updateElement,
    commit,
  ]);

  const label = saveLabel(saveState, savedAt, Date.now());

  return (
    <div className="grid h-full min-h-0 grid-rows-[52px_minmax(0,1fr)] bg-paper dark:bg-[#111722]">
      <header className="z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-white px-3 dark:border-white/10 dark:bg-[#161c26]">
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-line px-2.5 text-[12px] font-extrabold dark:border-white/10"
            title="العودة إلى الصفحة الرئيسية"
          >
            <Home className="size-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </a>
          <div className="hidden md:block">
            <strong className="block text-[13px] font-extrabold leading-none">فيصل العنزي</strong>
            <span className="text-[10px] text-muted">منصة تصميم التقارير</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <IconButton onClick={undo} disabled={past.length <= 1} title="تراجع (⌘Z)">
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton onClick={redo} disabled={!future.length} title="إعادة (⌘⇧Z)">
            <Redo2 className="size-4" />
          </IconButton>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="اسم المشروع"
            className="mx-1 hidden h-9 max-w-[240px] min-w-0 rounded-[8px] border border-line px-3 text-center text-[13px] font-bold outline-none focus:border-navy-2 md:block dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <IconButton onClick={() => toggle("showGrid")} active={showGrid} title="الشبكة">
            <Grid3x3 className="size-4" />
          </IconButton>
          <IconButton onClick={() => setZoom(zoom - 0.08)} title="تصغير">
            <ZoomOut className="size-4" />
          </IconButton>
          <span className="w-11 text-center text-[12px] font-bold tabular-nums">{Math.round(zoom * 100)}%</span>
          <IconButton onClick={() => setZoom(zoom + 0.08)} title="تكبير">
            <ZoomIn className="size-4" />
          </IconButton>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <SaveBadge state={saveState} label={label} onClick={() => void saveNow()} />
          <button
            type="button"
            onClick={() => toggle("previewAll")}
            aria-pressed={previewAll}
            className={cn(
              "hidden h-9 rounded-[8px] border px-2.5 text-[12px] font-bold lg:inline-flex lg:items-center",
              previewAll ? "border-navy bg-navy text-white" : "border-line dark:border-white/10",
            )}
          >
            كل الصفحات
          </button>
          <IconButton onClick={() => toggle("dark")} title={dark ? "الوضع النهاري" : "الوضع الليلي"}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
          <IconButton onClick={onOpenFile} title="استيراد مشروع من ملف JSON">
            <FolderOpen className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => toggle("exportOpen")}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-navy px-3 text-[12px] font-extrabold text-white"
          >
            <Download className="size-4" />
            تصدير
          </button>
        </div>
      </header>

      <div className="relative grid min-h-0 lg:h-full lg:grid-cols-[292px_minmax(0,1fr)_336px] lg:overflow-hidden">
        <div
          className={cn(
            "min-h-0",
            "max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-30 max-lg:w-[292px] max-lg:shadow-2xl",
            !leftOpen && "max-lg:hidden",
          )}
        >
          <LeftPanel onUpload={onUpload} />
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] lg:overflow-hidden">
          <CanvasStage onDropImage={onDropImage} />
          <PageRail />
        </div>

        <div
          className={cn(
            "min-h-0",
            "max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-30 max-lg:w-[320px] max-lg:shadow-2xl",
            !rightOpen && "max-lg:hidden",
          )}
        >
          <RightPanel onReplaceImage={onReplaceImage} />
        </div>

        <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => toggle("leftOpen")}
            className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white"
          >
            عناصر
          </button>
          <button
            type="button"
            onClick={() => addPage()}
            className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white"
          >
            صفحة
          </button>
          <button
            type="button"
            onClick={() => toggle("rightOpen")}
            className="h-10 rounded-full bg-navy px-4 text-[12px] font-extrabold text-white"
          >
            خصائص
          </button>
        </div>

        <p className="pointer-events-none absolute right-3 top-2 z-10 hidden text-[11px] text-muted lg:block">
          {activePage?.name} · {Math.round(activeSize.w)} × {Math.round(activeSize.h)} مم ·{" "}
          {activePage?.elements.length || 0} عنصر
        </p>
      </div>
      <ExportDialog />
    </div>
  );
}

function IconButton({
  onClick,
  disabled,
  active,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "grid size-9 place-items-center rounded-[8px] border disabled:opacity-40",
        active ? "border-navy bg-navy text-white" : "border-line dark:border-white/10",
      )}
    >
      {children}
    </button>
  );
}

function SaveBadge({ state, label, onClick }: { state: SaveState; label: string; onClick: () => void }) {
  const tone =
    state === "error"
      ? "border-red-200 bg-red-50 text-danger dark:border-red-500/30 dark:bg-red-500/10"
      : state === "dirty" || state === "saving"
        ? "border-line text-muted dark:border-white/10"
        : "border-ok/30 bg-ok/5 text-ok";
  return (
    <button
      type="button"
      onClick={onClick}
      title="حفظ الآن (⌘S)"
      className={cn(
        "hidden h-9 items-center gap-1.5 rounded-[8px] border px-2.5 text-[11px] font-bold xl:inline-flex",
        tone,
      )}
    >
      {state === "saved" ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
      {label}
    </button>
  );
}