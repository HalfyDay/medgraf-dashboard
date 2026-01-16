import { NextResponse } from "next/server";
import { fetchOnecPatientDetails, OnecLogicalError } from "@/server/onecAuthClient";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("id") ?? url.searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "Не указан id пациента" }, { status: 400 });
  }

  try {
    const patient = await fetchOnecPatientDetails(patientId);
    return NextResponse.json({ patient });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось получить данные медкарты";
    const status = error instanceof OnecLogicalError && error.code === "2" ? 200 : 502;
    return NextResponse.json({ error: message, patient: null }, { status });
  }
}
