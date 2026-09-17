#!/usr/bin/env node
/**
 * Brand-asset pass: renders the 1200x630 share card and the 180px tile from
 * the NASAQ visual language (institutional emerald, gold rule, report cover) using
 * code-draw — no external art. Temporary generator; kept until the card ships.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "/workspace/project/public";
mkdirSync(OUT, { recursive: true });

const card = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;800;900&family=Tajawal:wght@500;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;font-family:Cairo,system-ui,sans-serif;background:#006c35;overflow:hidden;position:relative}
  .grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px);background-size:60px 60px}
  .wrap{position:relative;height:100%;display:grid;grid-template-columns:1fr 400px;gap:56px;padding:64px 72px;align-items:center}
  .eyebrow{display:inline-flex;align-items:center;gap:12px;color:#e0c894;font-weight:800;font-size:19px;letter-spacing:.5px}
  .eyebrow i{display:block;width:44px;height:3px;background:#e0c894;border-radius:2px}
  h1{color:#fff;font-weight:900;font-size:60px;line-height:1.25;margin-top:22px}
  p{color:#b9c4d6;font-family:Tajawal,system-ui,sans-serif;font-weight:500;font-size:24px;line-height:1.65;margin-top:20px;max-width:600px}
  .tags{display:flex;gap:10px;margin-top:34px;flex-wrap:wrap}
  .tag{border:1px solid #ffffff2b;color:#dfe6f0;border-radius:999px;padding:9px 18px;font-size:16px;font-weight:700;font-family:Tajawal,sans-serif}
  .sheet{position:relative;height:502px;background:#fff;border-radius:6px;box-shadow:0 30px 70px #00000059;overflow:hidden;transform:rotate(-1.4deg)}
  .band{height:74px;background:#00552a}
  .rule{height:5px;background:#c9a86a}
  .pad{padding:26px 28px}
  .ln{height:13px;border-radius:3px;background:#00552a1f;margin-bottom:13px}
  .ln.s{width:48%}
  .ln.m{width:72%}
  .statrow{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
  .stat{border:1px solid #00552a20;border-radius:5px;padding:14px 12px}
  .stat b{display:block;color:#00552a;font-size:26px;font-weight:900}
  .stat span{display:block;color:#5d6b80;font-size:12px;font-family:Tajawal,sans-serif;margin-top:4px}
  .bars{margin-top:20px}
  .bar{height:11px;border-radius:4px;background:#00552a14;margin-bottom:10px;overflow:hidden}
  .bar i{display:block;height:100%;background:#c9a86a}
  .seal{position:absolute;left:26px;bottom:24px;width:74px;height:74px;border-radius:50%;border:3px solid #c9a86a55;display:grid;place-items:center;color:#c9a86a;font-size:11px;font-weight:800;text-align:center;line-height:1.3;font-family:Tajawal,sans-serif}
  .who{position:absolute;right:72px;bottom:44px;display:flex;align-items:center;gap:14px;color:#fff}
  .who .mark{width:46px;height:46px;border-radius:10px;background:#00753a;border:1px solid #ffffff26;display:grid;place-items:center}
  .who b{font-size:21px;font-weight:800;display:block}
  .who span{font-size:15px;color:#93a3bb;font-family:Tajawal,sans-serif}
</style></head><body>
<div class="grid"></div>
<div class="wrap">
  <div>
    <div class="eyebrow"><i></i> NASAQ | نَسَق</div>
    <h1>صمّم تقاريرك<br>باحتراف</h1>
    <p>منصة التصميم والتحرير المؤسسي — محرر عربي بمقاسات A4 وA3 وشرائح 16:9 مع تصدير PDF عالي الجودة.</p>
    <div class="tags">
      <span class="tag">A4 رأسي وأفقي</span>
      <span class="tag">جداول وإحصاءات</span>
      <span class="tag">PDF · PNG · Word</span>
    </div>
  </div>
  <div class="sheet">
    <div class="band"></div>
    <div class="rule"></div>
    <div class="pad">
      <div class="ln m"></div>
      <div class="ln s"></div>
      <div class="statrow">
        <div class="stat"><b>904</b><span>إجمالي الحالات</span></div>
        <div class="stat"><b>27</b><span>إصابة</span></div>
        <div class="stat"><b>%68</b><span>نسبة الإنجاز</span></div>
      </div>
      <div class="bars">
        <div class="bar"><i style="width:78%"></i></div>
        <div class="bar"><i style="width:54%"></i></div>
        <div class="bar"><i style="width:36%"></i></div>
      </div>
    </div>
    <div class="seal">مستند<br>رسمي</div>
  </div>
</div>
<div class="who">
  <span class="mark"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="2.6" width="13.4" height="18.8" rx="1.7" stroke="#e0c894" stroke-width="1.7"/><path d="M8 8.4h6.4M8 12.4h6.4M8 16.4h3.6" stroke="#e0c894" stroke-width="1.7" stroke-linecap="round"/></svg></span>
  <span><b>NASAQ | نَسَق</b><span>منصة التصميم والتحرير المؤسسي — من تطوير فيصل سعود العنزي</span></span>
</div>
</body></html>`;

const icon = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0}
  body{width:180px;height:180px;background:#006c35;display:grid;place-items:center}
  svg{display:block}
</style></head><body>
  <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
    <rect x="7.4" y="4" width="17.2" height="24" rx="2.2" stroke="#e0c894" stroke-width="1.9"/>
    <path d="M11.6 12.2h8.8M11.6 16.6h8.8M11.6 21h5" stroke="#e0c894" stroke-width="1.9" stroke-linecap="round"/>
    <path d="M20.6 4v5.6h4" stroke="#c9a86a" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>
</body></html>`;

const browser = await chromium.launch({
  // Containers usually ship a system Chromium instead of Playwright's download.
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});

const cardPage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await cardPage.setContent(card, { waitUntil: "networkidle" });
await cardPage.waitForTimeout(1200);
const cardBuf = await cardPage.screenshot({ type: "jpeg", quality: 88 });
writeFileSync(`${OUT}/og.jpg`, cardBuf);

const iconPage = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
await iconPage.setContent(icon, { waitUntil: "networkidle" });
await iconPage.waitForTimeout(400);
writeFileSync(`${OUT}/__grok/icon-180.png`, await iconPage.screenshot({ type: "png", omitBackground: false }));

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#006c35"/>
  <rect x="7.4" y="4.6" width="17.2" height="23" rx="2" fill="none" stroke="#e0c894" stroke-width="1.9"/>
  <path d="M11.6 12.6h8.8M11.6 16.8h8.8M11.6 21h5" stroke="#e0c894" stroke-width="1.9" stroke-linecap="round"/>
  <path d="M20.6 4.6v5.4h4" stroke="#c9a86a" stroke-width="1.7" stroke-linejoin="round"/>
</svg>`;
writeFileSync(`${OUT}/favicon.svg`, favicon);

await browser.close();
console.log("wrote og.jpg", cardBuf.length, "bytes");