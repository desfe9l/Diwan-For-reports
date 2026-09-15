import { useMemo, useRef, useState } from "react";
import { MIN_SIZE, pageSize, type CanvasEl, type Page } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { clamp, cn, round } from "@/lib/utils";
import { ElementNode } from "./ElementNode";

type Op =
  | {
      kind: "move" | "resize" | "rotate";
      id: string;
      handle?: string;
      startX: number;
      startY: number;
      orig: CanvasEl;
      pageId: string;
    }
  | null;

export function CanvasStage({ onDropImage }: { onDropImage?: (file: File, at?: { x: number; y: number }) => void }) {
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const selectedId = useEditor((s) => s.selectedId);
  const zoom = useEditor((s) => s.zoom);
  const previewAll = useEditor((s) => s.previewAll);
  const showGrid = useEditor((s) => s.showGrid);
  const snapGrid = useEditor((s) => s.snapGrid);
  const snapElements = useEditor((s) => s.snapElements);
  const select = useEditor((s) => s.select);
  const replaceElement = useEditor((s) => s.replaceElement);
  const commit = useEditor((s) => s.commit);
  const setActivePage = useEditor((s) => s.setActivePage);

  const opRef = useRef<Op>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [dropping, setDropping] = useState(false);
  const pageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /**
   * Translate a drop point into page millimetres.
   *
   * The drop target is resolved from the element under the pointer rather than
   * a ref, because the author may drop onto any page — including one that is not
   * the active page in the all-pages preview.
   */
  const dropPoint = (e: React.DragEvent): { x: number; y: number; pageId: string } | null => {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-page-id]");
    if (!target) return null;
    const pageId = target.dataset.pageId;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return null;
    const size = pageSize(page);
    const rect = target.getBoundingClientRect();
    return {
      pageId: page.id,
      x: ((e.clientX - rect.left) / rect.width) * size.w,
      y: ((e.clientY - rect.top) / rect.height) * size.h,
    };
  };

  const visible = useMemo(
    () => (previewAll ? pages : pages.filter((p) => p.id === activePageId)),
    [pages, previewAll, activePageId],
  );

  const startOp = (
    e: React.PointerEvent,
    page: Page,
    el: CanvasEl,
    kind: "move" | "resize" | "rotate",
    handle?: string,
  ) => {
    if (el.locked) {
      select(el.id);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    select(el.id);
    setActivePage(page.id);

    const pageEl = pageRefs.current[page.id];
    if (!pageEl) return;
    const size = pageSize(page);
    // Snapshot the live page geometry once: reading it per pointermove would
    // force a layout on every frame of a drag.
    const rect = pageEl.getBoundingClientRect();
    const scaleX = size.w / rect.width;
    const scaleY = size.h / rect.height;
    const toMm = (ev: { clientX: number; clientY: number }) => ({
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY,
    });

    const start = toMm(e);
    opRef.current = {
      kind,
      id: el.id,
      handle,
      startX: start.x,
      startY: start.y,
      orig: { ...el, style: { ...el.style } },
      pageId: page.id,
    };

    const others = page.elements.filter((x) => x.id !== el.id && !x.hidden);

    const move = (ev: PointerEvent) => {
      const op = opRef.current;
      if (!op) return;
      const cur = toMm(ev);
      const dx = cur.x - op.startX;
      const dy = cur.y - op.startY;
      const next: CanvasEl = { ...op.orig, style: { ...op.orig.style } };

      if (op.kind === "move") {
        next.x = op.orig.x + dx;
        next.y = op.orig.y + dy;
        applySnap(next, others, size, snapGrid, snapElements, setGuides);
      } else if (op.kind === "resize") {
        resizeByHandle(next, op.orig, op.handle || "se", dx, dy, ev.shiftKey);
      } else if (op.kind === "rotate") {
        const cx = op.orig.x + op.orig.w / 2;
        const cy = op.orig.y + op.orig.h / 2;
        const a0 = Math.atan2(op.startY - cy, op.startX - cx);
        const a1 = Math.atan2(cur.y - cy, cur.x - cx);
        const raw = (op.orig.rotation || 0) + ((a1 - a0) * 180) / Math.PI;
        next.rotation = ev.shiftKey ? Math.round(raw / 15) * 15 : round(raw % 360);
      }
      next.w = clamp(next.w, MIN_SIZE, size.w);
      next.h = clamp(next.h, MIN_SIZE, size.h);
      next.x = clamp(next.x, 0, Math.max(0, size.w - next.w));
      next.y = clamp(next.y, 0, Math.max(0, size.h - next.h));
      replaceElement(next, true);
    };

    const up = () => {
      opRef.current = null;
      setGuides({ v: [], h: [] });
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      commit();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className={cn("studio-grid relative min-h-0 min-w-0 overflow-auto px-6 py-8", dropping && "is-dropping")}
      dir="ltr"
      onPointerDown={() => select(null)}
      onDragOver={(e) => {
        if (!onDropImage || !e.dataTransfer.types.includes("Files")) return;
        // Claiming the drop is what suppresses the browser's "open the file" handoff.
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDropping(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDropping(false);
      }}
      onDrop={(e) => {
        setDropping(false);
        if (!onDropImage) return;
        const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
        if (!file) return;
        e.preventDefault();
        const at = dropPoint(e);
        if (at) setActivePage(at.pageId);
        onDropImage(file, at ? { x: at.x, y: at.y } : undefined);
      }}
    >
      {dropping && (
        <div className="pointer-events-none sticky top-0 z-50 mx-auto w-max rounded-full border border-gold/40 bg-white/95 px-4 py-1.5 text-[11px] font-extrabold text-navy shadow-sm dark:bg-[#161c26] dark:text-gold-2">
          أفلت الصورة لإضافتها إلى الصفحة
        </div>
      )}
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-10" dir="rtl">
        {visible.map((page) => {
          const size = pageSize(page);
          const isActive = page.id === activePageId;
          return (
            <div key={page.id} className="page-frame" style={{ transform: `scale(${zoom})` }}>
              <div className="mb-2 flex items-center justify-between gap-4 text-[12px] text-muted" dir="rtl">
                <strong className="text-ink dark:text-white">{page.name}</strong>
                <span className="tabular-nums">
                  {previewAll
                    ? `صفحة ${pages.findIndex((p) => p.id === page.id) + 1} من ${pages.length}`
                    : `${round(size.w)} × ${round(size.h)} مم`}
                </span>
              </div>
              <div
                ref={(n) => {
                  pageRefs.current[page.id] = n;
                }}
                data-page-id={page.id}
                className={`report-page ${showGrid ? "show-grid" : ""} ${isActive ? "ring-2 ring-gold ring-offset-8" : ""}`}
                style={{ width: `${size.w}mm`, height: `${size.h}mm`, background: page.bg || "#fff" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setActivePage(page.id);
                  select(null);
                }}
              >
                {page.elements
                  .slice()
                  .sort((a, b) => a.z - b.z)
                  .map((el) => (
                    <ElementNode
                      key={el.id}
                      el={el}
                      selected={el.id === selectedId}
                      interactive
                      onPointerDown={(e, kind, handle) => startOp(e, page, el, kind, handle)}
                    />
                  ))}
                {isActive &&
                  guides.v.map((x) => <div key={`v${x}`} className="guide-v" style={{ left: `${x}mm` }} />)}
                {isActive &&
                  guides.h.map((y) => <div key={`h${y}`} className="guide-h" style={{ top: `${y}mm` }} />)}
              </div>
            </div>
          );
        })}
      </div>
      <ExportCapture pages={pages} />
    </div>
  );
}

/**
 * Hidden 1:1 pages used by export capture. Rendered off-screen (not
 * `display:none`) so html2canvas still measures real boxes and loads images.
 */
function ExportCapture({ pages }: { pages: Page[] }) {
  return (
    <div
      id="export-root"
      className="pointer-events-none fixed top-0 left-[-2400px] z-[-1]"
      aria-hidden
    >
      {pages.map((page) => {
        const size = pageSize(page);
        return (
          <div
            key={page.id}
            data-export-page={page.id}
            className="report-page"
            style={{ width: `${size.w}mm`, height: `${size.h}mm`, background: page.bg || "#fff" }}
          >
            {page.elements
              .slice()
              .sort((a, b) => a.z - b.z)
              .map((el) => (
                <ElementNode key={el.id} el={el} selected={false} interactive={false} onPointerDown={() => {}} />
              ))}
          </div>
        );
      })}
    </div>
  );
}

function resizeByHandle(next: CanvasEl, orig: CanvasEl, handle: string, dx: number, dy: number, lock: boolean) {
  let { x, y, w, h } = orig;
  if (handle.includes("e")) w = orig.w + dx;
  if (handle.includes("s")) h = orig.h + dy;
  if (handle.includes("w")) {
    x = orig.x + dx;
    w = orig.w - dx;
  }
  if (handle.includes("n")) {
    y = orig.y + dy;
    h = orig.h - dy;
  }
  if (lock) {
    const ratio = orig.w / orig.h || 1;
    if (handle === "e" || handle === "w") h = w / ratio;
    else if (handle === "n" || handle === "s") w = h * ratio;
    else h = w / ratio;
  }
  if (w < MIN_SIZE) {
    if (handle.includes("w")) x = orig.x + orig.w - MIN_SIZE;
    w = MIN_SIZE;
  }
  if (h < MIN_SIZE) {
    if (handle.includes("n")) y = orig.y + orig.h - MIN_SIZE;
    h = MIN_SIZE;
  }
  next.x = x;
  next.y = y;
  next.w = w;
  next.h = h;
}

function applySnap(
  el: CanvasEl,
  others: CanvasEl[],
  size: { w: number; h: number },
  snapGrid: boolean,
  snapEl: boolean,
  setGuides: (g: { v: number[]; h: number[] }) => void,
) {
  const g = 5;
  const v: number[] = [];
  const h: number[] = [];
  if (snapGrid) {
    el.x = Math.round(el.x / g) * g;
    el.y = Math.round(el.y / g) * g;
  }
  if (snapEl) {
    const edges = [0, size.w / 2, size.w, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
    const hedges = [0, size.h / 2, size.h, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
    const mineV = [el.x, el.x + el.w / 2, el.x + el.w];
    const mineH = [el.y, el.y + el.h / 2, el.y + el.h];
    const thr = 1.4;
    for (const m of mineV) {
      for (const t of edges) {
        if (Math.abs(m - t) < thr) {
          el.x += t - m;
          v.push(t);
        }
      }
    }
    for (const m of mineH) {
      for (const t of hedges) {
        if (Math.abs(m - t) < thr) {
          el.y += t - m;
          h.push(t);
        }
      }
    }
  }
  setGuides({ v: [...new Set(v)], h: [...new Set(h)] });
}