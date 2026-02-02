import { NextResponse } from "next/server";
import {
  fetchOnecScheduleAppointments,
  type OnecScheduleAppointmentRecord,
  OnecLogicalError,
} from "@/server/onecAuthClient";
import type { Appointment } from "@/utils/api";

const CLINIC_NAME = "MedGraft Clinic";
const CLINIC_CITY = "Bratsk";
const CLINIC_ADDRESS = "58 Krasnoyarskaya St.";

const normalizeDateTime = (date?: string | null, time?: string | null) => {
  if (!date) {
    return null;
  }
  if (time) {
    return `${date}T${time}:00`;
  }
  const fallback = date.includes("T") ? date : `${date}T00:00:00`;
  const parsed = new Date(fallback);
  return Number.isNaN(parsed.getTime()) ? null : fallback;
};

const mapAppointment = (
  raw: OnecScheduleAppointmentRecord,
  status: Appointment["status"],
): Appointment | null => {
  const fallbackId = [
    raw.doctorID?.toString().trim(),
    raw.date?.toString().trim(),
    raw.startTime?.toString().trim(),
    raw.endTime?.toString().trim(),
    Array.isArray(raw.works) ? raw.works[0]?.nomenclatureName?.toString().trim() : null,
  ]
    .filter(Boolean)
    .join("|");
  const id = raw.webID?.toString().trim() || fallbackId || null;
  const date = normalizeDateTime(raw.date, raw.startTime);
  if (!id || !date) {
    return null;
  }

  const doctorName = raw.doctorName?.toString().trim() || "Doctor";
  const work = Array.isArray(raw.works) ? raw.works[0] : undefined;
  const serviceName = work?.nomenclatureName?.toString().trim() || "Прием";

  return {
    id,
    date,
    serviceName,
    doctorName,
    specialty: serviceName,
    clinic: { name: CLINIC_NAME, city: CLINIC_CITY, address: CLINIC_ADDRESS },
    status,
  };
};

const resolveStatus = (raw?: string | null): Appointment["status"] => {
  switch (raw) {
    case "1":
      return "planned";
    case "2":
      return "completed";
    case "3":
      return "cancelled";
    default:
      return "planned";
  }
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientID") ?? url.searchParams.get("patientId");
  const status = url.searchParams.get("status");

  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  try {
    const raw = await fetchOnecScheduleAppointments({ patientId, status });
    const mappedStatus = resolveStatus(status);
    const appointments = raw
      .map((item) => mapAppointment(item, mappedStatus))
      .filter((item): item is Appointment => Boolean(item));

    return NextResponse.json({ appointments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load appointments from 1C";
    const statusCode = error instanceof OnecLogicalError && error.code === "2" ? 200 : 502;
    return NextResponse.json({ error: message, appointments: [] }, { status: statusCode });
  }
}
