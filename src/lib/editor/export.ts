import { toast } from "sonner";
import { downloadBlob, downloadText } from "@/lib/utils";
import { A4, cssFont, parseTable, type CanvasEl, type Page, type Project } from "./model";

export type ExportFormat = "pdf" | "pptx" | "docx" | "png" | "html" | "json";

function waitFrame() {
  return new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

async function waitImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((res) => {
          if (img.complete && img.naturalWidth > 0) return res();
          const done = () => res();
          img.onload = done;
          img.onerror = done;
          setTimeout(done, 2500);
        }),
    ),
  );
}

export async function capturePages(
  nodes: HTMLElement[],
  scale: number,
  onProgress?: (i: number, n: number) => void,
): Promise<HTMLCanvasElement[]> {
  const html2canvas = (await import("html2canvas")).default;
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < nodes.length; i++) {
    onProgress?.(i, nodes.length);
    const node = nodes[i];
    await waitFrame();
    await waitImages(node);
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]);
    }
    const canvas = await html2canvas(node, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: node.offsetWidth,
      height: node.offsetHeight,
      windowWidth: node.offsetWidth,
      windowHeight: node.offsetHeight,
    });
    out.push(canvas);
  }
  return out;
}

export async function exportPdf(canvases: HTMLCanvasElement[], name: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  canvases.forEach((c, i) => {
    if (i > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, A4.w, A4.h, undefined, "FAST");
  });
  pdf.save(`${name}.pdf`);
}

export async function exportPptx(canvases: HTMLCanvasElement[], name: string) {
  const mod = (await import("pptxgenjs")) as unknown as { default: new () => PptxWriter };
  const pptx = new mod.default();
  pptx.defineLayout({ name: "A4", width: 8.27, height: 11.69 });
  pptx.layout = "A4";
  pptx.author = "ديوان التقارير";
  pptx.title = name;
  canvases.forEach((c) => {
    const slide = pptx.addSlide();
    slide.addImage({ data: c.toDataURL("image/jpeg", 0.92), x: 0, y: 0, w: 8.27, h: 11.69 });
  });
  await pptx.writeFile({ fileName: `${name}.pptx` });
}

interface PptxWriter {
  defineLayout: (o: { name: string; width: number; height: number }) => void;
  layout: string;
  author: string;
  title: string;
  addSlide: () => { addImage: (o: { data: string; x: number; y: number; w: number; h: number }) => void };
  writeFile: (o: { fileName: string }) => Promise<unknown>;
}

export async function exportDocx(canvases: HTMLCanvasElement[], name: string) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, ImageRun } = docx;
  const mm = (docx as { convertMillimetersToTwip?: (n: number) => number }).convertMillimetersToTwip
    ? (n: number) => (docx as { convertMillimetersToTwip: (n: number) => number }).convertMillimetersToTwip(n)
    : (n: number) => Math.round(n * 56.7);

  const sections = await Promise.all(
    canvases.map(async (c) => {
      const dataUrl = c.toDataURL("image/jpeg", 0.92);
      const buf = await (await fetch(dataUrl)).arrayBuffer();
      return {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: { top: mm(0), right: mm(0), bottom: mm(0), left: mm(0) },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 0, before: 0 },
            children: [
              new ImageRun({
                type: "jpg",
                data: buf,
                transformation: { width: 794, height: 1123 },
              }),
            ],
          }),
        ],
      };
    }),
  );
  const doc = new Document({
    creator: "ديوان التقارير",
    title: name,
    sections,
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${name}.docx`);
}

export async function exportPngZip(canvases: HTMLCanvasElement[], name: string) {
  if (canvases.length === 1) {
    canvases[0].toBlob((blob) => {
      if (blob) downloadBlob(blob, `${name}.png`);
    }, "image/png");
    return;
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  await Promise.all(
    canvases.map(
      (c, i) =>
        new Promise<void>((res) => {
          c.toBlob((blob) => {
            if (blob) zip.file(`${name}-p${String(i + 1).padStart(2, "0")}.png`, blob);
            res();
          }, "image/png");
        }),
    ),
  );
  const out = await zip.generateAsync({ type: "blob" });
  downloadBlob(out, `${name}-pages.zip`);
}

function esc(v: unknown) {
  const map: Record<string, string> = {
    "&": "\u0026amp;",
    "<": "\u0026lt;",
    ">": "\u0026gt;",
    '"': "\u0026quot;",
    "'": "\u0026#039;",
  };
  return String(v ?? "").replace(/[&<>"']/g, (ch) => map[ch] || ch);
}

function formatMultiline(text: string) {
  return esc(text).replace(/\n/g, "<br/>");
}

function elHtml(el: CanvasEl): string {
  const s = el.style || {};
  const wrap = (inner: string) =>
    `<div class="el" style="left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;transform:rotate(${el.rotation || 0}deg);opacity:${el.opacity ?? 1};z-index:${el.z}">${inner}</div>`;

  if (el.hidden) return "";
  if (el.type === "text") {
    return wrap(
      `<div class="text" style="font-family:${cssFont(s.fontFamily)};font-size:${s.fontSize || 14}pt;color:${s.color || "#172033"};font-weight:${s.fontWeight || 600};text-align:${s.textAlign || "right"};line-height:${s.lineHeight || 1.45};font-style:${s.fontStyle || "normal"}">${formatMultiline(el.content || "")}</div>`,
    );
  }
  if (el.type === "box" || el.type === "stat") {
    return wrap(
      `<div class="box" style="background:${s.fill || s.background || "#f7f8fb"};border:${s.borderWidth || 0.35}mm solid ${s.borderColor || "#d9dee8"};border-radius:${s.radius || 4}mm;padding:${s.padding ?? 4}mm;font-family:${cssFont(s.fontFamily)};font-size:${s.fontSize || 12}pt;color:${s.color || "#172033"};font-weight:${s.fontWeight || 600};text-align:${s.textAlign || "right"};line-height:${s.lineHeight || 1.5}">${formatMultiline(el.content || "")}</div>`,
    );
  }
  if (el.type === "shape") {
    const radius = s.shape === "circle" ? "999mm" : `${s.radius || 0}mm`;
    return wrap(
      `<div style="width:100%;height:100%;background:${s.fill || "#071d3d"};border:${s.borderWidth || 0}mm solid ${s.borderColor || "transparent"};border-radius:${radius}"></div>`,
    );
  }
  if (el.type === "line") {
    const vertical = el.h > el.w;
    return wrap(
      `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div style="${vertical ? `width:${s.stroke || 0.8}mm;height:100%` : `height:${s.stroke || 0.8}mm;width:100%`};background:${s.color || "#c6a05a"}"></div></div>`,
    );
  }
  if (el.type === "divider") {
    return wrap(
      `<div style="width:100%;height:100%;display:flex;align-items:center;gap:6px"><span style="flex:1;height:${s.stroke || 0.5}mm;background:${s.color || "#c6a05a"}"></span><span style="width:4mm;height:4mm;border:0.45mm solid ${s.color || "#c6a05a"};transform:rotate(45deg)"></span><span style="flex:1;height:${s.stroke || 0.5}mm;background:${s.color || "#c6a05a"}"></span></div>`,
    );
  }
  if (el.type === "image" || el.type === "logo" || el.type === "qr") {
    return wrap(
      `<img alt="" src="${esc(el.src || "")}" style="width:100%;height:100%;object-fit:${s.objectFit || "cover"};object-position:${s.objectX ?? 50}% ${s.objectY ?? 50}%;border-radius:${s.radius || 0}mm"/>`,
    );
  }
  if (el.type === "icon") {
    return wrap(
      `<div style="width:100%;height:100%;color:${s.color || "#c6a05a"};display:grid;place-items:center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${s.stroke || 1.8}" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%"><path d="M12 3 14.8 9l6.2.7-4.6 4.2 1.2 6.1L12 16.8 6.4 20l1.2-6.1L3 9.7 9.2 9 12 3Z"/></svg></div>`,
    );
  }
  if (el.type === "stamp") {
    return wrap(
      `<div style="width:100%;height:100%;border-radius:999px;border:0.7mm double ${s.borderColor || s.color || "#c6a05a"};color:${s.color || "#c6a05a"};display:grid;place-items:center;text-align:center;font-family:${cssFont(s.fontFamily || "Amiri")};font-weight:700;font-size:${s.fontSize || 12}pt;transform:rotate(-12deg)">${formatMultiline(el.content || "معتمد")}</div>`,
    );
  }
  if (el.type === "table") {
    const cols = s.cols || 3;
    const rows = s.rows || 4;
    const data = parseTable(el.content, cols, rows);
    const cells = data
      .map((row, ri) => {
        const tag = ri === 0 ? "th" : "td";
        return `<tr>${row
          .map(
            (c) =>
              `<${tag} style="border:0.3mm solid ${s.borderColor || "#bfc7d6"};padding:2mm;${ri === 0 ? `background:${s.headerBg || "#071d3d"};color:${s.headerColor || "#fff"}` : `background:${s.tableBg || "#fff"};color:${s.color || "#172033"}`}">${esc(c)}</${tag}>`,
          )
          .join("")}</tr>`;
      })
      .join("");
    return wrap(
      `<table style="width:100%;height:100%;border-collapse:collapse;table-layout:fixed;font-family:${cssFont(s.fontFamily)};font-size:${s.fontSize || 11}pt;direction:rtl">${cells}</table>`,
    );
  }
  return "";
}

export function buildStandaloneHtml(project: Project, pages: Page[]) {
  const body = pages
    .map(
      (p) =>
        `<section class="page" style="background:${p.bg || "#fff"}">${p.elements
          .slice()
          .sort((a, b) => a.z - b.z)
          .map(elHtml)
          .join("")}</section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${esc(project.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Noto+Kufi+Arabic:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&family=Reem+Kufi:wght@400;700&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #e8eaef; font-family: "Tajawal","Cairo",sans-serif; }
  .page { width: 210mm; height: 297mm; margin: 12mm auto; position: relative; overflow: hidden; background: #fff; box-shadow: 0 18px 50px rgba(15,23,42,.16); page-break-after: always; }
  .el { position: absolute; overflow: hidden; }
  .text, .box { width: 100%; height: 100%; white-space: pre-wrap; word-break: break-word; }
  img { display: block; }
  @media print {
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; page-break-after: always; }
  }
</style>
</head>
<body>
${body}
</body>
</html>`;
}

export function exportJson(project: Project) {
  downloadText(JSON.stringify(project, null, 2), `${project.name || "report"}.json`, "application/json");
}

export function exportHtmlFile(project: Project, pages: Page[]) {
  downloadText(buildStandaloneHtml(project, pages), `${project.name || "report"}.html`, "text/html");
}

export async function runExport(
  format: ExportFormat,
  canvases: HTMLCanvasElement[] | null,
  project: Project,
  pages: Page[],
) {
  const name = (project.name || "تقرير").replace(/[\\/:*?"<>|]+/g, "-");
  try {
    if (format === "json") {
      exportJson({ ...project, pages: project.pages });
      toast.success("تم تنزيل ملف المشروع");
      return;
    }
    if (format === "html") {
      exportHtmlFile(project, pages);
      toast.success("تم تنزيل ملف HTML المستقل");
      return;
    }
    if (!canvases?.length) {
      toast.error("تعذر التقاط الصفحات");
      return;
    }
    if (format === "pdf") await exportPdf(canvases, name);
    if (format === "pptx") await exportPptx(canvases, name);
    if (format === "docx") await exportDocx(canvases, name);
    if (format === "png") await exportPngZip(canvases, name);
    toast.success("تم التصدير بنجاح");
  } catch (err) {
    console.error(err);
    toast.error("فشل التصدير. حاول جودة أقل أو قلّل عدد الصور.");
    throw err;
  }
}
