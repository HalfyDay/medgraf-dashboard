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
  const layoutHtml = `
<style>
  :root {
    --mg-doc-bg: #f2f5f9;
    --mg-doc-paper: #ffffff;
    --mg-doc-text: #0f172a;
    --mg-doc-muted: #64748b;
    --mg-doc-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
    --mg-doc-radius: 18px;
    --mg-doc-max: 920px;
  }

  html, body {
    height: 100%;
    background: var(--mg-doc-bg);
    color: var(--mg-doc-text);
    margin: 0;
  }

  #mg-doc-shell {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  #mg-doc-content {
    flex: 1 0 auto;
    padding: 32px 24px 110px;
    display: flex;
    justify-content: center;
  }

  #mg-doc-paper {
    width: 100%;
    max-width: var(--mg-doc-max);
    background: var(--mg-doc-paper);
    border-radius: var(--mg-doc-radius);
    box-shadow: var(--mg-doc-shadow);
    padding: 32px 36px;
  }

  #mg-doc-toolbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(148, 163, 184, 0.35);
    padding: 14px 20px;
    display: flex;
    justify-content: center;
  }

  #mg-doc-toolbar button {
    background: #0ea5e9;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    font: 600 14px/1.2 system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.35);
    cursor: pointer;
  }

  #mg-doc-toolbar button:active {
    transform: translateY(1px);
  }

  @media (max-width: 768px) {
    #mg-doc-content {
      padding: 16px 12px 96px;
    }

    #mg-doc-paper {
      border-radius: 14px;
      padding: 20px 18px;
    }
  }

  @media (max-width: 480px) {
    #mg-doc-content {
      padding: 12px 10px 96px;
    }

    #mg-doc-paper {
      border-radius: 10px;
      padding: 16px 14px;
    }

    #mg-doc-toolbar {
      padding: 12px 14px;
    }

    #mg-doc-toolbar button {
      width: 100%;
      max-width: 360px;
    }
  }

  @media print {
    #mg-doc-toolbar { display: none !important; }
    #mg-doc-content { padding: 0; }
    #mg-doc-paper {
      box-shadow: none;
      border-radius: 0;
      max-width: none;
      padding: 0;
    }
    body { background: #ffffff; }
  }
</style>
<div id="mg-doc-shell">
  <div id="mg-doc-content">
    <div id="mg-doc-paper">
`;

  const layoutFooter = `
    </div>
  </div>
</div>
<div id="mg-doc-toolbar">
  <button type="button" onclick="window.print()">Скачать PDF</button>
</div>
`;

  const bodyMatch = /<body[^>]*>/i.exec(html);
  if (bodyMatch && /<\/body>/i.test(html)) {
    const bodyOpen = bodyMatch[0];
    return html
      .replace(bodyOpen, `${bodyOpen}${layoutHtml}`)
      .replace(/<\/body>/i, `${layoutFooter}</body>`);
  }

  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${layoutHtml}${layoutFooter}</html>`);
  }

  return `${layoutHtml}${html}${layoutFooter}`;
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
