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
  status: "planned" | "cancelled" | "completed";
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
}

export interface DoctorScheduleDay {
  date: string; // YYYY-MM-DD
  slots: DoctorScheduleSlot[];
}

export interface BookAppointmentPayload {
  doctorId: string;
  slotId: string;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc-neuro-1",
    fullName: "Р—С‹СЂСЊСЏРЅРѕРІР° РћР»СЊРіР° РЎРµСЂРіРµРµРІРЅР°",
    specialty: "РќРµРІСЂРѕР»РѕРі",
    category: "РќРµРІСЂРѕР»РѕРі",
    rating: 4.8,
    reviews: 125,
    price: 2400,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-neuro-2",
    fullName: "РљСѓР·СЊРјРёРЅР° РСЂРёРЅР° РџР°РІР»РѕРІРЅР°",
    specialty: "РќРµРІСЂРѕР»РѕРі",
    category: "РќРµРІСЂРѕР»РѕРі",
    rating: 4.7,
    reviews: 88,
    price: 2600,
    pricePeriod: "45 РјРёРЅСѓС‚",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-neuro-3",
    fullName: "РЎРѕСЂРѕРєРёРЅ Р”РјРёС‚СЂРёР№ РћР»РµРіРѕРІРёС‡",
    specialty: "РќРµРІСЂРѕР»РѕРі",
    category: "РќРµРІСЂРѕР»РѕРі",
    rating: 4.6,
    reviews: 74,
    price: 2100,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-thera-1",
    fullName: "Р›РµРѕРЅРѕРІР° РњР°СЂРёСЏ РџР°РІР»РѕРІРЅР°",
    specialty: "РўРµСЂР°РїРµРІС‚",
    category: "РўРµСЂР°РїРµРІС‚",
    rating: 4.7,
    reviews: 98,
    price: 2200,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-thera-2",
    fullName: "РќРёРєРёС‚РёРЅР° РЎРѕС„СЊСЏ Р’РёРєС‚РѕСЂРѕРІРЅР°",
    specialty: "РўРµСЂР°РїРµРІС‚",
    category: "РўРµСЂР°РїРµРІС‚",
    rating: 4.5,
    reviews: 65,
    price: 2100,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-thera-3",
    fullName: "Р“Р°РІСЂРёР»РѕРІ РђР»РµРєСЃРµР№ РЎРµСЂРіРµРµРІРёС‡",
    specialty: "РўРµСЂР°РїРµРІС‚",
    category: "РўРµСЂР°РїРµРІС‚",
    rating: 4.8,
    reviews: 142,
    price: 2400,
    pricePeriod: "45 РјРёРЅСѓС‚",
    durationMinutes: 45,
    isAvailable: false,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-ophtha-1",
    fullName: "РџРµС‚СЂРѕРІ РђРЅРґСЂРµР№ РЎРµСЂРіРµРµРІРёС‡",
    specialty: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    category: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    rating: 4.9,
    reviews: 156,
    price: 2400,
    pricePeriod: "С‡Р°СЃ",
    durationMinutes: 60,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-ophtha-2",
    fullName: "РЎР°РІРµР»СЊРµРІР° РљСЃРµРЅРёСЏ Р®СЂСЊРµРІРЅР°",
    specialty: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    category: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    rating: 4.7,
    reviews: 93,
    price: 2500,
    pricePeriod: "45 РјРёРЅСѓС‚",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-ophtha-3",
    fullName: "Р“РѕСЂСЋРЅРѕРІ РњР°РєСЃРёРј Р’Р°РґРёРјРѕРІРёС‡",
    specialty: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    category: "РћС„С‚Р°Р»СЊРјРѕР»РѕРі",
    rating: 4.5,
    reviews: 61,
    price: 2300,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-gyno-1",
    fullName: "РљР°Р»РёРЅРёРЅР° РЎРІРµС‚Р»Р°РЅР° РРіРѕСЂРµРІРЅР°",
    specialty: "Р“РёРЅРµРєРѕР»РѕРі",
    category: "Р“РёРЅРµРєРѕР»РѕРі",
    rating: 4.6,
    reviews: 87,
    price: 2600,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: false,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-gyno-2",
    fullName: "Р©РµСЂР±Р°РєРѕРІР° РђРЅР°СЃС‚Р°СЃРёСЏ РЎРµСЂРіРµРµРІРЅР°",
    specialty: "Р“РёРЅРµРєРѕР»РѕРі",
    category: "Р“РёРЅРµРєРѕР»РѕРі",
    rating: 4.8,
    reviews: 112,
    price: 2800,
    pricePeriod: "45 РјРёРЅСѓС‚",
    durationMinutes: 45,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
  {
    id: "doc-gyno-3",
    fullName: "Р“СЂРѕРјРѕРІ РђСЂС‚С‘Рј РќРёРєРѕР»Р°РµРІРёС‡",
    specialty: "Р“РёРЅРµРєРѕР»РѕРі",
    category: "Р“РёРЅРµРєРѕР»РѕРі",
    rating: 4.4,
    reviews: 53,
    price: 2400,
    pricePeriod: "30 РјРёРЅСѓС‚",
    durationMinutes: 30,
    isAvailable: true,
    photoUrl: DOCTOR_AVATAR_PLACEHOLDER,
  },
];

const MOCK_DOCTOR_SCHEDULE: Record<string, DoctorScheduleDay[]> = {
  "doc-neuro-1": [
    {
      date: "2025-10-15",
      slots: [
        { id: "doc-neuro-1-2025-10-15-1030", start: "2025-10-15T10:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1230", start: "2025-10-15T12:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1430", start: "2025-10-15T14:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-15-1730", start: "2025-10-15T17:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-16",
      slots: [
        { id: "doc-neuro-1-2025-10-16-1030", start: "2025-10-16T10:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1130", start: "2025-10-16T11:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1630", start: "2025-10-16T16:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-16-1830", start: "2025-10-16T18:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-neuro-1-2025-10-18-0930", start: "2025-10-18T09:30:00+03:00" },
        { id: "doc-neuro-1-2025-10-18-1130", start: "2025-10-18T11:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-24",
      slots: [
        { id: "doc-neuro-1-2025-10-24-1000", start: "2025-10-24T10:00:00+03:00" },
        { id: "doc-neuro-1-2025-10-24-1200", start: "2025-10-24T12:00:00+03:00" },
        { id: "doc-neuro-1-2025-10-24-1500", start: "2025-10-24T15:00:00+03:00" },
      ],
    },
  ],
  "doc-neuro-2": [
    {
      date: "2025-10-20",
      slots: [
        { id: "doc-neuro-2-2025-10-20-1000", start: "2025-10-20T10:00:00+03:00" },
        { id: "doc-neuro-2-2025-10-20-1200", start: "2025-10-20T12:00:00+03:00" },
        { id: "doc-neuro-2-2025-10-20-1500", start: "2025-10-20T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-02",
      slots: [
        { id: "doc-neuro-2-2025-11-02-1030", start: "2025-11-02T10:30:00+03:00" },
        { id: "doc-neuro-2-2025-11-02-1300", start: "2025-11-02T13:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-14",
      slots: [
        { id: "doc-neuro-2-2025-11-14-0930", start: "2025-11-14T09:30:00+03:00" },
        { id: "doc-neuro-2-2025-11-14-1130", start: "2025-11-14T11:30:00+03:00" },
        { id: "doc-neuro-2-2025-11-14-1600", start: "2025-11-14T16:00:00+03:00" },
      ],
    },
  ],
  "doc-neuro-3": [
    {
      date: "2025-10-22",
      slots: [
        { id: "doc-neuro-3-2025-10-22-0900", start: "2025-10-22T09:00:00+03:00" },
        { id: "doc-neuro-3-2025-10-22-1100", start: "2025-10-22T11:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-10",
      slots: [
        { id: "doc-neuro-3-2025-11-10-1400", start: "2025-11-10T14:00:00+03:00" },
        { id: "doc-neuro-3-2025-11-10-1600", start: "2025-11-10T16:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-21",
      slots: [
        { id: "doc-neuro-3-2025-11-21-1030", start: "2025-11-21T10:30:00+03:00" },
        { id: "doc-neuro-3-2025-11-21-1230", start: "2025-11-21T12:30:00+03:00" },
      ],
    },
  ],
  "doc-thera-1": [
    {
      date: "2025-10-12",
      slots: [
        { id: "doc-thera-1-2025-10-12-0930", start: "2025-10-12T09:30:00+03:00" },
        { id: "doc-thera-1-2025-10-12-1130", start: "2025-10-12T11:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-19",
      slots: [
        { id: "doc-thera-1-2025-10-19-1030", start: "2025-10-19T10:30:00+03:00" },
        { id: "doc-thera-1-2025-10-19-1330", start: "2025-10-19T13:30:00+03:00" },
        { id: "doc-thera-1-2025-10-19-1530", start: "2025-10-19T15:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-26",
      slots: [
        { id: "doc-thera-1-2025-10-26-0930", start: "2025-10-26T09:30:00+03:00" },
        { id: "doc-thera-1-2025-10-26-1230", start: "2025-10-26T12:30:00+03:00" },
      ],
    },
  ],
  "doc-thera-2": [
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-thera-2-2025-10-18-1000", start: "2025-10-18T10:00:00+03:00" },
        { id: "doc-thera-2-2025-10-18-1200", start: "2025-10-18T12:00:00+03:00" },
      ],
    },
    {
      date: "2025-10-25",
      slots: [
        { id: "doc-thera-2-2025-10-25-0900", start: "2025-10-25T09:00:00+03:00" },
        { id: "doc-thera-2-2025-10-25-1100", start: "2025-10-25T11:00:00+03:00" },
        { id: "doc-thera-2-2025-10-25-1400", start: "2025-10-25T14:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-05",
      slots: [
        { id: "doc-thera-2-2025-11-05-0930", start: "2025-11-05T09:30:00+03:00" },
        { id: "doc-thera-2-2025-11-05-1200", start: "2025-11-05T12:00:00+03:00" },
      ],
    },
  ],
  "doc-thera-3": [
    {
      date: "2025-11-01",
      slots: [
        { id: "doc-thera-3-2025-11-01-0930", start: "2025-11-01T09:30:00+03:00" },
        { id: "doc-thera-3-2025-11-01-1230", start: "2025-11-01T12:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-08",
      slots: [
        { id: "doc-thera-3-2025-11-08-1000", start: "2025-11-08T10:00:00+03:00" },
        { id: "doc-thera-3-2025-11-08-1200", start: "2025-11-08T12:00:00+03:00" },
        { id: "doc-thera-3-2025-11-08-1500", start: "2025-11-08T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-19",
      slots: [
        { id: "doc-thera-3-2025-11-19-0930", start: "2025-11-19T09:30:00+03:00" },
        { id: "doc-thera-3-2025-11-19-1230", start: "2025-11-19T12:30:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-1": [
    {
      date: "2025-10-15",
      slots: [
        { id: "doc-ophtha-1-2025-10-15-1030", start: "2025-10-15T10:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-15-1430", start: "2025-10-15T14:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-15-1730", start: "2025-10-15T17:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-25",
      slots: [
        { id: "doc-ophtha-1-2025-10-25-1030", start: "2025-10-25T10:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-25-1130", start: "2025-10-25T11:30:00+03:00" },
        { id: "doc-ophtha-1-2025-10-25-1230", start: "2025-10-25T12:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-07",
      slots: [
        { id: "doc-ophtha-1-2025-11-07-1000", start: "2025-11-07T10:00:00+03:00" },
        { id: "doc-ophtha-1-2025-11-07-1230", start: "2025-11-07T12:30:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-2": [
    {
      date: "2025-10-18",
      slots: [
        { id: "doc-ophtha-2-2025-10-18-0900", start: "2025-10-18T09:00:00+03:00" },
        { id: "doc-ophtha-2-2025-10-18-1100", start: "2025-10-18T11:00:00+03:00" },
        { id: "doc-ophtha-2-2025-10-18-1500", start: "2025-10-18T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-05",
      slots: [
        { id: "doc-ophtha-2-2025-11-05-1030", start: "2025-11-05T10:30:00+03:00" },
        { id: "doc-ophtha-2-2025-11-05-1300", start: "2025-11-05T13:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-18",
      slots: [
        { id: "doc-ophtha-2-2025-11-18-0900", start: "2025-11-18T09:00:00+03:00" },
        { id: "doc-ophtha-2-2025-11-18-1100", start: "2025-11-18T11:00:00+03:00" },
        { id: "doc-ophtha-2-2025-11-18-1500", start: "2025-11-18T15:00:00+03:00" },
      ],
    },
  ],
  "doc-ophtha-3": [
    {
      date: "2025-11-12",
      slots: [
        { id: "doc-ophtha-3-2025-11-12-0930", start: "2025-11-12T09:30:00+03:00" },
        { id: "doc-ophtha-3-2025-11-12-1130", start: "2025-11-12T11:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-20",
      slots: [
        { id: "doc-ophtha-3-2025-11-20-1400", start: "2025-11-20T14:00:00+03:00" },
        { id: "doc-ophtha-3-2025-11-20-1630", start: "2025-11-20T16:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-28",
      slots: [
        { id: "doc-ophtha-3-2025-11-28-1000", start: "2025-11-28T10:00:00+03:00" },
        { id: "doc-ophtha-3-2025-11-28-1230", start: "2025-11-28T12:30:00+03:00" },
      ],
    },
  ],
  "doc-gyno-1": [
    {
      date: "2025-10-20",
      slots: [
        { id: "doc-gyno-1-2025-10-20-1030", start: "2025-10-20T10:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-20-1230", start: "2025-10-20T12:30:00+03:00" },
      ],
    },
    {
      date: "2025-10-27",
      slots: [
        { id: "doc-gyno-1-2025-10-27-1330", start: "2025-10-27T13:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-27-1530", start: "2025-10-27T15:30:00+03:00" },
        { id: "doc-gyno-1-2025-10-27-1730", start: "2025-10-27T17:30:00+03:00" },
      ],
    },
    {
      date: "2025-11-06",
      slots: [
        { id: "doc-gyno-1-2025-11-06-1000", start: "2025-11-06T10:00:00+03:00" },
        { id: "doc-gyno-1-2025-11-06-1230", start: "2025-11-06T12:30:00+03:00" },
      ],
    },
  ],
  "doc-gyno-2": [
    {
      date: "2025-10-22",
      slots: [
        { id: "doc-gyno-2-2025-10-22-1000", start: "2025-10-22T10:00:00+03:00" },
        { id: "doc-gyno-2-2025-10-22-1230", start: "2025-10-22T12:30:00+03:00" },
        { id: "doc-gyno-2-2025-10-22-1500", start: "2025-10-22T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-03",
      slots: [
        { id: "doc-gyno-2-2025-11-03-0900", start: "2025-11-03T09:00:00+03:00" },
        { id: "doc-gyno-2-2025-11-03-1200", start: "2025-11-03T12:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-15",
      slots: [
        { id: "doc-gyno-2-2025-11-15-0930", start: "2025-11-15T09:30:00+03:00" },
        { id: "doc-gyno-2-2025-11-15-1100", start: "2025-11-15T11:00:00+03:00" },
        { id: "doc-gyno-2-2025-11-15-1400", start: "2025-11-15T14:00:00+03:00" },
      ],
    },
  ],
  "doc-gyno-3": [
    {
      date: "2025-11-15",
      slots: [
        { id: "doc-gyno-3-2025-11-15-1030", start: "2025-11-15T10:30:00+03:00" },
        { id: "doc-gyno-3-2025-11-15-1300", start: "2025-11-15T13:00:00+03:00" },
      ],
    },
    {
      date: "2025-11-22",
      slots: [
        { id: "doc-gyno-3-2025-11-22-1000", start: "2025-11-22T10:00:00+03:00" },
        { id: "doc-gyno-3-2025-11-22-1230", start: "2025-11-22T12:30:00+03:00" },
        { id: "doc-gyno-3-2025-11-22-1500", start: "2025-11-22T15:00:00+03:00" },
      ],
    },
    {
      date: "2025-12-02",
      slots: [
        { id: "doc-gyno-3-2025-12-02-1030", start: "2025-12-02T10:30:00+03:00" },
        { id: "doc-gyno-3-2025-12-02-1300", start: "2025-12-02T13:00:00+03:00" },
      ],
    },
  ],
};

const APPOINTMENT_CLINIC = {
  name: "РњРµРґР“СЂР°С„ РљР»РёРЅРёРєР°",
  city: "РСЂРєСѓС‚СЃРє",
  address: "СѓР». Р›РµРЅРёРЅР°, 58",
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
    pricePeriod: "30 РјРёРЅ",
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
  await delay(320);
  const schedule = MOCK_DOCTOR_SCHEDULE[doctorId] ?? [];
  return schedule.map((day) => ({
    date: day.date,
    slots: day.slots.map((slot) => ({ ...slot })),
  }));
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  await delay(500);

  const doctor = MOCK_DOCTORS.find((item) => item.id === payload.doctorId);
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedule = MOCK_DOCTOR_SCHEDULE[payload.doctorId] ?? [];
  const flatSlots = schedule.flatMap((day) => day.slots.map((slot) => ({ day: day.date, slot })));
  const matched = flatSlots.find((entry) => entry.slot.id === payload.slotId);

  if (!matched) {
    throw new Error("Slot not found");
  }

  const appointment: Appointment = {
    id: `new-${Date.now()}`,
    date: matched.slot.start,
    serviceName: `РџСЂРёС‘Рј Сѓ РІСЂР°С‡Р° ${doctor.specialty}`,
    doctorName: doctor.fullName,
    specialty: doctor.specialty,
    clinic: { ...APPOINTMENT_CLINIC },
    status: "planned",
    doctorAvatar: doctor.photoUrl || DOCTOR_AVATAR_PLACEHOLDER,
  };

  return appointment;
}





