import { NextResponse } from "next/server";
import { cancelOnecScheduleAppointment, OnecLogicalError, OnecRequestError } from "@/server/onecAuthClient";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid")?.trim();

  if (!uid) {
    return buildError("Missing uid", 400);
  }

  try {
    const result = await cancelOnecScheduleAppointment(uid);
    return NextResponse.json({ result });
  } catch (error) {
    let message = "Failed to cancel appointment";
    if (error instanceof OnecRequestError) {
      message = `Ошибка 1С: ${error.status} ${error.body || error.message}`;
    } else if (error instanceof OnecLogicalError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    console.error("[api/schedule/cancel_appointment] failed", error);
    return buildError(message, 502);
  }
}
