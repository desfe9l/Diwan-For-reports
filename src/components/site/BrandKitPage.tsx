import { useEffect, useState } from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { DEFAULT_BRAND_KIT, type BrandKit } from "@/lib/product/product";
import { readBrandKit, resetBrandKit, saveBrandKit } from "@/lib/product/brand-kit";

export function BrandKitPage() {
  const [kit, setKit] = useState<BrandKit>(DEFAULT_BRAND_KIT);
  const [saved, setSaved] = useState(false);

  useEffect(() => setKit(readBrandKit()), []);
  const update = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => setKit((current) => ({ ...current, [key]: value }));
  const save = () => { saveBrandKit(kit); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };

  return (
    <div className="min-h-full bg-paper dark:bg-[#111722]">
      <SiteHeader current="/brand-kit" />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl"><p className="text-[11px] font-bold tracking-[0.18em] text-green">DOCUMENT IDENTITY</p><h1 className="mt-2 text-[28px] font-extrabold">الهوية المؤسسية</h1><p className="mt-3 text-[14px] leading-7 text-muted">جهّز الألوان والخطوط وأسلوب المستند في مكان واحد. هذه إعدادات تصميم المستند وليست Theme واجهة المحرر.</p></div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="grid gap-5 rounded-[12px] border border-line bg-white p-5 dark:border-white/10 dark:bg-white/5">
            <Field label="اسم الجهة"><input value={kit.organizationName} onChange={(e) => update("organizationName", e.target.value)} placeholder="اسم الجهة أو الإدارة" /></Field>
            <div className="grid gap-3 sm:grid-cols-3"><ColorField label="اللون الأساسي" value={kit.primaryColor} onChange={(value) => update("primaryColor", value)} /><ColorField label="اللون الثانوي" value={kit.secondaryColor} onChange={(value) => update("secondaryColor", value)} /><ColorField label="الذهبي الهادئ" value={kit.accentColor} onChange={(value) => update("accentColor", value)} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="الخط العربي"><select value={kit.arabicFont} onChange={(e) => update("arabicFont", e.target.value)}><option>Tajawal</option><option>Cairo</option><option>IBM Plex Sans Arabic</option><option>Noto Sans Arabic</option></select></Field><Field label="الخط الإنجليزي"><input value={kit.englishFont} onChange={(e) => update("englishFont", e.target.value)} /></Field></div>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="أسلوب الترويسة"><select value={kit.headerStyle} onChange={(e) => update("headerStyle", e.target.value as BrandKit["headerStyle"])}><option value="official">رسمي</option><option value="minimal">مختصر</option><option value="band">شريط هوية</option></select></Field><Field label="أسلوب التذييل"><select value={kit.footerStyle} onChange={(e) => update("footerStyle", e.target.value as BrandKit["footerStyle"])}><option value="official">رسمي</option><option value="simple">بسيط</option><option value="none">بدون تذييل</option></select></Field></div>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4 dark:border-white/10"><button type="button" onClick={save} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-navy px-4 text-[12px] font-extrabold text-white"><Save className="size-4" />{saved ? "تم الحفظ" : "حفظ الهوية محليًا"}</button><button type="button" onClick={() => setKit(resetBrandKit())} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-line px-4 text-[12px] font-bold dark:border-white/10"><RotateCcw className="size-4" />إعادة الضبط</button></div>
          </section>
          <aside className="rounded-[12px] border border-line bg-white p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-start gap-3"><ShieldCheck className="size-5 text-green" /><div><h2 className="text-[14px] font-extrabold">فصل الهوية عن الواجهة</h2><p className="mt-1 text-[12px] leading-6 text-muted">تؤثر هذه القيم على تصميم المستند مستقبلًا، بينما يبقى الوضع الداكن/الفاتح خاصًا بواجهة المحرر فقط.</p></div></div><div className="mt-6 overflow-hidden border border-line bg-white dark:border-white/10"><div className="h-14" style={{ background: kit.primaryColor }} /><div className="p-4" style={{ fontFamily: kit.arabicFont }}><p className="text-[10px]" style={{ color: kit.secondaryColor }}>{kit.organizationName || "اسم الجهة"}</p><h3 className="mt-2 text-[19px] font-extrabold" style={{ color: kit.primaryColor }}>عنوان التقرير</h3><span className="mt-3 block h-1 w-16" style={{ background: kit.accentColor }} /></div></div><div className="mt-4 flex gap-2"><span className="size-6 rounded-full" style={{ background: kit.primaryColor }} /><span className="size-6 rounded-full" style={{ background: kit.secondaryColor }} /><span className="size-6 rounded-full" style={{ background: kit.accentColor }} /></div></aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-[11px] font-extrabold text-muted">{label}{children}</label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><div className="flex h-10 items-center gap-2 rounded-[8px] border border-line px-2 dark:border-white/10"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 border-0 bg-transparent p-0" /><input value={value} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 border-0 bg-transparent text-[12px] uppercase outline-none" dir="ltr" /></div></Field>; }
