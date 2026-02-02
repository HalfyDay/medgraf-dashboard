import { NextResponse } from "next/server";
import { fetchOnecAppointments, type OnecAppointmentRecord, OnecLogicalError } from "@/server/onecAuthClient";
import type { Appointment } from "@/utils/api";

const CLINIC_NAME = "MedGraft Clinic";
const CLINIC_CITY = "Bratsk";
const CLINIC_ADDRESS = "58 Krasnoyarskaya St.";
const TITLE_FALLBACK = "Appointment";

const normalizeSpecialties = (value: OnecAppointmentRecord["specialties"]) => {
  if (!value) {
    return [] as string[];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : String(entry ?? "")))
      .filter((entry) => entry.length > 0);
  }
  return value
    .toString()
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

function normalizeDate(raw?: string | null) {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    const [, y, m, d, h, min] = match;
    return `${y}-${m}-${d}T${h}:${min}:00`;
  }

  const fallback = raw.replace(" ", "T");
  const date = new Date(fallback);
  return Number.isNaN(date.getTime()) ? null : fallback;
}

function mapAppointment(raw: OnecAppointmentRecord): Appointment | null {
  const id = raw.id?.toString().trim();
  if (!id) {
    return null;
  }

  const date = normalizeDate(raw.date);
  if (!date) {
    return null;
  }

  const specialties = normalizeSpecialties(raw.specialties);
  const primarySpecialty = specialties[0] ?? "";
  const doctorName = raw.doctor?.toString().trim() || "Doctor";
  const serviceName = primarySpecialty || `${TITLE_FALLBACK} ${doctorName ? `(${doctorName})` : ""}`.trim();
  const doctorAvatar =
    typeof raw.image === "string" && raw.image.trim().length > 0 ? raw.image.trim() : undefined;
  const downloadUrl = `/api/documents/${encodeURIComponent(id)}?type=appointment`;

  return {
    id,
    date,
    serviceName: serviceName || TITLE_FALLBACK,
    doctorName,
    specialty: primarySpecialty || doctorName,
    clinic: { name: CLINIC_NAME, city: CLINIC_CITY, address: CLINIC_ADDRESS },
    status: "completed",
    doctorAvatar,
    documentUrl: downloadUrl,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("id") ?? url.searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "Missing patient id" }, { status: 400 });
  }

  try {
    const raw = await fetchOnecAppointments(patientId);
    const appointments = raw
      .map((item) => mapAppointment(item))
      .filter((item): item is Appointment => Boolean(item));

    return NextResponse.json({ appointments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load appointments from 1C";
    const status = error instanceof OnecLogicalError && error.code === "2" ? 200 : 502;
    return NextResponse.json({ error: message, appointments: [] }, { status });
  }
}
