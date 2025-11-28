import { NextRequest, NextResponse } from "next/server";
import iconv from "iconv-lite";
import {
  downloadOnecAppointmentDocument,
  downloadOnecDocument,
  OnecLogicalError,
} from "@/server/onecAuthClient";

function sanitizeFilename(name: string) {
  return name.replace(/["\\\r\n]/g, "").trim() || "document";
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

async function renderHtmlToPdf(html: string) {
  // Lazy-load тяжелую зависимость, чтобы не держать ее в cold start.
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: "new",
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
    return NextResponse.json({ error: "Нет параметра uid" }, { status: 400 });
  }

  // 1C не принимает символы вне однобайтного диапазона (ByteString) — отсекаем такие uid.
  const byteSafe = Array.from(uid).every((ch) => ch.charCodeAt(0) <= 0xff);
  if (!byteSafe) {
    return NextResponse.json({ error: "Неверный идентификатор документа" }, { status: 400 });
  }

  const docType = (req.nextUrl.searchParams.get("type") || req.nextUrl.searchParams.get("kind") || "").toLowerCase();
  const filenameParam = req.nextUrl.searchParams.get("filename");

  try {
    const loader = docType === "appointment" ? downloadOnecAppointmentDocument : downloadOnecDocument;
    const { buffer, contentType, disposition } = await loader(uid);
    const fallbackName = filenameParam ? sanitizeFilename(filenameParam) : sanitizeFilename(uid);
    const filename = parseFilenameFromDisposition(disposition) ?? fallbackName;
    const isHtml =
      docType === "appointment" ||
      (contentType ? /text\/html|application\/xhtml\+xml/i.test(contentType) : false);

    if (isHtml) {
      const html = decodeHtml(buffer);
      const pdf = await renderHtmlToPdf(html);
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": buildContentDisposition(filename.endsWith(".pdf") ? filename : `${filename}.pdf`),
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
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Не удалось скачать документ";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
