import { NextRequest, NextResponse } from "next/server";
import iconv from "iconv-lite";
import { downloadOnecAppointmentHtml, downloadOnecDocument, OnecLogicalError } from "@/server/onecAuthClient";

function sanitizeFilename(name: string) {
  return name.replace(/["\\\r\n]/g, "").trim() || "document";
}

const BYTE_MAX = 0xff;
const DASH_VARIANTS_REGEX = /[\u2010-\u2015\u2212]/g;

function normalizeUid(raw: string) {
  return raw.replace(DASH_VARIANTS_REGEX, "-").replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function makeByteSafeUid(raw: string) {
  const normalized = normalizeUid(raw);
  if (!normalized) {
    return null;
  }

  const byteSafe = Array.from(normalized).every((ch) => ch.charCodeAt(0) <= BYTE_MAX);
  if (byteSafe) {
    return { uid: normalized, reencoded: false };
  }

  // 1C expects only single-byte characters inside uid; recode to cp1251 byte set to avoid ByteString errors.
  const recoded = iconv.encode(normalized, "win1251").toString("latin1");
  const recodedSafe = Array.from(recoded).every((ch) => ch.charCodeAt(0) <= BYTE_MAX);
  return recodedSafe ? { uid: recoded, reencoded: true } : null;
}

function parseFilenameFromDisposition(disposition: string | null) {
  if (!disposition) {
    return null;
  }
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match?.[1] ? sanitizeFilename(match[1]) : null;
}

function buildContentDisposition(filename: string) {
  const sanitized = sanitizeFilename(filename);
  const asciiFallback = sanitized.replace(/[^\x20-\x7E]/g, "_") || "document";
  const encodedUtf8 = encodeURIComponent(sanitized);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`;
}

function buildInlineDisposition(filename: string) {
  const sanitized = sanitizeFilename(filename);
  const asciiFallback = sanitized.replace(/[^\x20-\x7E]/g, "_") || "document";
  const encodedUtf8 = encodeURIComponent(sanitized);
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`;
}

function decodeHtml(buffer: Buffer) {
  const utfText = buffer.toString("utf-8");
  if (!utfText.includes("\uFFFD")) {
    return utfText;
  }
  try {
    return iconv.decode(buffer, "win1251");
  } catch {
    return utfText;
  }
}

function injectPdfButton(html: string) {
  const buttonHtml = `
<div id="mgraft-pdf-toolbar" style="position:fixed;top:16px;right:16px;z-index:99999;">
  <button type="button" onclick="window.print()" style="background:#0ea5e9;color:#fff;border:none;border-radius:10px;padding:10px 14px;font:600 14px/1.2 system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;box-shadow:0 6px 18px rgba(0,0,0,0.18);cursor:pointer;">
    Скачать PDF
  </button>
</div>
<style>
  @media print { #mgraft-pdf-toolbar { display: none !important; } }
</style>
`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${buttonHtml}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${buttonHtml}</html>`);
  }
  return `${buttonHtml}${html}`;
}

async function renderHtmlToPdf(html: string) {
  // Lazy-load С‚СЏР¶РµР»СѓСЋ Р·Р°РІРёСЃРёРјРѕСЃС‚СЊ, С‡С‚РѕР±С‹ РЅРµ РґРµСЂР¶Р°С‚СЊ РµРµ РІ cold start.
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid } = await params;
  if (!uid) {
    return NextResponse.json({ error: "UID is required" }, { status: 400 });
  }

  const preparedUid = makeByteSafeUid(uid);
  if (!preparedUid) {
    return NextResponse.json({ error: "UID contains unsupported characters" }, { status: 400 });
  }

  const docType = (req.nextUrl.searchParams.get("type") || req.nextUrl.searchParams.get("kind") || "").toLowerCase();
  const filenameParam = req.nextUrl.searchParams.get("filename");

  try {
    const loader = docType === "appointment" ? downloadOnecAppointmentHtml : downloadOnecDocument;
    const { buffer, contentType, disposition } = await loader(preparedUid.uid);
    const fallbackName = filenameParam ? sanitizeFilename(filenameParam) : sanitizeFilename(uid);
    const filename = parseFilenameFromDisposition(disposition) ?? fallbackName;
    if (docType === "appointment") {
      const html = injectPdfButton(decodeHtml(buffer));
      const htmlName = filename.endsWith(".html") ? filename : `${filename}.html`;
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": buildInlineDisposition(htmlName),
        },
      });
    }

    const isHtml = contentType ? /text\/html|application\/xhtml\+xml/i.test(contentType) : false;
    if (isHtml) {
      const html = decodeHtml(buffer);
      const pdf = await renderHtmlToPdf(html);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": buildContentDisposition(filename.endsWith(".pdf") ? filename : filename + ".pdf"),
        },
      });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": buildContentDisposition(filename),
      },
    });
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Failed to download document";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
