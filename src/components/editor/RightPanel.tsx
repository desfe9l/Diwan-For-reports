import { useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Grid2x2,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  FONTS,
  ICONS,
  SHADOWS,
  THEMES,
  TYPE_NAME,
  parseTable,
  type CanvasEl,
} from "@/lib/editor/model";
import { useEditor, type RightTab } from "@/lib/editor/store";
import { cn, round } from "@/lib/utils";

const TEXT_TYPES = ["text", "box", "stat", "stamp", "table", "progress"];

export function RightPanel({ onReplaceImage }: { onReplaceImage: (id: string) => void }) {
  const tab = useEditor((s) => s.rightTab);
  const setRightTab = useEditor((s) => s.setRightTab);
  const pages = useEditor((s) => s.pages);
  const activePageId = useEditor((s) => s.activePageId);
  const selectedId = useEditor((s) => s.selectedId);
  const select = useEditor((s) => s.select);
  const updateElement = useEditor((s) => s.updateElement);
  const updateStyle = useEditor((s) => s.updateStyle);
  const duplicateSelected = useEditor((s) => s.duplicateSelected);
  const copySelected = useEditor((s) => s.copySelected);
  const pasteClipboard = useEditor((s) => s.pasteClipboard);
  const clipboard = useEditor((s) => s.clipboard);
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const bring = useEditor((s) => s.bring);
  const toggleLock = useEditor((s) => s.toggleLock);
  const toggleHidden = useEditor((s) => s.toggleHidden);
  const alignPage = useEditor((s) => s.alignPage);
  const theme = THEMES[useEditor((s) => s.theme)];
  const [cellEditor, setCellEditor] = useState(false);

  const page = pages.find((p) => p.id === activePageId);
  const el = page?.elements.find((e) => e.id === selectedId);
  const layers = [...(page?.elements || [])].sort((a, b) => b.z - a.z);

  return (
    <aside className="flex min-h-0 flex-col border-r border-line bg-white dark:border-white/10 dark:bg-[#161c26]">
      <div className="grid grid-cols-2 gap-2 border-b border-line p-2 dark:border-white/10">
        {(
          [
            ["properties", "خصائص"],
            ["layers", "طبقات"],
          ] as [RightTab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRightTab(id)}
            className={cn(
              "h-9 rounded-[8px] text-[12px] font-extrabold",
              tab === id ? "bg-navy text-white" : "text-muted hover:bg-line-2 dark:text-white/70 dark:hover:bg-white/5",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {tab === "layers" && (
          <div className="grid gap-1.5">
            {layers.length === 0 && (
              <EmptyNote>لا توجد عناصر في هذه الصفحة بعد.</EmptyNote>
            )}
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-[8px] border px-2 py-1.5",
                  layer.id === selectedId ? "border-navy-2 bg-navy-2/5" : "border-line dark:border-white/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => select(layer.id)}
                  className="flex min-w-0 flex-1 items-center justify-between text-right text-[12px]"
                >
                  <span className="truncate font-bold">{layer.name || TYPE_NAME[layer.type]}</span>
                  <span className="flex items-center gap-1 pr-1 text-muted">
                    {layer.locked && <Lock className="size-3.5" />}
                    {layer.hidden && <EyeOff className="size-3.5" />}
                    <span className="text-[10px] tabular-nums">{layer.z}</span>
                  </span>
                </button>
                <button
                  type="button"
                  title={layer.hidden ? "إظهار" : "إخفاء"}
                  onClick={() => {
                    select(layer.id);
                    toggleHidden();
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-line dark:border-white/10"
                >
                  {layer.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button
                  type="button"
                  title={layer.locked ? "فتح القفل" : "قفل"}
                  onClick={() => {
                    select(layer.id);
                    toggleLock();
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-[6px] border border-line dark:border-white/10"
                >
                  {layer.locked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "properties" && !el && (
          <div className="grid gap-2">
            <EmptyNote>
              اختر عنصراً على الصفحة لعرض خصائصه: الموضع، المقاس، الدوران، الشفافية، الخط، الألوان، الإطار والظل.
              النقر المزدوج على النص يفعّل التعديل المباشر.
            </EmptyNote>
            <button
              type="button"
              disabled={!clipboard}
              onClick={pasteClipboard}
              className="h-9 rounded-[8px] border border-line text-[12px] font-extrabold disabled:opacity-40 dark:border-white/10"
            >
              لصق العنصر المنسوخ
            </button>
          </div>
        )}

        {tab === "properties" && el && (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-extrabold">{el.name || TYPE_NAME[el.type]}</h3>
              <span className="text-[11px] text-muted">{TYPE_NAME[el.type]}</span>
            </div>

            <Field label="الاسم">
              <input value={el.name} onChange={(e) => updateElement(el.id, { name: e.target.value })} />
            </Field>

            {TEXT_MARKUP_TYPES.has(el.type) && (
              <Field label="النص (Enter لسطر جديد)" full>
                <textarea
                  rows={4}
                  value={el.content || ""}
                  onChange={(e) => updateElement(el.id, { content: e.target.value }, true)}
                  onBlur={() => updateElement(el.id, { content: el.content })}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(["x", "y", "w", "h"] as const).map((k) => (
                <Field key={k} label={LABELS[k]}>
                  <input
                    type="number"
                    step={0.5}
                    value={round(el[k])}
                    onChange={(e) => updateElement(el.id, { [k]: Number(e.target.value) }, true)}
                    onBlur={() => updateElement(el.id, { [k]: el[k] })}
                  />
                </Field>
              ))}
              <Field label="دوران °">
                <input
                  type="number"
                  value={round(el.rotation)}
                  onChange={(e) => updateElement(el.id, { rotation: Number(e.target.value) }, true)}
                  onBlur={() => updateElement(el.id, { rotation: el.rotation })}
                />
              </Field>
              <Field label="شفافية">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={el.opacity}
                  onChange={(e) => updateElement(el.id, { opacity: Number(e.target.value) }, true)}
                  onBlur={() => updateElement(el.id, { opacity: el.opacity })}
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-extrabold text-muted">محاذاة داخل الصفحة</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ["right", "يمين"],
                    ["center", "وسط"],
                    ["left", "يسار"],
                    ["top", "أعلى"],
                    ["middle", "منتصف"],
                    ["bottom", "أسفل"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => alignPage(k)}
                    className="h-8 rounded-[8px] border border-line text-[11px] font-bold dark:border-white/10"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {TEXT_TYPES.includes(el.type) && (
              <>
                <Field label="الخط">
                  <select
                    value={el.style.fontFamily || "Tajawal"}
                    onChange={(e) => updateStyle(el.id, { fontFamily: e.target.value })}
                  >
                    {FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="الحجم pt">
                    <input
                      type="number"
                      min={4}
                      max={200}
                      value={el.style.fontSize || 14}
                      onChange={(e) => updateStyle(el.id, { fontSize: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { fontSize: el.style.fontSize })}
                    />
                  </Field>
                  <Field label="الوزن">
                    <select
                      value={String(el.style.fontWeight || 600)}
                      onChange={(e) => updateStyle(el.id, { fontWeight: Number(e.target.value) })}
                    >
                      {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="المحاذاة">
                  <div className="flex gap-1">
                    {(
                      [
                        ["right", AlignRight],
                        ["center", AlignCenter],
                        ["left", AlignLeft],
                      ] as const
                    ).map(([v, Icon]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updateStyle(el.id, { textAlign: v })}
                        aria-pressed={el.style.textAlign === v}
                        className={cn(
                          "grid h-9 flex-1 place-items-center rounded-[8px] border",
                          el.style.textAlign === v ? "border-navy bg-navy text-white" : "border-line dark:border-white/10",
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="لون النص">
                    <input
                      type="color"
                      value={toColor(el.style.color, theme.ink)}
                      onChange={(e) => updateStyle(el.id, { color: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { color: el.style.color })}
                    />
                  </Field>
                  <Field label="تباعد الأسطر">
                    <input
                      type="number"
                      step={0.05}
                      min={0.8}
                      max={3}
                      value={el.style.lineHeight || 1.45}
                      onChange={(e) => updateStyle(el.id, { lineHeight: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { lineHeight: el.style.lineHeight })}
                    />
                  </Field>
                </div>
              </>
            )}

            {(el.type === "text" || el.type === "box" || el.type === "stat") && (
              <Field label="تباعد الحروف مم">
                <input
                  type="number"
                  step={0.1}
                  value={el.style.letterSpacing || 0}
                  onChange={(e) => updateStyle(el.id, { letterSpacing: Number(e.target.value) }, true)}
                  onBlur={() => updateStyle(el.id, { letterSpacing: el.style.letterSpacing })}
                />
              </Field>
            )}

            {["box", "stat", "progress"].includes(el.type) && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="التعبئة">
                  <input
                    type="color"
                    value={toColor(el.style.fill, theme.surface)}
                    onChange={(e) => updateStyle(el.id, { fill: e.target.value }, true)}
                    onBlur={() => updateStyle(el.id, { fill: el.style.fill })}
                  />
                </Field>
                <Field label="لون الخلفية">
                  <input
                    type="color"
                    value={toColor(el.style.background || el.style.fill, theme.surface)}
                    onChange={(e) => updateStyle(el.id, { background: e.target.value }, true)}
                    onBlur={() => updateStyle(el.id, { background: el.style.background })}
                  />
                </Field>
                <Field label="الإطار">
                  <input
                    type="color"
                    value={toColor(el.style.borderColor, theme.line)}
                    onChange={(e) => updateStyle(el.id, { borderColor: e.target.value }, true)}
                    onBlur={() => updateStyle(el.id, { borderColor: el.style.borderColor })}
                  />
                </Field>
                <Field label="سماكة الإطار مم">
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    value={el.style.borderWidth ?? 0.35}
                    onChange={(e) => updateStyle(el.id, { borderWidth: Number(e.target.value) }, true)}
                    onBlur={() => updateStyle(el.id, { borderWidth: el.style.borderWidth })}
                  />
                </Field>
                <Field label="الزوايا مم">
                  <input
                    type="number"
                    min={0}
                    value={el.style.radius || 0}
                    onChange={(e) => updateStyle(el.id, { radius: Number(e.target.value) }, true)}
                    onBlur={() => updateStyle(el.id, { radius: el.style.radius })}
                  />
                </Field>
                <Field label="الحاشية مم">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={el.style.padding ?? 4}
                    onChange={(e) => updateStyle(el.id, { padding: Number(e.target.value) }, true)}
                    onBlur={() => updateStyle(el.id, { padding: el.style.padding })}
                  />
                </Field>
              </div>
            )}

            {el.type === "progress" && (
              <Field label={`القيمة: ${Math.round(Number(el.style.value) || 0)}%`} full>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Number(el.style.value) || 0}
                  onChange={(e) => updateStyle(el.id, { value: Number(e.target.value) }, true)}
                  onBlur={() => updateStyle(el.id, { value: el.style.value })}
                  className="w-full accent-navy"
                />
              </Field>
            )}

            {el.type === "shape" && (
              <>
                <Field label="الشكل">
                  <select
                    value={el.style.shape || "rect"}
                    onChange={(e) => updateStyle(el.id, { shape: e.target.value as "rect" | "circle" | "rounded" })}
                  >
                    <option value="rect">مستطيل</option>
                    <option value="rounded">مستطيل مستدير</option>
                    <option value="circle">دائرة</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="التعبئة">
                    <input
                      type="color"
                      value={toColor(el.style.fill, theme.primary)}
                      onChange={(e) => updateStyle(el.id, { fill: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { fill: el.style.fill })}
                    />
                  </Field>
                  <Field label="الإطار">
                    <input
                      type="color"
                      value={toColor(el.style.borderColor, theme.primary)}
                      onChange={(e) => updateStyle(el.id, { borderColor: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { borderColor: el.style.borderColor })}
                    />
                  </Field>
                  <Field label="سماكة الإطار">
                    <input
                      type="number"
                      step={0.05}
                      min={0}
                      value={el.style.borderWidth ?? 0}
                      onChange={(e) => updateStyle(el.id, { borderWidth: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { borderWidth: el.style.borderWidth })}
                    />
                  </Field>
                  <Field label="الزوايا مم">
                    <input
                      type="number"
                      min={0}
                      value={el.style.radius || 0}
                      onChange={(e) => updateStyle(el.id, { radius: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { radius: el.style.radius })}
                    />
                  </Field>
                </div>
              </>
            )}

            {el.type === "icon" && (
              <>
                <Field label="الأيقونة">
                  <select value={el.icon || "star"} onChange={(e) => updateElement(el.id, { icon: e.target.value })}>
                    {Object.keys(ICONS).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="اللون">
                    <input
                      type="color"
                      value={toColor(el.style.color, theme.accent)}
                      onChange={(e) => updateStyle(el.id, { color: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { color: el.style.color })}
                    />
                  </Field>
                  <Field label="سماكة الخط">
                    <input
                      type="number"
                      step={0.1}
                      min={0.5}
                      value={el.style.stroke || 1.8}
                      onChange={(e) => updateStyle(el.id, { stroke: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { stroke: el.style.stroke })}
                    />
                  </Field>
                </div>
              </>
            )}

            {(el.type === "line" || el.type === "divider") && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="اللون">
                  <input
                    type="color"
                    value={toColor(el.style.color, theme.accent)}
                    onChange={(e) => updateStyle(el.id, { color: e.target.value }, true)}
                    onBlur={() => updateStyle(el.id, { color: el.style.color })}
                  />
                </Field>
                <Field label="السماكة مم">
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={el.style.stroke || 0.8}
                    onChange={(e) => updateStyle(el.id, { stroke: Number(e.target.value) }, true)}
                    onBlur={() => updateStyle(el.id, { stroke: el.style.stroke })}
                  />
                </Field>
              </div>
            )}

            {el.type === "table" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="أعمدة">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={el.style.cols || 3}
                      onChange={(e) => resizeTable(el, Number(e.target.value), el.style.rows || 4, updateElement)}
                    />
                  </Field>
                  <Field label="صفوف">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={el.style.rows || 4}
                      onChange={(e) => resizeTable(el, el.style.cols || 3, Number(e.target.value), updateElement)}
                    />
                  </Field>
                </div>
                <Field label="محاذاة الخلايا">
                  <select
                    value={el.style.cellAlign || "right"}
                    onChange={(e) =>
                      updateStyle(el.id, { cellAlign: e.target.value as "right" | "center" | "left" })
                    }
                  >
                    <option value="right">يمين</option>
                    <option value="center">وسط</option>
                    <option value="left">يسار</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="خلفية الرأس">
                    <input
                      type="color"
                      value={toColor(el.style.headerBg, theme.primary)}
                      onChange={(e) => updateStyle(el.id, { headerBg: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { headerBg: el.style.headerBg })}
                    />
                  </Field>
                  <Field label="لون الرأس">
                    <input
                      type="color"
                      value={toColor(el.style.headerColor, "#ffffff")}
                      onChange={(e) => updateStyle(el.id, { headerColor: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { headerColor: el.style.headerColor })}
                    />
                  </Field>
                  <Field label="خلفية الخلايا">
                    <input
                      type="color"
                      value={toColor(el.style.tableBg, "#ffffff")}
                      onChange={(e) => updateStyle(el.id, { tableBg: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { tableBg: el.style.tableBg })}
                    />
                  </Field>
                  <Field label="لون الحدود">
                    <input
                      type="color"
                      value={toColor(el.style.borderColor, "#bfc7d6")}
                      onChange={(e) => updateStyle(el.id, { borderColor: e.target.value }, true)}
                      onBlur={() => updateStyle(el.id, { borderColor: el.style.borderColor })}
                    />
                  </Field>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setCellEditor((v) => !v)}
                    className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-line text-[12px] font-extrabold dark:border-white/10"
                  >
                    <Grid2x2 className="size-3.5" />
                    {cellEditor ? "إغلاق محرر الخلايا" : "تحرير الخلايا كشبكة"}
                  </button>
                  {cellEditor && (
                    <div className="mt-2 overflow-auto rounded-[8px] border border-line p-1 dark:border-white/10">
                      <table className="border-collapse">
                        <tbody>
                          {parseTable(el.content, el.style.cols, el.style.rows).map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td key={ci} className="p-0.5">
                                  <input
                                    value={cell}
                                    onChange={(e) => setTableCell(el, ri, ci, e.target.value, updateElement)}
                                    className="h-7 w-[74px] rounded-[4px] border border-line px-1 text-[11px] dark:border-white/10 dark:bg-white/5"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <Field label="بيانات الجدول (سطر لكل صف، | بين الخلايا)" full>
                  <textarea
                    rows={5}
                    value={parseTable(el.content, el.style.cols, el.style.rows)
                      .map((r) => r.join(" | "))
                      .join("\n")}
                    onChange={(e) => {
                      const data = e.target.value
                        .split("\n")
                        .map((line) => line.split("|").map((c) => c.trim()));
                      updateElement(el.id, { content: JSON.stringify(data) }, true);
                    }}
                    onBlur={() => updateElement(el.id, { content: el.content })}
                  />
                </Field>
              </>
            )}

            {["image", "logo"].includes(el.type) && (
              <>
                <Field label="الملاءمة">
                  <select
                    value={el.style.objectFit || "cover"}
                    onChange={(e) =>
                      updateStyle(el.id, { objectFit: e.target.value as "cover" | "contain" | "fill" })
                    }
                  >
                    <option value="cover">Cover — تعبئة مع قص</option>
                    <option value="contain">Contain — احتواء كامل</option>
                    <option value="fill">Fill — تمديد</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="موضع أفقي %">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={el.style.objectX ?? 50}
                      onChange={(e) => updateStyle(el.id, { objectX: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { objectX: el.style.objectX })}
                    />
                  </Field>
                  <Field label="موضع رأسي %">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={el.style.objectY ?? 50}
                      onChange={(e) => updateStyle(el.id, { objectY: Number(e.target.value) }, true)}
                      onBlur={() => updateStyle(el.id, { objectY: el.style.objectY })}
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => onReplaceImage(el.id)}
                  className="h-9 rounded-[8px] bg-navy text-[12px] font-extrabold text-white"
                >
                  استبدال الصورة
                </button>
              </>
            )}

            {el.type === "qr" && (
              <Field label="نص الرمز" full>
                <textarea
                  rows={3}
                  value={el.content || ""}
                  onChange={(e) => updateElement(el.id, { content: e.target.value }, true)}
                  onBlur={() => updateElement(el.id, { content: el.content })}
                />
              </Field>
            )}

            <Field label="الظل">
              <select
                value={shadowId(el.style.shadow)}
                onChange={(e) => {
                  const found = SHADOWS.find((s) => s.id === e.target.value);
                  updateStyle(el.id, { shadow: found?.value || "" });
                }}
              >
                {SHADOWS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-1.5">
              <Action onClick={() => bring("forward")} icon={ArrowUp} label="تقديم" />
              <Action onClick={() => bring("back")} icon={ArrowDown} label="تأخير" />
              <Action onClick={duplicateSelected} icon={Copy} label="نسخ (⌘D)" />
              <Action onClick={copySelected} icon={Copy} label="قص للحافظة" />
              <Action onClick={toggleLock} icon={el.locked ? Unlock : Lock} label={el.locked ? "فتح القفل" : "قفل"} />
              <Action
                onClick={toggleHidden}
                icon={el.hidden ? Eye : EyeOff}
                label={el.hidden ? "إظهار" : "إخفاء"}
              />
            </div>
            <Action onClick={deleteSelected} icon={Trash2} label="حذف العنصر" danger />
          </div>
        )}
      </div>
    </aside>
  );
}

/** Types that render an editable text body (table is edited structurally). */
const TEXT_MARKUP_TYPES = new Set(["text", "box", "stat", "stamp", "progress"]);

const LABELS: Record<"x" | "y" | "w" | "h", string> = {
  x: "X مم",
  y: "Y مم",
  w: "العرض مم",
  h: "الارتفاع مم",
};

function resizeTable(
  el: CanvasEl,
  cols: number,
  rows: number,
  updateElement: (id: string, patch: Partial<CanvasEl>, live?: boolean) => void,
) {
  const safeCols = Math.max(1, Math.min(12, cols || 1));
  const safeRows = Math.max(1, Math.min(30, rows || 1));
  const data = parseTable(el.content, el.style.cols, el.style.rows);
  const next = Array.from({ length: safeRows }, (_, r) =>
    Array.from({ length: safeCols }, (_, c) => data[r]?.[c] ?? ""),
  );
  updateElement(el.id, {
    content: JSON.stringify(next),
    style: { ...el.style, cols: safeCols, rows: safeRows },
  });
}

function setTableCell(
  el: CanvasEl,
  row: number,
  col: number,
  value: string,
  updateElement: (id: string, patch: Partial<CanvasEl>, live?: boolean) => void,
) {
  const data = parseTable(el.content, el.style.cols, el.style.rows);
  data[row][col] = value;
  updateElement(el.id, { content: JSON.stringify(data) }, true);
}

function shadowId(value: string | undefined) {
  const hit = SHADOWS.find((s) => s.value && s.value === value);
  return hit?.id || "none";
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[8px] border border-dashed border-line p-4 text-[12px] leading-6 text-muted dark:border-white/15">
      {children}
    </p>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("grid gap-1 text-[11px] font-extrabold text-muted", full && "col-span-2")}>
      {label}
      <div className="field-control [&_input]:h-9 [&_input]:w-full [&_input]:rounded-[8px] [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-2.5 [&_input]:text-[13px] [&_input]:font-semibold [&_input]:text-ink dark:[&_input]:border-white/10 dark:[&_input]:bg-white/5 dark:[&_input]:text-white [&_input[type=color]]:p-1 [&_input[type=range]]:h-9 [&_select]:h-9 [&_select]:w-full [&_select]:rounded-[8px] [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:px-2.5 [&_select]:text-[13px] dark:[&_select]:border-white/10 dark:[&_select]:bg-white/5 dark:[&_select]:text-white [&_textarea]:min-h-[80px] [&_textarea]:w-full [&_textarea]:rounded-[8px] [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-white [&_textarea]:p-2.5 [&_textarea]:text-[13px] [&_textarea]:leading-6 dark:[&_textarea]:border-white/10 dark:[&_textarea]:bg-white/5 dark:[&_textarea]:text-white">
        {children}
      </div>
    </label>
  );
}

function Action({
  onClick,
  icon: Icon,
  label,
  danger,
}: {
  onClick: () => void;
  icon: typeof Copy;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border text-[11px] font-extrabold",
        danger
          ? "border-red-200 bg-red-50 text-danger dark:border-red-500/30 dark:bg-red-500/10"
          : "border-line dark:border-white/10",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function toColor(v: string | undefined, fallback: string) {
  if (!v || v === "transparent" || v.startsWith("rgba") || v.startsWith("hsl")) return fallback;
  return v;
}

export { X as UnusedIcon } from "lucide-react";