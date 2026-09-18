import { useEffect, useState } from "react";
import { BadgeCheck, Check, Clock3, Copy, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { BRAND, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_INTL, telHref, whatsappHref } from "@/lib/brand";
import { useEditor } from "@/lib/editor/store";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

const SCOPES = ["تقرير رسمي", "عرض تقديمي", "غلاف ومستند", "تصميم إنفوجرافيك", "استفسار آخر"];

export function ContactPage() {
  const hydrate = useEditor((s) => s.hydrate);
  const [scope, setScope] = useState(SCOPES[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const message = `السلام عليكم ${BRAND.owner}، أرغب بالاستفسار عن: ${scope} عبر ${BRAND.nameAr}.`;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_PHONE_INTL);
      setCopied(true);
      toast.success("تم نسخ الرقم بالصيغة الدولية");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("تعذر النسخ — يمكنك تحديد الرقم يدوياً");
    }
  };

  return (
    <div className="min-h-full bg-paper dark:bg-[#111722]">
      <SiteHeader current="/contact" />

      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-[12px] font-extrabold tracking-[0.16em] text-green dark:text-gold-2">تواصل تجاري مباشر</p>
        <h1 className="mt-3 text-[30px] font-extrabold">كيف نساعدك في بدء العمل؟</h1>
        <p className="mt-3 text-[15px] leading-8 text-muted">
          تحدث مباشرة مع المصمم والمطور {BRAND.owner} للاستفسار عن الترخيص، تجهيز الهوية، أو تسليم نسخة مناسبة لجهتك.
        </p>

        <div className="mt-8 grid gap-6 border-y border-line py-7 md:grid-cols-[1fr_auto] md:items-center dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-muted"><Phone className="size-4 text-navy-2 dark:text-gold-2" />التواصل المباشر</div>
            <a href={telHref()} className="mt-2 block text-[28px] font-extrabold tabular-nums text-ink dark:text-white" dir="ltr">{CONTACT_PHONE_DISPLAY}</a>
            <p className="mt-2 text-[12px] text-muted">رقم دولي للاتصال وواتساب. اختر نوع الطلب أدناه ليُضاف تلقائياً إلى رسالتك.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={telHref()}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-navy px-4 text-[13px] font-extrabold text-white"
            >
              <Phone className="size-4" />
              اتصال مباشر
            </a>
            <a
              href={whatsappHref(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-green px-4 text-[13px] font-extrabold text-white"
            >
              <MessageCircle className="size-4" />
              مراسلة واتساب
            </a>
            <button
              type="button"
              onClick={() => void copyNumber()}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-line px-4 text-[13px] font-bold dark:border-white/10"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              نسخ الرقم الدولي
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-6 border-b border-line pb-8 md:grid-cols-[1.1fr_.9fr] dark:border-white/10">
          <div>
          <h2 className="text-[16px] font-extrabold">نوع الطلب</h2>
          <p className="mt-1 text-[12px] text-muted">
            اختر نوع الطلب ليُضاف تلقائياً إلى نص رسالة واتساب.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                aria-pressed={scope === s}
                className={
                  scope === s
                    ? "rounded-full border border-navy bg-navy px-3 py-1.5 text-[12px] font-bold text-white"
                    : "rounded-full border border-line px-3 py-1.5 text-[12px] font-bold text-muted dark:border-white/10"
                }
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-4 rounded-[8px] border border-line bg-line-2/60 p-3 text-[13px] leading-7 dark:border-white/10 dark:bg-white/5">
            {message}
          </p>
          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-[8px] bg-green px-4 text-[12px] font-extrabold text-white"
          >
            <MessageCircle className="size-3.5" />
            إرسال هذه الرسالة على واتساب
          </a>
          </div>
          <aside className="border-r-2 border-gold pr-4">
            <BadgeCheck className="size-5 text-navy-2 dark:text-gold-2" />
            <h2 className="mt-3 text-[15px] font-extrabold">طلب ترخيص أو تسليم</h2>
            <p className="mt-2 text-[12px] leading-6 text-muted">لشراء نسخة كاملة، نحدد نوع الترخيص أولاً، ثم نرسل تفاصيل الدفع ونجهز التسليم وخطوات بدء الاستخدام.</p>
            <a href="/purchase" className="mt-4 inline-flex text-[12px] font-extrabold text-navy-2 underline underline-offset-4 dark:text-gold-2">عرض النسخ والتراخيص</a>
          </aside>
        </section>

        <section className="mt-8 flex items-start gap-3">
          <Clock3 className="mt-0.5 size-5 shrink-0 text-navy-2 dark:text-gold-2" />
          <div><h2 className="text-[16px] font-extrabold">أوقات الرد</h2>
          <p className="mt-2 text-[14px] leading-7 text-muted">
            عادةً يتم الرد خلال أوقات العمل الرسمية. إن لم يكن الرقم متاحاً، أرسل رسالة واتساب وسيتم
            التواصل في أقرب وقت.
          </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}