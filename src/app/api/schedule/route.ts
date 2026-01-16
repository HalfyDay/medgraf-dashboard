import { NextResponse } from "next/server";
import { fetchOnecSchedule, type OnecScheduleClinic } from "@/server/onecAuthClient";

type ApiSlot = { id: string; start: string; end: string; durationMinutes: number };
type ApiDay = { date: string; slots: ApiSlot[] };

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function formatMinutes(minutes: number) {
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (minutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeDuration(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function buildSlots(
  date: string,
  from: string | null | undefined,
  to: string | null | undefined,
  duration: number | string | null | undefined,
  doctorId: string,
) {
  const fromMinutes = parseTimeToMinutes(from);
  const toMinutes = parseTimeToMinutes(to);
  if (fromMinutes === null || toMinutes === null) {
    return [];
  }

  const durationHours = normalizeDuration(duration) ?? 0.5;
  const durationMinutes = Math.round(durationHours * 60);
  if (durationMinutes <= 0) {
    return [];
  }

  const slots: ApiSlot[] = [];
  for (let cursor = fromMinutes; cursor + durationMinutes <= toMinutes; cursor += durationMinutes) {
    const time = formatMinutes(cursor);
    const endTime = formatMinutes(cursor + durationMinutes);
    const id = `${doctorId}-${date}-${time.replace(":", "")}`;
    slots.push({
      id,
      start: `${date}T${time}:00`,
      end: `${date}T${endTime}:00`,
      durationMinutes,
    });
  }

  return slots;
}

function mapSchedule(raw: OnecScheduleClinic[], doctorId: string): ApiDay[] {
  const normalizedDoctorId = doctorId.toString().trim();
  const daysMap = new Map<string, ApiSlot[]>();

  raw.forEach((clinic) => {
    const doctors = clinic.doctors ?? [];
    doctors.forEach((doctor) => {
      const doctorEntryId = doctor.doctor_id?.toString().trim();
      if (doctorEntryId && doctorEntryId !== normalizedDoctorId) {
        return;
      }
      const dates = doctor.dates ?? [];
      dates.forEach((dateEntry) => {
        const date = dateEntry.date?.toString().trim();
        if (!date) {
          return;
        }
        const slotList = dateEntry.slots ?? [];
        slotList.forEach((slot) => {
          const slots = buildSlots(
            date,
            slot.from,
            slot.to,
            slot.duration,
            normalizedDoctorId,
          );
          if (slots.length === 0) {
            return;
          }
          const existing = daysMap.get(date) ?? [];
          daysMap.set(date, existing.concat(slots));
        });
      });
    });
  });

  return Array.from(daysMap.entries())
    .map(([date, slots]) => ({
      date,
      slots: slots.sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const doctorId = url.searchParams.get("id") ?? url.searchParams.get("doctorId");
  if (!doctorId) {
    return NextResponse.json({ error: "Missing doctor id", schedule: [] }, { status: 400 });
  }

  try {
    const raw = await fetchOnecSchedule(doctorId);
    const schedule = mapSchedule(raw, doctorId);
    return NextResponse.json({ schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load schedule";
    return NextResponse.json({ error: message, schedule: [] }, { status: 502 });
  }
}
