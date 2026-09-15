import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Phone } from "lucide-react";
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

  const message = `السلام عليكم ${BRAND.owner}، أرغب بالاستفسار عن: ${scope} عبر ${BRAND.platform}.`;

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

      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-[26px] font-extrabold">التواصل</h1>
        <p className="mt-3 text-[15px] leading-8 text-muted">
          للاستفسار عن تصميم تقرير أو مستند رسمي، أو لطلب قالب خاص، يمكنك التواصل مباشرة مع{" "}
          {BRAND.owner}. المنصة أداة شخصية، والتواصل يتم هاتفياً أو عبر واتساب.
        </p>

        <div className="mt-8 rounded-[12px] border border-line bg-white p-6 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-[13px] font-extrabold text-muted">رقم الجوال</h2>
          <p className="mt-1 text-[28px] font-extrabold tabular-nums" dir="ltr">
            {CONTACT_PHONE_DISPLAY}
          </p>
          <p className="mt-1 text-[12px] text-muted" dir="ltr">
            الرابط الدولي: +{CONTACT_PHONE_INTL}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={telHref()}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-navy px-4 text-[13px] font-extrabold text-white"
            >
              <Phone className="size-4" />
              اتصل
            </a>
            <a
              href={whatsappHref(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-green px-4 text-[13px] font-extrabold text-white"
            >
              <MessageCircle className="size-4" />
              واتساب
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

        <section className="mt-8 rounded-[12px] border border-line bg-white p-6 dark:border-white/10 dark:bg-white/5">
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
        </section>

        <section className="mt-8">
          <h2 className="text-[16px] font-extrabold">أوقات الرد</h2>
          <p className="mt-2 text-[14px] leading-7 text-muted">
            عادةً يتم الرد خلال أوقات العمل الرسمية. إن لم يكن الرقم متاحاً، أرسل رسالة واتساب وسيتم
            التواصل في أقرب وقت.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}