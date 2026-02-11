import { NextRequest, NextResponse } from "next/server";
import iconv from "iconv-lite";
import { downloadOnecAppointmentHtml, downloadOnecDocument, OnecLogicalError } from "@/server/onecAuthClient";
import { getAuthFromRequest } from "@/server/authCookie";

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

function decodeHtmlBest(buffer: Buffer, contentType?: string | null) {
  const primary = detectHtmlCharset(buffer, contentType) === "windows-1251" ? "win1251" : "utf-8";
  const primaryText = primary === "win1251" ? iconv.decode(buffer, "win1251") : buffer.toString("utf-8");
  if (!primaryText.includes("\uFFFD")) {
    return primaryText;
  }

  const fallbackText = primary === "win1251" ? buffer.toString("utf-8") : iconv.decode(buffer, "win1251");
  return fallbackText.includes("\uFFFD") ? primaryText : fallbackText;
}

function detectHtmlCharset(buffer: Buffer, contentType?: string | null) {
  const fromHeader = contentType?.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase();
  if (fromHeader) {
    return fromHeader.includes("1251") ? "windows-1251" : "utf-8";
  }

  const latin = buffer.toString("latin1");
  const metaMatch = latin.match(/charset\s*=\s*['\"]?([a-z0-9_-]+)/i);
  const metaCharset = metaMatch?.[1]?.toLowerCase();
  if (metaCharset) {
    return metaCharset.includes("1251") ? "windows-1251" : "utf-8";
  }

  const utfText = buffer.toString("utf-8");
  return utfText.includes("\uFFFD") ? "windows-1251" : "utf-8";
}

function injectPdfButton(html: string) {
  const layoutHtml = `
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>
  @font-face {
    font-family: 'Onest';
    src: url('/font/WOFF/OnestRegular1602-hint.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Onest';
    src: url('/font/WOFF/OnestMedium1602-hint.woff') format('woff');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'Onest';
    src: url('/font/WOFF/OnestBold1602-hint.woff') format('woff');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  :root {
    --mg-doc-bg: #f2f5f9;
    --mg-doc-paper: #ffffff;
    --mg-doc-text: #0f172a;
    --mg-doc-muted: #64748b;
    --mg-doc-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
    --mg-doc-radius: 18px;
    --mg-doc-max: 800px;
    --mg-doc-scale: 1;
  }

  html, body {
    height: 100%;
    background: var(--mg-doc-bg);
    color: var(--mg-doc-text);
    font-family: 'Onest';
    margin: 0;
    overflow-x: hidden;
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
    overflow-x: hidden;
  }

  #mg-doc-paper {
    width: 100%;
    max-width: var(--mg-doc-max);
    background: var(--mg-doc-paper);
    border-radius: var(--mg-doc-radius);
    box-shadow: var(--mg-doc-shadow);
    padding: 32px 36px;
    box-sizing: border-box;
    overflow-x: hidden;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    display: flex;
    justify-content: center;
  }

  #mg-doc-body {
    width: var(--mg-doc-max);
    max-width: var(--mg-doc-max);
    flex: 0 0 auto;
    margin: 0 auto;
    transform: scale(var(--mg-doc-scale));
    transform-origin: top center;
  }

  #mg-doc-paper * {
    box-sizing: border-box;
    max-width: 100%;
  }

  #mg-doc-body,
  #mg-doc-body * {
    font-family: 'Onest' !important;
  }

  #mg-doc-paper table {
    width: 100% !important;
    max-width: 100%;
  }

  #mg-doc-paper img,
  #mg-doc-paper svg,
  #mg-doc-paper iframe {
    max-width: 100%;
    height: auto;
  }
  #mg-doc-actions {
    position: fixed;
    left: 50%;
    bottom: 28px;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 99999;
  }

  .mg-doc-btn {
    border-radius: 14px;
    padding: 12px 18px;
    font: 600 14px/1.2 'Onest';
    cursor: pointer;
    min-width: 140px;
    text-align: center;
  }

  .mg-doc-btn:active {
    transform: translateY(1px);
  }

  #mg-doc-back {
    background: #ffffff;
    color: #0f172a;
    border: 1px solid rgba(148, 163, 184, 0.6);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  }

  #mg-doc-download {
    background: #0ea5e9;
    color: #fff;
    border: none;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.35);
  }

  @media (max-width: 900px) {

    #mg-doc-content {
      padding: 16px 12px 96px;
      justify-content: flex-start;
    }

    #mg-doc-paper {
      width: 100%;
      max-width: 100%;
      border-radius: var(--mg-doc-radius);
      padding: 16px 12px;
      justify-content: center;
    }

    #mg-doc-body {
      width: var(--mg-doc-max);
      max-width: var(--mg-doc-max);
      margin: 0 auto;
    }
    #mg-doc-actions {
      bottom: 22px;
      gap: 10px;
    }

    .mg-doc-btn {
      padding: 14px 18px;
      font-size: clamp(16px, 3.2vw, 20px);
      min-width: 0;
      width: calc(50vw - 24px);
      max-width: 220px;
    }
  }

  @media print {
    #mg-doc-actions { display: none !important; }
    #mg-doc-paper { box-shadow: none; }
    html, body, #mg-doc-content, #mg-doc-paper {
      overflow: visible !important;
    }
    a, a:visited { color: inherit; text-decoration: none; }
    a[href]::after, a[href]::before { content: "" !important; }
  }

  @page {
    size: auto;
    margin: 12mm;
  }
</style>
<div id="mg-doc-shell">
  <div id="mg-doc-content">
    <div id="mg-doc-paper">
      <div id="mg-doc-body">
`;

  const layoutFooter = `
      </div>
    </div>
  </div>
</div>
<div id="mg-doc-actions">
  <button id="mg-doc-back" class="mg-doc-btn" type="button" onclick="window.__mgGoBack && window.__mgGoBack()">&#1053;&#1072;&#1079;&#1072;&#1076;</button>
  <button id="mg-doc-download" class="mg-doc-btn" type="button" onclick="window.__mgDownloadPdf && window.__mgDownloadPdf()">&#1057;&#1082;&#1072;&#1095;&#1072;&#1090;&#1100; PDF</button>
</div>
<script>
  (function () {
    window.__mgGoBack = function () {
      try { sessionStorage.setItem('medgraf.skipBootSplash', '1'); } catch (e) {}

      try {
        if (window.opener && !window.opener.closed) {
          window.close();
          return;
        }
      } catch (e) {}

      try {
        if (document.referrer) {
          var prev = new URL(document.referrer);
          if (prev.origin === window.location.origin && window.history.length > 1) {
            window.history.back();
            return;
          }
        }
      } catch (e) {}

      window.location.replace('/home');
    };

    function buildRawUrl() {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('raw', '1');
        return url.toString();
      } catch (e) {
        return window.location.href + (window.location.href.indexOf('?') >= 0 ? '&raw=1' : '?raw=1');
      }
    }

    window.__mgDownloadPdf = function () {
      var rawUrl = buildRawUrl();
      fetch(rawUrl, { credentials: 'same-origin' })
        .then(function (res) { return res.text(); })
        .then(function (rawHtml) {
          var iframe = document.getElementById('mg-doc-print-frame');
          if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'mg-doc-print-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            document.body.appendChild(iframe);
          }
          var doc = iframe.contentWindow && iframe.contentWindow.document;
          if (!doc) return;
          doc.open();
          doc.write(rawHtml);
          doc.close();
          iframe.onload = function () {
            try {
              var url = new URL(window.location.href);
              var name = url.searchParams.get('filename');
              if (name) {
                name = decodeURIComponent(name).replace(/\.html?$/i, '');
                iframe.contentWindow.document.title = name;
              }
            } catch (e) {}
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            } catch (e) {}
          };
        })
        .catch(function () { window.print(); });
    };

    var root = document.documentElement;
    var paper = document.getElementById('mg-doc-paper');
    var docMax = 800;
    function updateScale() {
      if (!paper) return;
      var padding = 0;
      try {
        var styles = window.getComputedStyle(paper);
        padding = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
      } catch (e) {}
      var available = Math.max(0, paper.clientWidth - padding);
      var scale = available > 0 ? Math.min(1, available / docMax) : 1;
      root.style.setProperty('--mg-doc-scale', scale.toFixed(3));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
  })();
</script>
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
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requestedPatientId = req.nextUrl.searchParams.get("patientId") ?? req.nextUrl.searchParams.get("patientID");
  if (requestedPatientId && (!auth.onecId || auth.onecId !== requestedPatientId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
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
      const raw = req.nextUrl.searchParams.get("raw") === "1";
      if (raw) {
        const htmlName = filename.endsWith(".html") ? filename : `${filename}.html`;
        const decoded = decodeHtmlBest(buffer, contentType);
        return new NextResponse(decoded, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": buildInlineDisposition(htmlName),
          },
        });
      }
      const html = decodeHtml(buffer);
      const payload = injectPdfButton(html);
      const htmlName = filename.endsWith(".html") ? filename : `${filename}.html`;
      return new NextResponse(payload, {
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
