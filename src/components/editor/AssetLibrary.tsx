import { useState } from "react";
import { Check, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import type { Asset } from "@/lib/editor/storage";
import { cn } from "@/lib/utils";

/**
 * The reusable shelf of uploaded images.
 *
 * Placing a shape or a logo as a picture is the common way an author reuses
 * decoration between reports, so anything uploaded here is kept — independent
 * of the project that happened to be open at the time — and inserted as an
 * `image` element on click.
 */
export function AssetLibrary({ onUpload }: { onUpload: () => void }) {
  const assets = useEditor((s) => s.assets);
  const assetsLoading = useEditor((s) => s.assetsLoading);
  const addElement = useEditor((s) => s.addElement);
  const removeAsset = useEditor((s) => s.removeAsset);
  const renameAsset = useEditor((s) => s.renameAsset);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const place = (asset: Asset) => {
    // Fit inside a sane page area while keeping the picture's own proportions,
    // so a large saved shape never lands wider than the sheet.
    const max = { w: 90, h: 90 };
    const scale = Math.min(max.w / asset.w, max.h / asset.h, 1);
    addElement("image", {
      src: asset.src,
      name: asset.name,
      w: Math.max(5, Math.round(asset.w * scale)),
      h: Math.max(5, Math.round(asset.h * scale)),
    });
  };

  const startRename = (asset: Asset) => {
    setEditingId(asset.id);
    setDraftName(asset.name);
  };

  const commitRename = () => {
    if (editingId) void renameAsset(editingId, draftName);
    setEditingId(null);
  };

  return (
    <section>
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-extrabold tracking-wide text-muted">مكتبة العناصر</h3>
        {assets.length > 0 && (
          <span className="text-[10px] tabular-nums text-muted">{assets.length}</span>
        )}
      </header>

      {assetsLoading ? (
        <p className="text-[10px] text-muted">جارٍ تحميل المكتبة…</p>
      ) : assets.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-line p-3 text-center dark:border-white/10">
          <p className="text-[10px] leading-5 text-muted">
            احفظ أي صورة أو شعار أو شكل ترفعه ليظهر هنا وتستخدمه في أي مشروع لاحقاً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative">
              {editingId === asset.id ? (
                <div className="flex h-16 flex-col gap-1 rounded-[8px] border border-navy-2 p-1 dark:border-gold/60">
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-5 w-full rounded-[4px] border border-line px-1 text-[9px] dark:border-white/10 dark:bg-white/5"
                  />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={commitRename}
                      className="grid h-5 flex-1 place-items-center rounded-[4px] bg-navy text-white"
                      title="حفظ الاسم"
                    >
                      <Check className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="grid h-5 flex-1 place-items-center rounded-[4px] border border-line dark:border-white/10"
                      title="إلغاء"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => place(asset)}
                    title={`إضافة "${asset.name}" إلى الصفحة`}
                    className={cn(
                      "grid h-16 w-full place-items-center overflow-hidden rounded-[8px]",
                      "border border-line bg-white/60 transition hover:border-navy-2 dark:border-white/10 dark:bg-white/5",
                    )}
                  >
                    <img
                      src={asset.src}
                      alt={asset.name}
                      className="max-h-14 max-w-full object-contain"
                    />
                  </button>
                  <span className="mt-0.5 block truncate text-center text-[9px] text-muted">
                    {asset.name}
                  </span>
                  <div className="absolute end-0.5 top-0.5 flex gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => startRename(asset)}
                      title="إعادة تسمية"
                      className="grid size-4 place-items-center rounded-[4px] bg-white/90 text-navy-2 shadow-sm dark:bg-navy-2/90 dark:text-white"
                    >
                      <Pencil className="size-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeAsset(asset.id)}
                      title="حذف من المكتبة"
                      className="grid size-4 place-items-center rounded-[4px] bg-white/90 text-red-600 shadow-sm dark:bg-navy-2/90 dark:text-red-400"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onUpload}
        className="mt-1.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] border border-line text-[11px] font-extrabold dark:border-white/10"
      >
        <ImagePlus className="size-3.5" /> حفظ عنصر جديد في المكتبة
      </button>
    </section>
  );
}