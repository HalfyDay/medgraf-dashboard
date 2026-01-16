import { NextResponse } from "next/server";
import { submitOnecScheduleRequest, OnecLogicalError, OnecRequestError } from "@/server/onecAuthClient";

type RequestBody = {
  doctorId?: string;
  patientId?: string;
  serviceId?: string;
  startDate?: string;
  endDate?: string;
};

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const doctorId = body.doctorId?.trim();
  const patientId = body.patientId?.trim();
  const startDate = body.startDate?.trim();
  const endDate = body.endDate?.trim();
  const serviceId = body.serviceId?.trim();

  if (!doctorId || !patientId || !startDate || !endDate) {
    return buildError("Missing booking parameters", 400);
  }

  try {
    const requestId = await submitOnecScheduleRequest({
      doctorID: doctorId,
      patientID: patientId,
      startDate,
      endDate,
      serviceID: serviceId || undefined,
    });
    return NextResponse.json({ requestId });
  } catch (error) {
    let message = "Failed to book appointment";
    if (error instanceof OnecRequestError) {
      message = `Ошибка 1С: ${error.status} ${error.body || error.message}`;
    } else if (error instanceof OnecLogicalError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    console.error("[api/schedule/request] failed", error);
    return buildError(message, 502);
  }
}
