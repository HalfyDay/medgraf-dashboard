// src/utils/api.ts
import type { DoctorDirectoryEntry } from "@/types/clinic";

export const DOCTOR_AVATAR_PLACEHOLDER = "/doctor.svg";
export interface Appointment {
  id: string;
  date: string;       // ISO 8601, РЅР°РїСЂРёРјРµСЂ "2025-07-20T14:30:00+03:00"
  serviceName: string;
  doctorName: string;
  specialty: string;
  clinic: {
    name: string;
    city?: string;
    address?: string;
    room?: string;
  };
  status: "planned" | "confirmed" | "cancelled" | "completed";
  doctorAvatar?: string;
  patients?: string[];
  recommendations?: string;
  conclusion?: string;
  documentUrl?: string;
}

export async function fetchAppointments(patientId?: string): Promise<Appointment[]> {
  if (!patientId) {
    return [];
  }

  const res = await fetch(`/api/appointments?patientId=${encodeURIComponent(patientId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as
    | { appointments?: Appointment[]; error?: string }
    | null;

  if (!res.ok) {
    const message = payload?.error || "Failed to load appointments";
    throw new Error(message);
  }

  if (!payload || !Array.isArray(payload.appointments)) {
    return [];
  }

  return payload.appointments;
}

export interface Profile {
  fullName: string;
  birthDate: string;        // "YYYY-MM-DD"
  email: string;
  phone: string;
  medCard: string;
  city: string;
  notifySms: boolean;
  notifyEmail: boolean;
}

// РџРѕР»СѓС‡РёС‚СЊ РїСЂРѕС„РёР»СЊ
export async function fetchProfile(): Promise<Profile> {
  await new Promise(res => setTimeout(res, 300));
  return {
    fullName: "РРІР°РЅРѕРІ РРІР°РЅ РРІР°РЅРѕРІРёС‡",
    birthDate: "1985-04-12",
    email: "ivanov@example.com",
    phone: "+7 900 123вЂ‘45вЂ‘67",
    medCard: "1234567890",
    city: "Bratsk",
    notifySms: true,
    notifyEmail: false,
  };
}

// РћР±РЅРѕРІРёС‚СЊ РїСЂРѕС„РёР»СЊ
export async function updateProfile(data: Profile): Promise<Profile> {
  await new Promise(res => setTimeout(res, 300));
  // вЂ” Р·РґРµСЃСЊ РІ СЂРµР°Р»Рµ РѕС‚РїСЂР°РІРєР° РІ API
  return data;
}

// РЎРјРµРЅРёС‚СЊ РїР°СЂРѕР»СЊ
export async function changePassword(_oldPwd: string, _newPwd: string): Promise<void> {
  void _oldPwd;
  void _newPwd;
  await new Promise(res => setTimeout(res, 300));
  // РЅР° РїСЂРѕРґРµ РїСЂРѕРІРµСЂРєР° СЃС‚Р°СЂРѕРіРѕ Рё СЃРѕС…СЂР°РЅРµРЅРёРµ РЅРѕРІРѕРіРѕ
}

// src/utils/api.ts

export interface DocumentItem {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;      // РќР°Р·РІР°РЅРёРµ С„Р°Р№Р»Р°
  downloadUrl: string; // API-СЃСЃС‹Р»РєР° РЅР° СЃРєР°С‡РёРІР°РЅРёРµ
  patientId?: string | null;
  description?: string | null;
}

// РџРѕР»СѓС‡РµРЅРёРµ СЃРїРёСЃРєР° РґРѕРєСѓРјРµРЅС‚РѕРІ РїР°С†РёРµРЅС‚Р°
export async function fetchDocuments(patientId?: string): Promise<DocumentItem[]> {
  if (!patientId) {
    return [];
  }

  const res = await fetch(`/api/documents?patientId=${encodeURIComponent(patientId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as { documents?: DocumentItem[]; error?: string } | null;
  if (!res.ok) {
    const message = payload?.error || "Failed to load documents";
    throw new Error(message);
  }

  if (!payload || !Array.isArray(payload.documents)) {
    return [];
  }

  return payload.documents;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  pricePeriod: string;
  durationMinutes: number;
  isAvailable: boolean;
  photoUrl: string;
}

export interface DoctorScheduleSlot {
  id: string;
  start: string; // ISO 8601 datetime
  end?: string;
  durationMinutes?: number;
}

export interface DoctorScheduleDay {
  date: string; // YYYY-MM-DD
  slots: DoctorScheduleSlot[];
}

export interface BookAppointmentPayload {
  doctorId: string;
  slotId: string;
  patientId?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  serviceId?: string | null;
  doctorName?: string | null;
  specialty?: string | null;
}

const APPOINTMENT_CLINIC = {
  name: "MedGraft Clinic",
  city: "Bratsk",
  address: "58 Krasnoyarskaya St.",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DOCTOR_FALLBACK_SPECIALTY = "Р’СЂР°С‡ РєР»РёРЅРёРєРё";
const mapDirectoryDoctor = (entry: DoctorDirectoryEntry): Doctor => {
  const specialties = entry.specialties?.length ? entry.specialties : [DOCTOR_FALLBACK_SPECIALTY];
  const primarySpecialty = specialties[0] ?? DOCTOR_FALLBACK_SPECIALTY;

  return {
    id: entry.id,
    fullName: entry.fullName || entry.id,
    specialty: primarySpecialty,
    category: primarySpecialty,
    rating: 4.9,
    reviews: 0,
    price: 0,
    pricePeriod: "30 мин",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl:
      entry.photoUrl && entry.photoUrl.length > 0 ? entry.photoUrl : DOCTOR_AVATAR_PLACEHOLDER,
  };
};

export async function fetchDoctors(): Promise<Doctor[]> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    if (controller) {
      timeout = setTimeout(() => controller.abort(), 8000);
    }
    const res = await fetch("/api/doctors", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller?.signal,
    });
    if (!res.ok) {
      throw new Error(`Doctors API responded with ${res.status}`);
    }
    const payload = (await res.json()) as { data?: DoctorDirectoryEntry[] };
    if (!payload?.data || !Array.isArray(payload.data) || payload.data.length === 0) {
      throw new Error("Doctors API returned empty payload");
    }
    return payload.data.map(mapDirectoryDoctor);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function fetchDoctorSchedule(doctorId: string): Promise<DoctorScheduleDay[]> {
  if (!doctorId) {
    return [];
  }
  const res = await fetch(`/api/schedule?doctorId=${encodeURIComponent(doctorId)}`, {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => null)) as
    | { schedule?: DoctorScheduleDay[]; error?: string }
    | null;
  if (!res.ok) {
    const message = payload?.error || "Failed to load schedule";
    throw new Error(message);
  }
  if (!payload || !Array.isArray(payload.schedule)) {
    return [];
  }
  return payload.schedule;
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  await delay(500);

  let slotStart = payload.slotStart || null;
  let slotEnd = payload.slotEnd || null;
  if (!slotStart) {
    const match = payload.slotId.match(/(\d{4}-\d{2}-\d{2})-(\d{4})$/);
    if (match) {
      const hhmm = match[2];
      slotStart = `${match[1]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00`;
    } else {
      throw new Error("Slot not found");
    }
  }
  if (!slotEnd && slotStart) {
    const date = new Date(slotStart);
    if (!Number.isNaN(date.getTime())) {
      date.setMinutes(date.getMinutes() + 30);
      const yyyy = date.getFullYear().toString().padStart(4, "0");
      const mm = (date.getMonth() + 1).toString().padStart(2, "0");
      const dd = date.getDate().toString().padStart(2, "0");
      const hh = date.getHours().toString().padStart(2, "0");
      const min = date.getMinutes().toString().padStart(2, "0");
      slotEnd = `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
    }
  }

  if (payload.patientId && slotStart) {
    const startDate = slotStart.replace("T", " ").slice(0, 16);
    const endDate = slotEnd
      ? slotEnd.replace("T", " ").slice(0, 16)
      : startDate;
    const res = await fetch("/api/schedule/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: payload.doctorId,
        patientId: payload.patientId,
        serviceId: payload.serviceId ?? undefined,
        startDate,
        endDate,
      }),
    });
    const response = (await res.json().catch(() => null)) as { requestId?: string; error?: string } | null;
    if (!res.ok) {
      throw new Error(response?.error || "Failed to book appointment");
    }
  }

  const resolvedDoctorName = payload.doctorName || payload.doctorId;
  const resolvedSpecialty = payload.specialty || "General";

  const appointment: Appointment = {
    id: `new-${Date.now()}`,
    date: slotStart,
    serviceName: `Service: ${resolvedSpecialty}`,
    doctorName: resolvedDoctorName,
    specialty: resolvedSpecialty,
    clinic: { ...APPOINTMENT_CLINIC },
    status: "planned",
    doctorAvatar: DOCTOR_AVATAR_PLACEHOLDER,
  };

  return appointment;
}





