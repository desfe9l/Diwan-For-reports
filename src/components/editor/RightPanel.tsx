import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  Unlock,
} from "lucide-react";
import { FONTS, ICONS, THEMES, TYPE_NAME, parseTable } from "@/lib/editor/model";
import { useEditor } from "@/lib/editor/store";
import { cn, round } from "@/lib/utils";

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
  const deleteSelected = useEditor((s) => s.deleteSelected);
  const bring = useEditor((s) => s.bring);
  const toggleLock = useEditor((s) => s.toggleLock);
  const toggleHidden = useEditor((s) => s.toggleHidden);
  const alignPage = useEditor((s) => s.alignPage);
  const theme = THEMES[useEditor((s) => s.theme)];

  const page = pages.find((p) => p.id === activePageId);
  const el = page?.elements.find((e) => e.id === selectedId);
  const layers = [...(page?.elements || [])].sort((a, b) => b.z - a.z);

  return (
    <aside className="flex min-h-0 flex-col border-r border-line bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#1b2433]/90">
      <div className="grid grid-cols-2 gap-2 border-b border-line p-2.5 dark:border-white/10">
        <button
          type="button"
          onClick={() => setRightTab("properties")}
          className={cn(
            "h-9 rounded-[8px] text-[12px] font-extrabold",
            tab === "properties" ? "bg-navy-2 text-white" : "bg-white text-muted ring-1 ring-line dark:bg-white/5",
          )}
        >
          خصائص
        </button>
        <button
          type="button"
          onClick={() => setRightTab("layers")}
          className={cn(
            "h-9 rounded-[8px] text-[12px] font-extrabold",
            tab === "layers" ? "bg-navy-2 text-white" : "bg-white text-muted ring-1 ring-line dark:bg-white/5",
          )}
        >
          طبقات
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3.5">
        {tab === "layers" && (
          <div className="grid gap-1.5">
            {layers.length === 0 && <p className="rounded-[8px] border border-dashed border-line p-4 text-[12px] text-muted">لا توجد عناصر في هذه الصفحة</p>}
            {layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => select(layer.id)}
                className={cn(
                  "flex items-center justify-between rounded-[8px] border px-2.5 py-2 text-right text-[12px]",
                  layer.id === selectedId ? "border-gold bg-gold/10" : "border-line bg-white/70 dark:border-white/10 dark:bg-white/5",
                )}
              >
                <span className="truncate font-bold">
                  {layer.name || TYPE_NAME[layer.type]}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  {layer.locked && <Lock className="size-3.5" />}
                  {layer.hidden && <EyeOff className="size-3.5" />}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "properties" && !el && (
          <div className="rounded-[8px] border border-dashed border-line p-5 text-[12px] leading-6 text-muted">
            اختر عنصراً على الصفحة لتعديل الموقع، الخط، الألوان، والمحاذاة. انقر نقراً مزدوجاً لتعديل النص مباشرة.
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

            {["text", "box", "stat", "stamp"].includes(el.type) && (
              <Field label="النص" full>
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
                <Field key={k} label={k.toUpperCase() + " مم"}>
                  <input
                    type="number"
                    step={0.5}
                    value={round(el[k])}
                    onChange={(e) => updateElement(el.id, { [k]: Number(e.target.value) }, true)}
                    onBlur={() => updateElement(el.id, { [k]: el[k] })}
                  />
                </Field>
              ))}
              <Field label="دوران">
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
                />
              </Field>
            </div>

            {["text", "box", "stat", "stamp", "table"].includes(el.type) && (
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
                      value={el.style.fontSize || 14}
                      onChange={(e) => updateStyle(el.id, { fontSize: Number(e.target.value) }, true)}
                    />
                  </Field>
                  <Field label="الوزن">
                    <select
                      value={String(el.style.fontWeight || 600)}
                      onChange={(e) => updateStyle(el.id, { fontWeight: Number(e.target.value) })}
                    >
                      {[400, 500, 600, 700, 800].map((w) => (
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
                        className={cn(
                          "grid h-9 flex-1 place-items-center rounded-[8px] border",
                          el.style.textAlign === v ? "border-navy-2 bg-navy-2 text-white" : "border-line",
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
                    />
                  </Field>
                  <Field label="تباعد الأسطر">
                    <input
                      type="number"
                      step={0.05}
                      value={el.style.lineHeight || 1.45}
                      onChange={(e) => updateStyle(el.id, { lineHeight: Number(e.target.value) }, true)}
                    />
                  </Field>
                </div>
              </>
            )}

            {["box", "shape", "stat"].includes(el.type) && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="التعبئة">
                  <input
                    type="color"
                    value={toColor(el.style.fill || el.style.background, theme.surface)}
                    onChange={(e) => updateStyle(el.id, { fill: e.target.value }, true)}
                  />
                </Field>
                <Field label="الإطار">
                  <input
                    type="color"
                    value={toColor(el.style.borderColor, theme.line)}
                    onChange={(e) => updateStyle(el.id, { borderColor: e.target.value }, true)}
                  />
                </Field>
                <Field label="سماكة الإطار">
                  <input
                    type="number"
                    step={0.05}
                    value={el.style.borderWidth ?? 0.35}
                    onChange={(e) => updateStyle(el.id, { borderWidth: Number(e.target.value) }, true)}
                  />
                </Field>
                <Field label="الزوايا مم">
                  <input
                    type="number"
                    value={el.style.radius || 0}
                    onChange={(e) => updateStyle(el.id, { radius: Number(e.target.value) }, true)}
                  />
                </Field>
              </div>
            )}

            {el.type === "shape" && (
              <Field label="الشكل">
                <select
                  value={el.style.shape || "rect"}
                  onChange={(e) => updateStyle(el.id, { shape: e.target.value as "rect" | "circle" | "rounded" })}
                >
                  <option value="rect">مستطيل</option>
                  <option value="rounded">مستدير</option>
                  <option value="circle">دائرة</option>
                </select>
              </Field>
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
                <Field label="اللون">
                  <input
                    type="color"
                    value={toColor(el.style.color, theme.accent)}
                    onChange={(e) => updateStyle(el.id, { color: e.target.value }, true)}
                  />
                </Field>
              </>
            )}

            {(el.type === "line" || el.type === "divider") && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="اللون">
                  <input
                    type="color"
                    value={toColor(el.style.color, theme.accent)}
                    onChange={(e) => updateStyle(el.id, { color: e.target.value }, true)}
                  />
                </Field>
                <Field label="السماكة">
                  <input
                    type="number"
                    step={0.1}
                    value={el.style.stroke || 0.8}
                    onChange={(e) => updateStyle(el.id, { stroke: Number(e.target.value) }, true)}
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
                      max={8}
                      value={el.style.cols || 3}
                      onChange={(e) => {
                        const cols = Number(e.target.value);
                        const rows = el.style.rows || 4;
                        const data = parseTable(el.content, el.style.cols, el.style.rows);
                        const next = Array.from({ length: rows }, (_, r) =>
                          Array.from({ length: cols }, (_, c) => data[r]?.[c] || ""),
                        );
                        updateElement(el.id, { content: JSON.stringify(next), style: { ...el.style, cols } });
                      }}
                    />
                  </Field>
                  <Field label="صفوف">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={el.style.rows || 4}
                      onChange={(e) => {
                        const rows = Number(e.target.value);
                        const cols = el.style.cols || 3;
                        const data = parseTable(el.content, cols, el.style.rows);
                        const next = Array.from({ length: rows }, (_, r) =>
                          Array.from({ length: cols }, (_, c) => data[r]?.[c] || ""),
                        );
                        updateElement(el.id, { content: JSON.stringify(next), style: { ...el.style, rows } });
                      }}
                    />
                  </Field>
                </div>
                <Field label="بيانات الجدول (سطر لكل صف، | بين الخلايا)" full>
                  <textarea
                    rows={5}
                    value={parseTable(el.content, el.style.cols, el.style.rows)
                      .map((r) => r.join(" | "))
                      .join("\n")}
                    onChange={(e) => {
                      const data = e.target.value.split("\n").map((line) => line.split("|").map((c) => c.trim()));
                      updateElement(el.id, { content: JSON.stringify(data) }, true);
                    }}
                  />
                </Field>
              </>
            )}

            {["image", "logo"].includes(el.type) && (
              <>
                <Field label="الملاءمة">
                  <select
                    value={el.style.objectFit || "cover"}
                    onChange={(e) => updateStyle(el.id, { objectFit: e.target.value as "cover" | "contain" | "fill" })}
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="fill">Fill</option>
                  </select>
                </Field>
                <button
                  type="button"
                  onClick={() => onReplaceImage(el.id)}
                  className="h-9 rounded-[8px] bg-navy-2 text-[12px] font-extrabold text-white"
                >
                  استبدال الصورة
                </button>
              </>
            )}

            <div>
              <p className="mb-1.5 text-[11px] font-extrabold text-muted">محاذاة الصفحة</p>
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

            <div className="grid grid-cols-2 gap-1.5">
              <Action onClick={() => bring("forward")} icon={ArrowUp} label="أمام" />
              <Action onClick={() => bring("back")} icon={ArrowDown} label="خلف" />
              <Action onClick={duplicateSelected} icon={Copy} label="نسخ" />
              <Action onClick={toggleLock} icon={el.locked ? Unlock : Lock} label={el.locked ? "فتح" : "قفل"} />
              <Action onClick={toggleHidden} icon={el.hidden ? Eye : EyeOff} label={el.hidden ? "إظهار" : "إخفاء"} />
              <Action onClick={deleteSelected} icon={Trash2} label="حذف" danger />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("grid gap-1 text-[11px] font-extrabold text-muted", full && "col-span-2")}>
      {label}
      <div className="field-control [&_input]:h-9 [&_input]:w-full [&_input]:rounded-[8px] [&_input]:border [&_input]:border-line [&_input]:bg-white [&_input]:px-2.5 [&_input]:text-[13px] [&_input]:font-semibold [&_input]:text-ink dark:[&_input]:border-white/10 dark:[&_input]:bg-white/5 dark:[&_input]:text-white [&_select]:h-9 [&_select]:w-full [&_select]:rounded-[8px] [&_select]:border [&_select]:border-line [&_select]:bg-white [&_select]:px-2.5 [&_select]:text-[13px] [&_textarea]:min-h-[96px] [&_textarea]:w-full [&_textarea]:rounded-[8px] [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-white [&_textarea]:p-2.5 [&_textarea]:text-[13px] [&_textarea]:leading-6">
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
          ? "border-red-200 bg-red-50 text-danger"
          : "border-line bg-white dark:border-white/10 dark:bg-white/5",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function toColor(v: string | undefined, fallback: string) {
  if (!v || v === "transparent" || v.startsWith("rgba")) return fallback;
  return v;
}
