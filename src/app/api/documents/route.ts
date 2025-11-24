import { NextResponse } from "next/server";
import { fetchOnecDocuments, OnecLogicalError } from "@/server/onecAuthClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("id") ?? url.searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "Не указан id пациента" }, { status: 400 });
  }

  try {
    const rawDocs = await fetchOnecDocuments(patientId);
    const documents = rawDocs
      .filter((item) => item.id)
      .map((item) => {
        const safeId = String(item.id);
        const safeTitle = item.title?.trim() || safeId;
        const encodedTitle = encodeURIComponent(safeTitle);
        return {
          id: safeId,
          patientId: item.patient_id ?? null,
          title: safeTitle,
          date: item.date ?? "",
          downloadUrl: `/api/documents/${encodeURIComponent(safeId)}?filename=${encodedTitle}`,
        };
      });

    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось получить список документов";
    const status = error instanceof OnecLogicalError && error.code === "2" ? 200 : 502;
    return NextResponse.json({ error: message, documents: [] }, { status });
  }
}
