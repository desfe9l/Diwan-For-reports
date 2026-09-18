import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BRAND, CONTACT_PHONE_DISPLAY, NAV_ITEMS, telHref } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function SiteHeader({ current }: { current: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [current]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#111722]/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <Mark />
          <span className="leading-tight">
            <strong className="block text-[15px] font-extrabold">{BRAND.lockup}</strong>
            <span className="block text-[11px] text-muted">{BRAND.platform}</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.to}
              href={item.to}
              className={cn(
                "rounded-[8px] px-3 py-2 text-[13px] font-bold transition",
                current === item.to
                  ? "bg-navy text-white"
                  : "text-muted hover:bg-line-2 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telHref()}
            className="hidden h-9 items-center gap-2 rounded-[8px] border border-line px-3 text-[12px] font-bold sm:inline-flex dark:border-white/10"
          >
            <span className="tabular-nums" dir="ltr">
              {CONTACT_PHONE_DISPLAY}
            </span>
          </a>
          <a
            href="/demo"
            className="inline-flex h-9 items-center rounded-[8px] bg-navy px-3 text-[12px] font-extrabold text-white"
          >
            العرض التجريبي
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="القائمة"
            className="grid size-9 place-items-center rounded-[8px] border border-line lg:hidden dark:border-white/10"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line px-4 pb-3 lg:hidden dark:border-white/10">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.to}
              href={item.to}
              className={cn(
                "block rounded-[8px] px-3 py-2.5 text-[13px] font-bold",
                current === item.to ? "bg-navy text-white" : "text-muted",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white dark:border-white/10 dark:bg-[#111722]">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark />
            <strong className="text-[14px] font-extrabold">{BRAND.lockup}</strong>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-muted">{BRAND.tagline}</p>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            من تطوير {BRAND.owner}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-[12px] font-extrabold text-muted">روابط</h3>
          <ul className="grid gap-1.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <a href={item.to} className="text-[13px] font-bold hover:text-navy-2">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[12px] font-extrabold text-muted">التواصل</h3>
          <a
            href={telHref()}
            className="inline-flex h-9 items-center rounded-[8px] border border-line px-3 text-[13px] font-bold tabular-nums dark:border-white/10"
            dir="ltr"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            جميع الملفات تُحفظ في متصفحك وتُصدَّر محليًا، فلا تُرفع إلى أي سيرفر.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-[11px] text-muted dark:border-white/10">
        © {new Date().getFullYear()} {BRAND.lockup} — {BRAND.platform}
      </div>
    </footer>
  );
}

function Mark() {
  return (
    <img src="/nasaq-mark.svg" alt="" aria-hidden className="size-9 shrink-0" />
  );
}