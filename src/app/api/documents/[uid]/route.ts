import { NextRequest, NextResponse } from "next/server";
import { downloadOnecDocument, OnecLogicalError } from "@/server/onecAuthClient";

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!uid) {
    return NextResponse.json({ error: "Не указан uid документа" }, { status: 400 });
  }

  const filenameParam = req.nextUrl.searchParams.get("filename");

  try {
    const { buffer, contentType, disposition } = await downloadOnecDocument(uid);
    const fallbackName = filenameParam ? sanitizeFilename(filenameParam) : sanitizeFilename(uid);
    const filename = parseFilenameFromDisposition(disposition) ?? fallbackName;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Не удалось получить документ";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
