#!/usr/bin/env node
/**
 * Deep functional QA for the studio: project + page CRUD, element editing,
 * undo/redo, autosave, and the export pipeline. Temporary harness — deleted
 * after the verification run.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

// --- Home page ---
check("home: brand name visible", await page.getByText("فيصل العنزي").first().isVisible());
check("home: hero heading", await page.getByText("صمّم تقاريرك باحتراف").isVisible());
check("home: phone in footer/header", (await page.getByText("0552017111").count()) > 0);
await page.screenshot({ path: `${OUT}/qa-01-home.png`, fullPage: false });

// --- Create a project from the official pack ---
await page.getByRole("button", { name: "إنشاء مشروع جديد" }).click();
await page.waitForURL("**/editor", { timeout: 15000 });
await page.waitForSelector(".report-page", { timeout: 15000 });
const pageCount = await page.locator("#export-root .report-page").count();
check("editor: project opened with pages", pageCount >= 1, `${pageCount} page(s)`);
await page.screenshot({ path: `${OUT}/qa-02-editor.png` });

// --- Page rail present + thumbnails ---
const railItems = await page.locator("ul li").filter({ has: page.locator("button[aria-current]") }).count();
check("editor: page rail items", railItems >= 1, `${railItems}`);

// --- Add a text element ---
const beforeEls = await page.locator(".studio-grid > div > div .report-page .canvas-el").count();
await page.getByRole("button", { name: "عناصر" }).first().click();
await page.getByRole("button", { name: "نص", exact: true }).first().click();
await page.waitForTimeout(400);
const afterEls = await page.locator(".studio-grid > div > div .report-page .canvas-el").count();
check("editor: add text element", afterEls === beforeEls + 1, `${beforeEls} → ${afterEls}`);

// --- Properties panel shows for the selection ---
check("editor: properties panel on select", await page.getByText("العرض مم").isVisible());
check("editor: X/Y fields present", await page.getByText("X مم").isVisible());

// --- Edit via properties (X) ---
const xInput = page.locator('label:has-text("X مم") input').first();
await xInput.fill("12");
await xInput.blur();
await page.waitForTimeout(300);

// --- Undo / redo via keyboard ---
const countAfterX = await page.locator(".studio-grid > div > div .report-page .canvas-el").count();
await page.keyboard.press("Control+z");
await page.waitForTimeout(300);
await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(300);
check("editor: undo/redo keeps element", (await page.locator(".studio-grid > div > div .report-page .canvas-el").count()) === countAfterX);

// --- Undo removes the added element ---
await page.keyboard.press("Control+z");
await page.waitForTimeout(250);
await page.keyboard.press("Control+z");
await page.waitForTimeout(250);
const afterUndo = await page.locator(".studio-grid > div > div .report-page .canvas-el").count();
check("editor: undo reverts additions", afterUndo < countAfterX, `${countAfterX} → ${afterUndo}`);
await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(250);
await page.keyboard.press("Control+Shift+z");
await page.waitForTimeout(250);

// --- Add a table element + check the grid editor ---
await page.getByRole("button", { name: "جدول", exact: true }).first().click();
await page.waitForTimeout(400);
check("editor: add table", await page.getByText("أعمدة").isVisible());
await page.getByRole("button", { name: "تحرير الخلايا كشبكة" }).click();
await page.waitForTimeout(200);
const gridInputs = await page.locator('table input').count();
check("editor: table grid editor", gridInputs >= 6, `${gridInputs} cells`);
await page.getByRole("button", { name: "إغلاق محرر الخلايا" }).click();

// --- Progress element (new) ---
await page.getByRole("button", { name: "شريط تقدم" }).first().click();
await page.waitForTimeout(400);
check("editor: progress element + slider", await page.getByText(/القيمة: /).isVisible());

// --- Add a new page, duplicate, reorder via rail ---
const pagesBefore = await page.locator("#export-root .report-page").count();
await page.locator("button", { hasText: /^صفحة$/ }).first().click();
await page.waitForTimeout(500);
const pagesAfterAdd = await page.locator("#export-root .report-page").count();
check("editor: add page", pagesAfterAdd === pagesBefore + 1, `${pagesBefore} → ${pagesAfterAdd}`);

// Left panel pages tab has per-page controls
await page.locator("aside").first().getByRole("button", { name: "صفحات" }).click();
await page.waitForTimeout(300);
check("editor: pages tab lists pages", (await page.getByText(/عنصر$/).count()) > 0);

// --- Page size change (A4 landscape) ---
await page.getByRole("button", { name: "إعدادات" }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /A4 أفقي/ }).click();
await page.waitForTimeout(400);
const sizeText = await page.locator(".studio-grid .report-page").first().evaluate((n) => getComputedStyle(n).width);
check("editor: page size applied (landscape wider)", parseFloat(sizeText) > 700, sizeText);

// --- Templates tab inserts a page (infographic) ---
await page.getByRole("button", { name: "قوالب" }).first().click();
await page.waitForTimeout(300);
check("editor: template categories visible", await page.getByRole("button", { name: "إنفوجرافيك", exact: true }).isVisible());
const pagesBeforeTemplate = await page.locator("#export-root .report-page").count();
await page.getByRole("button", { name: /مسار من خمس مراحل/ }).click();
await page.waitForTimeout(600);
check(
  "editor: insert template page",
  (await page.locator("#export-root .report-page").count()) === pagesBeforeTemplate + 1,
);

// --- Theme tab ---
await page.getByRole("button", { name: "سمة" }).first().click();
await page.waitForTimeout(300);
check("editor: theme list", await page.getByText("رمادي حديث").isVisible());

// --- Autosave: wait for the save state to settle, then reload and confirm persistence ---
await page.waitForTimeout(2200);
const storageKeys = await page.evaluate(async () => {
  const dbs = (await indexedDB.databases?.()) ?? [];
  return dbs.map((d) => d.name);
});
check("storage: IndexedDB created", storageKeys.includes("faisal-reports"), storageKeys.join(","));

const persisted = await page.evaluate(async () => {
  const open = indexedDB.open("faisal-reports");
  const db = await new Promise((res, rej) => {
    open.onsuccess = () => res(open.result);
    open.onerror = () => rej(open.error);
  });
  const tx = db.transaction("projects", "readonly");
  const all = await new Promise((res, rej) => {
    const r = tx.objectStore("projects").getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return all.map((p) => ({ name: p.name, pages: p.pages.length, w: p.pages[0].w, allWidths: p.pages.map((x) => x.w) }));
});
check("storage: project persisted with pages", persisted.length >= 1, JSON.stringify(persisted[0] || null));
check(
  "storage: page size persisted",
  persisted[0]?.allWidths?.some((w) => Math.round(w) === 297),
  `widths=${JSON.stringify(persisted[0]?.allWidths)}`,
);

await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector(".report-page", { timeout: 15000 });
check("editor: reopens after reload", (await page.locator("#export-root .report-page").count()) >= 1);
await page.screenshot({ path: `${OUT}/qa-03-editor-reload.png` });

// --- Export JSON downloads a file with pages ---
await page.getByRole("button", { name: "تصدير" }).click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: /ملف المشروع/ }).click();
const [jsonDownload] = await Promise.all([
  page.waitForEvent("download", { timeout: 20000 }),
  page.getByRole("button", { name: "تنزيل الملف" }).click(),
]);
const jsonPath = `${OUT}/qa-export.json`;
await jsonDownload.saveAs(jsonPath);
const jsonBody = await (await import("node:fs/promises")).readFile(jsonPath, "utf8");
const parsedJson = JSON.parse(jsonBody);
check(
  "export: JSON contains pages + elements",
  Array.isArray(parsedJson.pages) && parsedJson.pages.length > 0,
  `${parsedJson.pages?.length} pages`,
);
writeFileSync(`${OUT}/qa-export-summary.txt`, `${jsonDownload.suggestedFilename()} (${jsonBody.length} bytes)`);

// --- Export HTML is self-contained ---
await page.getByRole("button", { name: "تصدير" }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: /HTML مستقل/ }).click();
const [htmlDownload] = await Promise.all([
  page.waitForEvent("download", { timeout: 20000 }),
  page.getByRole("button", { name: "تنزيل الملف" }).click(),
]);
await htmlDownload.saveAs(`${OUT}/qa-export.html`);
const htmlBody = await (await import("node:fs/promises")).readFile(`${OUT}/qa-export.html`, "utf8");
check("export: HTML has dir=rtl and google fonts", htmlBody.includes('dir="rtl"') && htmlBody.includes("fonts.googleapis.com"));
check("export: HTML escapes content (no raw script injection)", !htmlBody.includes("<script"));

// --- Exported HTML must resist hostile data from an imported .json ---
// Style fields and image sources are attacker-controlled once a project is
// imported, and the exported document is opened/hosted by the user.
const hostile = await page.evaluate(async () => {
  const mod = await import("/src/lib/editor/export.ts");
  const mk = (style, src, bg) => ({
    version: 2, name: "PoC", theme: "official", defaultSize: "a4-portrait",
    pages: [{
      id: "p1", name: "s", w: 210, h: 297, bg,
      elements: [{ id: "e1", type: "image", x: 10, y: 10, w: 80, h: 60, z: 1, src, style }],
    }],
  });
  const a = mk({ objectFit: 'cover" onerror="alert(1)', objectX: 50 }, "data:image/gif;base64,R0lGODlhAQABAAAAACw=");
  const b = mk({ objectFit: "cover" }, "javascript:alert(2)");
  const c = mk({ objectFit: "cover" }, "data:image/gif;base64,R0lGODlhAQABAAAAACw=", '#fff"><script>alert(3)</script>');
  return {
    breakout: mod.buildStandaloneHtml(a, a.pages),
    jsUrl: mod.buildStandaloneHtml(b, b.pages),
    pageBg: mod.buildStandaloneHtml(c, c.pages),
  };
});
check(
  "security: imported style values cannot inject attributes",
  !hostile.breakout.includes("onerror=") && !hostile.breakout.includes("alert(1)"),
);
check(
  "security: javascript: image URLs are dropped",
  !hostile.jsUrl.includes("javascript:") && !hostile.jsUrl.includes("alert(2)"),
);
check(
  "security: page background cannot break out of the attribute",
  hostile.pageBg.includes("background:#fff") &&
    !hostile.pageBg.includes("<script") &&
    !hostile.pageBg.includes("alert(3)"),
);

// --- Export PNG (raster path through the hidden capture pages) ---
await page.getByRole("button", { name: "تصدير" }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: /^PNG/ }).click();
const [pngDownload] = await Promise.all([
  page.waitForEvent("download", { timeout: 90000 }),
  page.getByRole("button", { name: "تنزيل الملف" }).click(),
]);
const pngPath = `${OUT}/qa-export.zip`;
await pngDownload.saveAs(pngPath);
const { statSync, readFileSync } = await import("node:fs");
const pngBytes = readFileSync(pngPath);
const pngSize = statSync(pngPath).size;
// Multi-page raster export ships as a ZIP of one PNG per page.
const isZip = pngBytes.subarray(0, 2).toString() === "PK";
const isPng = pngBytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
let pngCount = 0;
if (isZip) {
  // Count central-directory entries ending in .png without needing unzip(1).
  const raw = pngBytes.toString("latin1");
  pngCount = (raw.match(/\.png/g) || []).length;
}
check(
  "export: PNG pages generated",
  (isPng || (isZip && pngCount >= 2)) && pngSize > 50000,
  isZip ? `zip with ${pngCount} PNG pages, ${Math.round(pngSize / 1024)} KB` : `${Math.round(pngSize / 1024)} KB`,
);

// --- Export PDF ---
await page.getByRole("button", { name: "تصدير" }).click();
await page.waitForTimeout(250);
await page.getByRole("button", { name: /^PDF/ }).click();
const [pdfDownload] = await Promise.all([
  page.waitForEvent("download", { timeout: 60000 }),
  page.getByRole("button", { name: "تنزيل الملف" }).click(),
]);
await pdfDownload.saveAs(`${OUT}/qa-export.pdf`);
const pdfStat = await (await import("node:fs/promises")).stat(`${OUT}/qa-export.pdf`);
const pdfHead = await (await import("node:fs/promises")).readFile(`${OUT}/qa-export.pdf`);
check(
  "export: PDF generated with pages",
  pdfHead.subarray(0, 4).toString() === "%PDF" && pdfStat.size > 50000,
  `${Math.round(pdfStat.size / 1024)} KB`,
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (consoleErrors.length) {
  console.log("CONSOLE ERRORS:");
  consoleErrors.forEach((e) => console.log(" -", e));
}
writeFileSync(`${OUT}/qa-results.json`, JSON.stringify({ results, consoleErrors }, null, 2));
process.exit(failed.length || consoleErrors.length ? 1 : 0);
