import { useEffect, useRef } from "react";
import { ICONS, cssFont, parseTable, type CanvasEl } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

interface Props {
  el: CanvasEl;
  selected: boolean;
  interactive: boolean;
  onPointerDown: (e: React.PointerEvent, kind: "move" | "resize" | "rotate", handle?: string) => void;
}

/** Types whose text can be edited in place with a double click. */
const EDITABLE = new Set(["text", "box", "stat", "stamp", "progress"]);

export function ElementNode({ el, selected, interactive, onPointerDown }: Props) {
  const updateElement = useEditor((s) => s.updateElement);
  const commit = useEditor((s) => s.commit);
  const textRef = useRef<HTMLDivElement>(null);
  const editing = useRef(false);

  // A remount (undo, page switch) must never leave a stale contentEditable DOM
  // node behind: the rendered `{el.content}` would be out of sync with it.
  useEffect(() => {
    if (editing.current && textRef.current && textRef.current.isContentEditable) {
      editing.current = false;
      textRef.current.contentEditable = "false";
      textRef.current.classList.remove("editing");
    }
  }, [el.id]);

  const startEdit = (e: React.MouseEvent) => {
    if (!interactive || el.locked || !EDITABLE.has(el.type)) return;
    e.stopPropagation();
    const node = textRef.current;
    if (!node) return;
    editing.current = true;
    node.contentEditable = "true";
    node.classList.add("editing");
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const finishEdit = () => {
    const node = textRef.current;
    if (!node || !editing.current) return;
    editing.current = false;
    node.contentEditable = "false";
    node.classList.remove("editing");
    const next = node.innerText;
    if (next !== el.content) updateElement(el.id, { content: next });
    commit();
  };

  if (el.hidden) return null;

  return (
    <div
      data-el-id={el.id}
      className={cn("canvas-el", selected && interactive && "selected", el.locked && "locked")}
      style={{
        left: `${el.x}mm`,
        top: `${el.y}mm`,
        width: `${el.w}mm`,
        height: `${el.h}mm`,
        transform: `rotate(${el.rotation || 0}deg)`,
        opacity: el.opacity ?? 1,
        zIndex: el.z,
        boxShadow: el.style?.shadow || undefined,
        cursor: el.locked ? "not-allowed" : interactive ? "move" : "default",
      }}
      onPointerDown={(e) => {
        if (!interactive) return;
        if ((e.target as HTMLElement).closest(".handle, .rotate-handle")) return;
        onPointerDown(e, "move");
      }}
      onDoubleClick={startEdit}
    >
      <ElementContent el={el} textRef={textRef} onBlur={finishEdit} />
      {selected && interactive && !el.locked && (
        <>
          {HANDLES.map((h) => (
            <div
              key={h}
              className={cn("handle", h)}
              onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDown(e, "resize", h);
              }}
            />
          ))}
          <div
            className="rotate-handle"
            onPointerDown={(e) => {
              e.stopPropagation();
              onPointerDown(e, "rotate");
            }}
          />
        </>
      )}
    </div>
  );
}

function ElementContent({
  el,
  textRef,
  onBlur,
}: {
  el: CanvasEl;
  textRef: React.RefObject<HTMLDivElement | null>;
  onBlur: () => void;
}) {
  const s = el.style || {};
  const textStyle: React.CSSProperties = {
    fontFamily: cssFont(s.fontFamily),
    fontSize: `${s.fontSize || 14}pt`,
    color: s.color || "#172033",
    fontWeight: s.fontWeight || 600,
    fontStyle: (s.fontStyle as React.CSSProperties["fontStyle"]) || "normal",
    textAlign: s.textAlign || "right",
    lineHeight: s.lineHeight || 1.45,
    letterSpacing: s.letterSpacing ? `${s.letterSpacing}mm` : undefined,
    textShadow: s.textShadow || "none",
  };

  if (el.type === "text") {
    return (
      <div
        ref={textRef}
        className="el-text"
        style={textStyle}
        onPointerDown={(e) => e.currentTarget.isContentEditable && e.stopPropagation()}
        onBlur={onBlur}
      >
        {el.content}
      </div>
    );
  }

  if (el.type === "box" || el.type === "stat") {
    return (
      <div
        ref={textRef}
        className="el-box"
        style={{
          ...textStyle,
          background: s.fill || s.background || "#f7f8fb",
          border: `${s.borderWidth ?? 0.35}mm solid ${s.borderColor || "#d9dee8"}`,
          borderRadius: `${s.radius ?? 4}mm`,
          padding: `${s.padding ?? 4}mm`,
          display: "flex",
          alignItems: el.type === "stat" ? "center" : "flex-start",
          justifyContent:
            s.textAlign === "center" ? "center" : s.textAlign === "left" ? "flex-end" : "flex-start",
        }}
        onPointerDown={(e) => e.currentTarget.isContentEditable && e.stopPropagation()}
        onBlur={onBlur}
      >
        {el.content}
      </div>
    );
  }

  if (el.type === "progress") {
    const value = Math.max(0, Math.min(100, Number(s.value) || 0));
    const barHeight = Math.max(2, el.h * 0.28);
    return (
      <div
        ref={textRef}
        className="el-box"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "1.4mm",
          direction: "rtl",
          fontFamily: cssFont(s.fontFamily),
          fontSize: `${s.fontSize || 10}pt`,
          color: s.color || "#172033",
          fontWeight: s.fontWeight || 700,
        }}
        onPointerDown={(e) => e.currentTarget.isContentEditable && e.stopPropagation()}
        onBlur={onBlur}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span>{el.content}</span>
          <span style={{ color: s.fill || "#071d3d" }}>{value}%</span>
        </div>
        <div
          style={{
            height: `${barHeight}mm`,
            background: s.background || "#e8ecf3",
            borderRadius: `${s.radius ?? 3}mm`,
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${value}%`, height: "100%", background: s.fill || "#071d3d" }} />
        </div>
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: s.fill || "#071d3d",
          border: `${s.borderWidth || 0}mm solid ${s.borderColor || "transparent"}`,
          borderRadius: s.shape === "circle" ? "999mm" : `${s.radius || 0}mm`,
        }}
      />
    );
  }

  if (el.type === "line") {
    const vertical = el.h > el.w;
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div
          style={{
            background: s.color || "#c6a05a",
            width: vertical ? `${s.stroke || 0.8}mm` : "100%",
            height: vertical ? "100%" : `${s.stroke || 0.8}mm`,
          }}
        />
      </div>
    );
  }

  if (el.type === "divider") {
    const c = s.color || "#c6a05a";
    return (
      <div className="flex h-full w-full items-center gap-1.5 px-1">
        <span className="h-px flex-1" style={{ background: c, height: `${s.stroke || 0.5}mm` }} />
        <span
          className="shrink-0"
          style={{
            width: "3.6mm",
            height: "3.6mm",
            border: `0.4mm solid ${c}`,
            transform: "rotate(45deg)",
          }}
        />
        <span className="h-px flex-1" style={{ background: c, height: `${s.stroke || 0.5}mm` }} />
      </div>
    );
  }

  if (el.type === "image" || el.type === "logo" || el.type === "qr") {
    if (!el.src) {
      return (
        <div className="grid h-full w-full place-items-center bg-[#f4f6fa] text-[9pt] font-bold text-muted">
          لا توجد صورة
        </div>
      );
    }
    return (
      <img
        alt=""
        src={el.src}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: s.objectFit || (el.type === "logo" || el.type === "qr" ? "contain" : "cover"),
          objectPosition: `${s.objectX ?? 50}% ${s.objectY ?? 50}%`,
          borderRadius: `${s.radius || 0}mm`,
          pointerEvents: "none",
        }}
      />
    );
  }

  if (el.type === "icon") {
    const d = ICONS[el.icon || "star"] || ICONS.star;
    return (
      <div className="grid h-full w-full place-items-center" style={{ color: s.color || "#c6a05a" }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={s.stroke || 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <path d={d} />
        </svg>
      </div>
    );
  }

  if (el.type === "stamp") {
    return (
      <div
        ref={textRef}
        className="grid h-full w-full place-items-center text-center"
        style={{
          borderRadius: "999px",
          border: `0.7mm double ${s.borderColor || s.color || "#c6a05a"}`,
          color: s.color || "#c6a05a",
          fontFamily: cssFont(s.fontFamily || "Amiri"),
          fontWeight: 700,
          fontSize: `${s.fontSize || 12}pt`,
          transform: "rotate(-12deg)",
          lineHeight: 1.2,
          whiteSpace: "pre-wrap",
        }}
        onPointerDown={(e) => e.currentTarget.isContentEditable && e.stopPropagation()}
        onBlur={onBlur}
      >
        {el.content || "معتمد"}
      </div>
    );
  }

  if (el.type === "table") {
    const cols = s.cols || 3;
    const rows = s.rows || 4;
    const data = parseTable(el.content, cols, rows);
    return (
      <table
        className="h-full w-full border-collapse"
        style={{
          tableLayout: "fixed",
          fontFamily: cssFont(s.fontFamily),
          fontSize: `${s.fontSize || 11}pt`,
          direction: "rtl",
        }}
      >
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                const Tag = ri === 0 ? "th" : "td";
                return (
                  <Tag
                    key={ci}
                    style={{
                      border: `${s.borderWidth ?? 0.3}mm solid ${s.borderColor || "#bfc7d6"}`,
                      padding: "1.6mm",
                      background: ri === 0 ? s.headerBg || "#071d3d" : s.tableBg || "#fff",
                      color: ri === 0 ? s.headerColor || "#fff" : s.color || "#172033",
                      fontWeight: ri === 0 ? 800 : 500,
                      textAlign: s.cellAlign || "right",
                      verticalAlign: "top",
                      overflow: "hidden",
                    }}
                  >
                    {cell}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return null;
}