// src/utils/api.ts
import type { DoctorDirectoryEntry, ServiceDirectoryEntry } from "@/types/clinic";
import type { CheckupData } from "@/types/checkups";

export const DOCTOR_AVATAR_PLACEHOLDER = "/doctor.svg";
export interface Appointment {
  id: string;
  date: string;       // ISO 8601, например "2025-07-20T14:30:00+03:00"
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

const DOCTORS_CACHE_KEY = "medgraf.doctors.v1";
const DOCTORS_DIRECTORY_CACHE_KEY = "medgraf.doctors.directory.v1";
const SERVICES_CACHE_KEY = "medgraf.services.v1";
let doctorsCachePromise: Promise<Doctor[]> | null = null;
let doctorsDirectoryCachePromise: Promise<DoctorDirectoryEntry[]> | null = null;
let servicesCachePromise: Promise<ServiceDirectoryEntry[]> | null = null;

const readSessionCache = <T,>(key: string): T | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const writeSessionCache = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

export async function fetchScheduleAppointments(params: {
  patientId: string;
  status: "1" | "2";
}): Promise<Appointment[]> {
  const { patientId, status } = params;
  const res = await fetch(
    `/api/schedule/appointments?patientID=${encodeURIComponent(patientId)}&status=${encodeURIComponent(status)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

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

export async function cancelScheduleAppointment(uid: string): Promise<string> {
  const safeUid = uid?.toString().trim();
  if (!safeUid) {
    throw new Error("Missing appointment uid");
  }
  const res = await fetch(
    `/api/schedule/cancel_appointment?uid=${encodeURIComponent(safeUid)}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
  const payload = (await res.json().catch(() => null)) as { result?: string; error?: string } | null;
  if (!res.ok) {
    const message = payload?.error || "Failed to cancel appointment";
    throw new Error(message);
  }
  return payload?.result ?? "Success";
}

// src/utils/api.ts

export interface DocumentItem {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;      // Название файла
  downloadUrl: string; // API-ссылка на скачивание
  patientId?: string | null;
  description?: string | null;
}

// Получение списка документов пациента
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


export interface ContractItem {
  uid: string;
  date: string;
  title: string;
  downloadUrl: string;
}

export async function fetchContracts(patientId?: string): Promise<ContractItem[]> {
  if (!patientId) {
    return [];
  }

  const res = await fetch(`/api/contracts?patientId=${encodeURIComponent(patientId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as { contracts?: ContractItem[]; error?: string } | null;
  if (!res.ok) {
    const message = payload?.error || "Failed to load contracts";
    throw new Error(message);
  }

  if (!payload || !Array.isArray(payload.contracts)) {
    return [];
  }

  return payload.contracts;
}type CheckupApiRecord = {
  id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  name?: string | null;
  price?: number | string | null;
  currency?: string | null;
  description?: string | null;
  brief?: string | null;
  oldprice?: number | string | null;
  icon?: string | null;
  img?: string | null;
};

const CHECKUP_GRADIENTS = [
  "from-pink-400 to-fuchsia-500",
  "from-violet-400 to-purple-500",
  "from-lime-400 to-emerald-500",
  "from-cyan-500 to-sky-600",
  "from-amber-400 to-orange-500",
  "from-slate-500 to-slate-700",
  "from-teal-400 to-teal-600",
  "from-lime-500 to-green-600",
  "from-sky-400 to-blue-500",
  "from-rose-400 to-pink-500",
];

const normalizeCheckupLineBreaks = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\/n/g, "\n");

const splitCheckupDescription = (description?: string | null) => {
  if (!description) return { intro: undefined, bullets: [] as string[] };
  const normalized = normalizeCheckupLineBreaks(description).trim();
  if (!normalized) return { intro: undefined, bullets: [] as string[] };
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const markerRegex = /(комплекс включает|комплекс включает в себя|состав комплекса)/i;
  const markerIndex = lines.findIndex((line) => markerRegex.test(line));
  if (markerIndex === -1) {
    return { intro: normalized, bullets: [] as string[] };
  }
  const introLines = lines.slice(0, markerIndex);
  const markerLine = lines[markerIndex] ?? "";
  const markerRemainder = markerLine.split(/:|—|-|–/).slice(1).join(" ").trim();
  const remainderBullets = markerRemainder ? [markerRemainder] : [];
  const bullets = [...remainderBullets, ...lines.slice(markerIndex + 1)];
  return {
    intro: introLines.length ? introLines.join("\n") : undefined,
    bullets,
  };
};

export async function fetchCheckups(): Promise<CheckupData[]> {
  const res = await fetch("/api/services/checkup", {
    method: "GET",
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => null)) as
    | { checkups?: CheckupApiRecord[]; error?: string }
    | null;
  if (!res.ok) {
    const message = payload?.error || "Failed to load checkups";
    throw new Error(message);
  }
  const list = Array.isArray(payload?.checkups) ? payload.checkups : [];
  const mapped: CheckupData[] = [];
  list.forEach((item, index) => {
    const id = item?.id?.toString().trim();
    const title = item?.name?.toString().trim();
    if (!id || !title) return;
    const { intro, bullets } = splitCheckupDescription(item?.description?.toString());
    mapped.push({
      id,
      title,
      sub: item?.brief?.toString().trim() || undefined,
      description: intro,
      bullets,
      price: item?.price ?? undefined,
      oldPrice: item?.oldprice ?? undefined,
      currency: item?.currency ?? undefined,
      icon: item?.icon?.toString().trim() || undefined,
      image: item?.img?.toString().trim() || "/clinic.svg",
      bg: CHECKUP_GRADIENTS[index % CHECKUP_GRADIENTS.length],
      ctaText: "Оставить заявку",
      ctaHref: "/booking",
    });
  });
  return mapped;
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
  services: DoctorService[];
}

export interface DoctorService {
  id: string;
  name: string;
  durationMinutes?: number | null;
  price?: number | null;
  currency?: string | null;
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
  serviceName?: string | null;
  doctorAvatar?: string | null;
  doctorName?: string | null;
  specialty?: string | null;
}

const APPOINTMENT_CLINIC = {
  name: "MedGraft Clinic",
  city: "Bratsk",
  address: "58 Krasnoyarskaya St.",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DOCTOR_FALLBACK_SPECIALTY = "Врач клиники";
const mapDirectoryDoctor = (entry: DoctorDirectoryEntry): Doctor => {
  const specialties = entry.specialties?.length ? entry.specialties : [DOCTOR_FALLBACK_SPECIALTY];
  const primarySpecialty = specialties[0] ?? DOCTOR_FALLBACK_SPECIALTY;
  const services =
    entry.services?.map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes ?? null,
      price: service.price ?? null,
      currency: service.currency ?? null,
    })) ?? [];
  const pricedServices = services
    .filter((service) => typeof service.price === "number")
    .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  const minService = pricedServices[0] ?? services[0];
  const durationLabel =
    typeof minService?.durationMinutes === "number" && minService.durationMinutes > 0
      ? `от ${minService.durationMinutes} мин`
      : "длительность";

  return {
    id: entry.id,
    fullName: entry.fullName || entry.id,
    specialty: primarySpecialty,
    category: primarySpecialty,
    rating: 4.9,
    reviews: 0,
    price: typeof minService?.price === "number" ? minService.price : 0,
    pricePeriod: durationLabel,
    durationMinutes: typeof minService?.durationMinutes === "number" ? minService.durationMinutes : 0,
    isAvailable: true,
    photoUrl:
      entry.photoUrl && entry.photoUrl.length > 0 ? entry.photoUrl : DOCTOR_AVATAR_PLACEHOLDER,
    services,
  };
};

export async function fetchDoctors(): Promise<Doctor[]> {
  const cached = readSessionCache<Doctor[]>(DOCTORS_CACHE_KEY);
  if (cached) {
    return cached;
  }
  if (doctorsCachePromise) {
    return doctorsCachePromise;
  }

  doctorsCachePromise = (async () => {
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
    const mapped = payload.data.map(mapDirectoryDoctor);
    writeSessionCache(DOCTORS_CACHE_KEY, mapped);
    return mapped;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
  })();

  try {
    return await doctorsCachePromise;
  } finally {
    doctorsCachePromise = null;
  }
}

export async function fetchDoctorsDirectory(): Promise<DoctorDirectoryEntry[]> {
  const cached = readSessionCache<DoctorDirectoryEntry[]>(DOCTORS_DIRECTORY_CACHE_KEY);
  if (cached) {
    return cached;
  }
  if (doctorsDirectoryCachePromise) {
    return doctorsDirectoryCachePromise;
  }

  doctorsDirectoryCachePromise = (async () => {
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
      const list = Array.isArray(payload?.data) ? payload.data : [];
      writeSessionCache(DOCTORS_DIRECTORY_CACHE_KEY, list);
      return list;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  })();

  try {
    return await doctorsDirectoryCachePromise;
  } finally {
    doctorsDirectoryCachePromise = null;
  }
}

export async function fetchServices(): Promise<ServiceDirectoryEntry[]> {
  const cached = readSessionCache<ServiceDirectoryEntry[]>(SERVICES_CACHE_KEY);
  if (cached) {
    return cached;
  }
  if (servicesCachePromise) {
    return servicesCachePromise;
  }

  servicesCachePromise = (async () => {
    const res = await fetch("/api/services", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Services API responded with ${res.status}`);
    }
    const payload = (await res.json()) as { data?: ServiceDirectoryEntry[] };
    if (!payload?.data || !Array.isArray(payload.data)) {
      return [];
    }
    writeSessionCache(SERVICES_CACHE_KEY, payload.data);
    return payload.data;
  })();

  try {
    return await servicesCachePromise;
  } finally {
    servicesCachePromise = null;
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

  const safePatientId = payload.patientId?.toString().trim();
  if (!safePatientId) {
    throw new Error("Missing patient id");
  }

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

  let requestId: string | null = null;

  if (slotStart) {
    const startDate = slotStart.replace("T", " ").slice(0, 16);
    const endDate = slotEnd
      ? slotEnd.replace("T", " ").slice(0, 16)
      : startDate;
    const res = await fetch("/api/schedule/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: payload.doctorId,
        patientId: safePatientId,
        serviceId: payload.serviceId ?? undefined,
        startDate,
        endDate,
      }),
    });
    const response = (await res.json().catch(() => null)) as { requestId?: string; error?: string } | null;
    if (!res.ok) {
      throw new Error(response?.error || "Failed to book appointment");
    }
    requestId = response?.requestId?.toString().trim() || null;
  }

  const resolvedDoctorName = payload.doctorName || payload.doctorId;
  const resolvedSpecialty = payload.specialty || "General";
  const resolvedServiceName = payload.serviceName || `Service: ${resolvedSpecialty}`;

  const appointment: Appointment = {
    id: requestId || `new-${Date.now()}`,
    date: slotStart,
    serviceName: resolvedServiceName,
    doctorName: resolvedDoctorName,
    specialty: resolvedSpecialty,
    clinic: { ...APPOINTMENT_CLINIC },
    status: "planned",
    doctorAvatar: payload.doctorAvatar || DOCTOR_AVATAR_PLACEHOLDER,
  };

  return appointment;
}





