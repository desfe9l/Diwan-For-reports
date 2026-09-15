import { useRef, useState } from "react";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { pageSize } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

/**
 * Horizontal page rail with drag-and-drop reordering.
 *
 * Uses the pointer events API rather than HTML5 drag-and-drop: the rail lives
 * inside a scroll container and HTML5 DnD is unreliable in Safari there.
 */
export function PageRail() {
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const setActivePage = useEditor((s) => s.setActivePage);
  const addPage = useEditor((s) => s.addPage);
  const duplicatePage = useEditor((s) => s.duplicatePage);
  const deletePage = useEditor((s) => s.deletePage);
  const reorderPages = useEditor((s) => s.reorderPages);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const startDrag = (index: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragIndex(index);
    setOverIndex(index);

    const move = (ev: PointerEvent) => {
      let target = index;
      for (const [id, node] of Object.entries(itemRefs.current)) {
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        // RTL rail: the first item sits at the highest x, so compare centres.
        if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
          const found = pages.findIndex((p) => p.id === id);
          if (found >= 0) target = found;
          break;
        }
      }
      setOverIndex(target);
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      let target = index;
      for (const [id, node] of Object.entries(itemRefs.current)) {
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
          const found = pages.findIndex((p) => p.id === id);
          if (found >= 0) target = found;
          break;
        }
      }
      setDragIndex(null);
      setOverIndex(null);
      if (target !== index) reorderPages(index, target);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex h-[132px] items-stretch gap-2 border-t border-line bg-white px-3 py-2 dark:border-white/10 dark:bg-[#161c26]">
      <div className="flex flex-col justify-center gap-1">
        <button
          type="button"
          onClick={() => addPage()}
          className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-navy px-2.5 text-[11px] font-extrabold text-white"
        >
          <Plus className="size-3.5" />
          صفحة
        </button>
        <button
          type="button"
          onClick={() => duplicatePage()}
          title="نسخ الصفحة الحالية"
          className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-line px-2.5 text-[11px] font-extrabold dark:border-white/10"
        >
          <Copy className="size-3.5" />
          نسخ
        </button>
      </div>

      <ul className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1" dir="rtl">
        {pages.map((p, i) => {
          const size = pageSize(p);
          const ratio = size.w / size.h;
          const thumbW = ratio >= 1 ? 92 : 62;
          const thumbH = ratio >= 1 ? Math.round(92 / ratio) : 88;
          return (
            <li
              key={p.id}
              ref={(n) => {
                itemRefs.current[p.id] = n;
              }}
              className={cn(
                "group relative shrink-0 rounded-[8px] border p-1.5",
                p.id === activePageId ? "border-navy bg-navy/5" : "border-line dark:border-white/10",
                dragIndex === i && "opacity-50",
                overIndex === i && dragIndex !== null && dragIndex !== i && "drop-target",
              )}
            >
              <button
                type="button"
                onClick={() => setActivePage(p.id)}
                className="block"
                aria-current={p.id === activePageId}
              >
                <span
                  className="relative mb-1 block overflow-hidden rounded-[4px] border border-line bg-white"
                  style={{ width: `${thumbW}px`, height: `${thumbH}px` }}
                >
                  {p.elements
                    .slice()
                    .sort((a, b) => a.z - b.z)
                    .slice(0, 14)
                    .map((el) => (
                      <span
                        key={el.id}
                        className="absolute block"
                        style={{
                          // Thumbnails are schematic: positions are scaled from
                          // page mm into the fixed thumbnail box.
                          position: "absolute",
                          left: `${(el.x / size.w) * 100}%`,
                          top: `${(el.y / size.h) * 100}%`,
                          width: `${(el.w / size.w) * 100}%`,
                          height: `${(el.h / size.h) * 100}%`,
                          background: thumbnailColor(el.type, el.style?.fill || el.style?.color),
                          borderRadius: el.type === "shape" && el.style?.shape === "circle" ? "999px" : "1px",
                        }}
                      />
                    ))}
                </span>
                <span className="flex items-center justify-between gap-1 text-[10px]">
                  <span className="max-w-[86px] truncate font-bold">{p.name}</span>
                  <span className="tabular-nums text-muted">{i + 1}</span>
                </span>
              </button>

              <span className="absolute top-0.5 left-0.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onPointerDown={startDrag(i)}
                  title="اسحب لإعادة الترتيب"
                  aria-label={`إعادة ترتيب ${p.name}`}
                  className="drag-handle grid size-5 place-items-center rounded bg-white/90 text-muted shadow"
                >
                  <GripVertical className="size-3" />
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deletePage(p.id)}
                    title="حذف الصفحة"
                    aria-label={`حذف ${p.name}`}
                    className="grid size-5 place-items-center rounded bg-white/90 text-danger shadow"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function thumbnailColor(type: string, color?: string) {
  if (color) return color;
  if (type === "image" || type === "logo") return "#dbe2ec";
  if (type === "table") return "#c7d0dd";
  if (type === "line" || type === "divider") return "#c6a05a";
  return "#1f3556";
}