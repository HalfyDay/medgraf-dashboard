import { NextRequest, NextResponse } from "next/server";
import { downloadOnecContract, OnecLogicalError } from "@/server/onecAuthClient";
import { getAuthFromRequest } from "@/server/authCookie";

function sanitizeFilename(name: string) {
  return name.replace(/["\\\r\n]/g, "").trim() || "contract";
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
  const asciiFallback = sanitized.replace(/[^\x20-\x7E]/g, "_") || "contract";
  const encodedUtf8 = encodeURIComponent(sanitized);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUtf8}`;
}

function hasFileExtension(filename: string) {
  return /\.[a-z0-9]{1,8}$/i.test(filename);
}

function extensionFromContentType(contentType?: string | null) {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  if (!type) return null;
  if (type === "application/pdf") return ".pdf";
  if (type === "application/msword") return ".doc";
  if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  if (type === "application/rtf") return ".rtf";
  if (type === "text/plain") return ".txt";
  if (type === "image/jpeg") return ".jpg";
  if (type === "image/png") return ".png";
  return null;
}

function extensionFromBuffer(buffer: Buffer) {
  if (buffer.length >= 4 && buffer.slice(0, 4).toString("ascii") === "%PDF") return ".pdf";
  if (buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b) return ".docx";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return ".png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  return null;
}

function ensureFilenameExtension(filename: string, contentType: string | null | undefined, buffer: Buffer) {
  if (hasFileExtension(filename)) {
    return filename;
  }
  const ext = extensionFromContentType(contentType) ?? extensionFromBuffer(buffer);
  return ext ? `${filename}${ext}` : filename;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestedPatientId = req.nextUrl.searchParams.get("patientId")?.trim() || undefined;
  if (!requestedPatientId) {
    return NextResponse.json({ error: "Не указан id пациента" }, { status: 400 });
  }
  if (!auth.onecId || auth.onecId !== requestedPatientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { uid } = await params;
  const safeUid = uid?.toString().trim();
  if (!safeUid) {
    return NextResponse.json({ error: "UID is required" }, { status: 400 });
  }

  const filenameParam = req.nextUrl.searchParams.get("filename");

  try {
    const { buffer, contentType, disposition } = await downloadOnecContract(safeUid);
    const fallbackName = filenameParam ? sanitizeFilename(filenameParam) : safeUid;
    const upstreamName = parseFilenameFromDisposition(disposition);
    const filename = ensureFilenameExtension(upstreamName ?? fallbackName, contentType, buffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": buildContentDisposition(filename),
      },
    });
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Failed to download contract";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
