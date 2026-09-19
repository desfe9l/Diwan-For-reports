import { useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  Key,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { BRAND, whatsappHref } from "@/lib/brand";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

const PLANS = [
  {
    id: "individual",
    title: "ترخيص فردي",
    body: "للمصمم أو الموظف الذي يعمل على جهازه.",
    items: ["القوالب الكاملة", "التصدير المتقدم", "تحديثات النسخة المرخصة"],
  },
  {
    id: "team",
    title: "ترخيص فريق",
    body: "لفريق محتوى أو اتصال مؤسسي صغير.",
    items: ["كل مزايا الترخيص الفردي", "تفعيل لعدة مستخدمين", "تهيئة هوية الجهة"],
  },
  {
    id: "enterprise",
    title: "ترخيص مؤسسي",
    body: "لتسليم مخصص وسياسات جهة العمل.",
    items: ["تهيئة وتسليم مخصص", "دعم بدء الاستخدام", "خطة تفعيل متفق عليها"],
  },
] as const;

export function PurchasePage() {
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("individual");
  const selected = PLANS.find((item) => item.id === plan) ?? PLANS[0];
  const message = `السلام عليكم، أرغب بطلب ${selected.title} لمنصة ${BRAND.platform}. أرجو إرسال خطوات الدفع والتسليم.`;

  return (
    <div className="min-h-full bg-paper dark:bg-[#111722]">
      <SiteHeader current="/purchase" />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-[12px] font-extrabold tracking-[0.16em] text-green dark:text-gold-2">
          نسخ وتراخيص
        </p>
        <h1 className="mt-3 text-[30px] font-extrabold sm:text-[40px]">
          احصل على نسخة {BRAND.platform} المناسبة لعملك
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-8 text-muted">
          لا توجد عملية دفع مضللة داخل الموقع. يبدأ الطلب برسالة واضحة، ثم تتفق
          على الترخيص والدفع والتسليم قبل تفعيل النسخة.
        </p>

        {/* Plan cards */}
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {PLANS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPlan(item.id)}
              aria-pressed={plan === item.id}
              className={`border p-5 text-right ${plan === item.id ? "border-navy bg-white shadow-panel dark:border-gold dark:bg-white/5" : "border-line bg-white dark:border-white/10 dark:bg-white/5"}`}
            >
              <h2 className="text-[17px] font-extrabold">{item.title}</h2>
              <p className="mt-2 text-[12px] leading-6 text-muted">{item.body}</p>
              <ul className="mt-4 grid gap-2">
                {item.items.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-[12px] font-bold">
                    <CheckCircle2 className="size-3.5 text-ok" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Request plan via WhatsApp */}
        <section className="mt-10 grid gap-6 border-y border-line py-8 md:grid-cols-[1fr_auto] md:items-center dark:border-white/10">
          <div>
            <h2 className="text-[20px] font-extrabold">اطلب {selected.title}</h2>
            <p className="mt-2 text-[13px] leading-7 text-muted">
              سنرسل تفاصيل السعر وطريقة الدفع، ثم نجهز الترخيص ونسخة التسليم حسب
              الاتفاق.
            </p>
          </div>
          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-navy px-5 text-[13px] font-extrabold text-white"
          >
            <MessageCircle className="size-4" />
            تواصل لطلب ترخيص جديد
          </a>
        </section>

        {/* Existing key activation */}
        <section className="mt-10 border-t border-line pt-8 dark:border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-[15px] font-extrabold">لديك مفتاح ترخيص بالفعل؟</h2>
              <p className="mt-1 text-[12px] leading-6 text-muted">
                إذا أرسل لك المنصّب مفتاح ترخيص (NASAQ-…)، فأدخله في صفحة التراخيص لفتح
                الميزات فورًا.
              </p>
              <a
                href="/license"
                className="mt-3 inline-flex items-center gap-2 rounded-[8px] border border-line bg-white px-4 py-2 text-[12px] font-bold dark:border-white/10 dark:bg-white/5 hover:bg-accent"
              >
                <Key className="size-3.5" />
                تفعيل مفتاح الترخيص
              </a>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mt-10">
          <h2 className="text-[20px] font-extrabold">من الطلب إلى بدء الاستخدام</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-4">
            {[
              [MessageCircle, "1. تحديد الاحتياج", "تختار الترخيص وترسل الطلب."],
              [CreditCard, "2. تأكيد الاتفاق", "تتلقى السعر وطريقة الدفع."],
              [ClipboardCheck, "3. تجهيز الترخيص", "تُراجع بيانات الجهة والتسليم."],
              [Download, "4. استلام وبدء العمل", "تصل النسخة المرخصة مع خطوات البدء."],
            ].map(([Icon, title, body]) => {
              const StepIcon = Icon as typeof MessageCircle;
              return (
                <div key={String(title)}>
                  <StepIcon className="size-5 text-navy-2 dark:text-gold-2" />
                  <h3 className="mt-3 text-[14px] font-extrabold">{String(title)}</h3>
                  <p className="mt-1 text-[12px] leading-6 text-muted">{String(body)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-10 flex items-start gap-2 text-[12px] leading-6 text-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
          حماية الترخيص في النسخة التجارية تتطلب تحققًا خادميًا عند التفعيل.
          لا يمكن حماية كود يُرسل إلى المتصفح من النسخ؛ تُسلَّم النسخة المرخصة عبر قناة
          خاصة ويُربط التحقق بخدمة تراخيص قبل النشر التجاري.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
