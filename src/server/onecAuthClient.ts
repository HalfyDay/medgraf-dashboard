import iconv from "iconv-lite";
import type { DoctorDirectoryEntry, DoctorServiceEntry, ServiceDirectoryEntry } from "@/types/clinic";

const DEFAULT_BASE_URL = "http://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs";
const DEFAULT_BASIC_USER = "Test";
const DEFAULT_BASIC_PASSWORD = "12345678";

type OnecEnvelope<T> = {
  error?: string;
  error_message?: string;
  code?: string;
  error_code?: string;
  details: T;
};

type OnecRawRecord = {
  [key: string]: unknown;
};

export type OnecPerson = {
  code?: string | null;
  id?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  medcardNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  docSer?: string | null;
  docNum?: string | null;
};

export type OnecRelative = {
  member?: string | null;
  relationship?: string | null;
  memberID?: string | null;
  memberBirthDate?: string | null;
  memberCardNumber?: string | null;
};

export type OnecPatientDetails = OnecPerson & {
  relatives: OnecRelative[];
};

export type OnecUserProfile = {
  summary: OnecPerson;
  patient?: OnecPerson;
};

export type OnecUserFields = {
  fullName?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  medcardNumber?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
};

const baseUrl = (process.env.ONEC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
const basicUser = process.env.ONEC_BASIC_USER || DEFAULT_BASIC_USER;
const basicPassword = process.env.ONEC_BASIC_PASSWORD || DEFAULT_BASIC_PASSWORD;

const basicAuthHeader = () => `Basic ${Buffer.from(`${basicUser}:${basicPassword}`, "utf-8").toString("base64")}`;

let cachedToken: { value: string; expiresAt: number | null } | null = null;

export class OnecRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
  }
}

export class OnecLogicalError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly context: string,
  ) {
    super(message);
  }
}

const trimString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const composeFullName = (record: { full_name?: string; first_name?: string; last_name?: string; middle_name?: string }) => {
  const direct = trimString(record.full_name);
  if (direct) {
    return direct;
  }
  const parts = [trimString(record.last_name), trimString(record.first_name), trimString(record.middle_name)].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
};

function normalizeRecord(raw: OnecRawRecord | null | undefined): OnecPerson | undefined {
  if (!raw) {
    return undefined;
  }
  const get = (key: string) => {
    const lower = key.toLowerCase();
    const entry = Object.keys(raw).find((k) => k.toLowerCase() === lower);
    if (!entry) {
      return undefined;
    }
    return raw[entry];
  };

  const codeValue = get("code") ?? get("id");
  const normalizedFullName = composeFullName({
    full_name: trimString(get("full_name")),
    first_name: trimString(get("first_name")),
    last_name: trimString(get("last_name")),
    middle_name: trimString(get("middle_name")),
  });

  return {
    code: codeValue ? String(codeValue) : null,
    id: get("id") ? String(get("id")) : get("code") ? String(get("code")) : null,
    fullName: normalizedFullName || null,
    firstName: trimString(get("first_name")) || null,
    lastName: trimString(get("last_name")) || null,
    middleName: trimString(get("middle_name")) || null,
    birthDate: trimString(get("birth_date")) || null,
    gender: trimString(get("gender")) || null,
    medcardNumber: trimString(get("medcard_number")) || null,
    email: trimString(get("email")) || null,
    phone: trimString(get("phone")) || null,
    address: trimString(get("address")) || null,
    docSer: trimString(get("docSer")) || trimString(get("doc_ser")) || null,
    docNum: trimString(get("docNum")) || trimString(get("doc_num")) || null,
  };
}

function normalizeRelative(raw: OnecRawRecord | null | undefined): OnecRelative | null {
  if (!raw) {
    return null;
  }
  const get = (key: string) => {
    const lower = key.toLowerCase();
    const entry = Object.keys(raw).find((k) => k.toLowerCase() === lower);
    if (!entry) {
      return undefined;
    }
    return raw[entry];
  };

  const member = trimString(get("member")) || null;
  const relationship = trimString(get("relationship")) || null;
  const memberID = trimString(get("memberID")) || trimString(get("member_id")) || null;
  const memberBirthDate = trimString(get("memberBirthDate")) || trimString(get("member_birth_date")) || null;
  const memberCardNumber = trimString(get("memberCardNumber")) || trimString(get("member_card_number")) || null;

  if (!member && !relationship && !memberID && !memberBirthDate && !memberCardNumber) {
    return null;
  }

  return {
    member,
    relationship,
    memberID,
    memberBirthDate,
    memberCardNumber,
  };
}

function ensureSuccess<T>(body: OnecEnvelope<T>, context: string): T {
  const statusText = body.error ?? body.error_message ?? "unknown";
  const code = body.code ?? body.error_code ?? "unknown";
  if (code === "0") {
    return body.details;
  }
  if (code === "2") {
    throw new OnecLogicalError("Пользователь не найден", code, context);
  }
  throw new OnecLogicalError(`Ошибка 1С (${context}): ${statusText} [${code}]`, code, context);
}

async function parseJson<T>(res: Response, context: string): Promise<T> {
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const utfText = buffer.toString("utf-8");
  const hasReplacementChar = utfText.includes("\uFFFD");

  const tryParse = (text: string) => JSON.parse(text) as T;

  if (!hasReplacementChar) {
    try {
      return tryParse(utfText);
    } catch {
      // fall through to cp1251 attempt
    }
  }

  try {
    const cp1251Text = iconv.decode(buffer, "win1251");
    return tryParse(cp1251Text);
  } catch {
    if (!hasReplacementChar) {
      throw new Error(`Не удалось разобрать ответ 1С (${context})`);
    }
    try {
      return tryParse(utfText);
    } catch {
      throw new Error(`Не удалось разобрать ответ 1С (${context})`);
    }
  }
}

function decodeJwtExpiration(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const withPadding = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = Buffer.from(withPadding, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as { exp?: number };
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function requestToken(): Promise<string> {
  const url = `${baseUrl}/umc_client/get_token`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: basicAuthHeader(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Не удалось получить токен 1С: ${text}`);
  }

  const payload = await parseJson<OnecEnvelope<string>>(res, "get_token");
  return ensureSuccess(payload, "get_token");
}

async function getBearerToken(): Promise<string> {
  if (cachedToken && (!cachedToken.expiresAt || cachedToken.expiresAt - Date.now() > 60_000)) {
    return cachedToken.value;
  }
  const token = await requestToken();
  cachedToken = { value: token, expiresAt: decodeJwtExpiration(token) };
  return token;
}

export async function buildOnecAuthHeader(prefer: "bearer" | "basic" = "bearer"): Promise<string> {
  if (prefer === "basic") {
    return basicAuthHeader();
  }
  try {
    const token = await getBearerToken();
    return `Bearer ${token}`;
  } catch (error) {
    console.warn("[onec auth] bearer token fetch failed, falling back to basic", error);
    return basicAuthHeader();
  }
}

function buildQuery(query?: Record<string, string>) {
  return query ? `?${new URLSearchParams(query).toString().replace(/\+/g, "%20")}` : "";
}

async function requestJson<T>(
  path: string,
  context: string,
  authMode: "basic" | "bearer",
  query?: Record<string, string>,
) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authMode === "basic") {
    headers.Authorization = basicAuthHeader();
  } else {
    const token = await getBearerToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}${buildQuery(query)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OnecRequestError(
      `Ошибка запроса 1С (${context}): ${text || res.statusText}`,
      res.status,
      text || "",
    );
  }

  const payload = await parseJson<OnecEnvelope<T>>(res, context);
  const result = ensureSuccess(payload, context);
  return result;
}

async function requestJsonPost<T>(
  path: string,
  context: string,
  authMode: "basic" | "bearer",
  query?: Record<string, string>,
) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authMode === "basic") {
    headers.Authorization = basicAuthHeader();
  } else {
    const token = await getBearerToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}${buildQuery(query)}`, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OnecRequestError(
      `Ошибка запроса 1С (${context}): ${text || res.statusText}`,
      res.status,
      text || "",
    );
  }

  const payload = await parseJson<OnecEnvelope<T>>(res, context);
  const result = ensureSuccess(payload, context);
  return result;
}

async function requestBinary(
  path: string,
  context: string,
  authMode: "basic" | "bearer",
  query?: Record<string, string>,
) {
  const headers: Record<string, string> = {};
  if (authMode === "basic") {
    headers.Authorization = basicAuthHeader();
  } else {
    const token = await getBearerToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}${buildQuery(query)}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OnecRequestError(
      `Ошибка обращения к 1С (${context}): ${text || res.statusText}`,
      res.status,
      text || "",
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: res.headers.get("content-type"),
    disposition: res.headers.get("content-disposition"),
  };
}

function shouldRetryWithBasic(error: unknown) {
  if (!(error instanceof OnecRequestError)) {
    return false;
  }
  const body = error.body.toLowerCase();
  return (
    body.includes("token") ||
    body.includes("iss") ||
    body.includes("токен") ||
    body.includes("некорректное значение параметра 'iss'") ||
    body.includes("просрочен") ||
    body.includes("просрочено")
  );
}

async function requestOnec<T>(path: string, context: string, query?: Record<string, string>) {
  try {
    return await requestJson<T>(path, context, "bearer", query);
  } catch (error) {
    if (shouldRetryWithBasic(error)) {
      console.warn(`Bearer-запрос 1С (${context}) отклонён, выполняем повтор по Basic Auth`);
      cachedToken = null;
      return requestJson<T>(path, context, "basic", query);
    }
    throw error;
  }
}

async function requestOnecBasic<T>(path: string, context: string, query?: Record<string, string>) {
  return requestJson<T>(path, context, "basic", query);
}

async function requestOnecBinary(path: string, context: string, query?: Record<string, string>) {
  try {
    return await requestBinary(path, context, "bearer", query);
  } catch (error) {
    if (shouldRetryWithBasic(error)) {
      console.warn(
        `Bearer-запрос 1С (${context}) не прошел, пробуем еще раз через Basic Auth`,
      );
      cachedToken = null;
      return requestBinary(path, context, "basic", query);
    }
    throw error;
  }
}

function pickPrimary(profile: OnecUserProfile): OnecPerson {
  return profile.patient ?? profile.summary;
}

export function extractUserFields(profile: OnecUserProfile): OnecUserFields {
  const person = pickPrimary(profile);
  return {
    fullName: person.fullName ?? null,
    birthDate: person.birthDate ?? null,
    gender: person.gender ?? null,
    medcardNumber: person.medcardNumber ?? null,
    email: person.email ?? null,
    firstName: person.firstName ?? null,
    lastName: person.lastName ?? null,
    middleName: person.middleName ?? null,
  };
}

export async function fetchOnecUserProfile(phoneDigits: string, docNum?: string): Promise<OnecUserProfile> {
  const digits = phoneDigits.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new Error("Некорректный телефон для запроса 1С");
  }

  const query: Record<string, string> = { phone: digits };
  if (docNum) {
    const docDigits = docNum.replace(/\D/g, "");
    if (docDigits) {
      query.docNum = docDigits;
    }
  }

  console.log("[onec auth] /umc_client/auth_user request", query);
  const rawMatches = await requestOnec<OnecRawRecord[]>("/umc_client/auth_user", "auth_user", query);
  if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
    throw new OnecLogicalError("Пользователь не найден", "2", "auth_user");
  }

  const summary = normalizeRecord(rawMatches[0]) ?? {};
  let patient: OnecPerson | undefined;

  const codeToLookup = summary.code ?? summary.id ?? undefined;
  if (codeToLookup) {
    console.log("[onec auth] /umc_client_users/patients request", { id: codeToLookup });
    const patientResponse = await requestOnec<OnecRawRecord | OnecRawRecord[]>(
      "/umc_client_users/patients",
      "patients",
      { id: codeToLookup },
    ).catch((error) => {
      console.warn("Не удалось получить карточку пациента 1С:", error);
      return [];
    });

    const patientList = Array.isArray(patientResponse) ? patientResponse : [patientResponse];
    if (patientList.length > 0) {
      patient = normalizeRecord(patientList[0]);
    }
  }

  return { summary, patient };
}

export async function fetchOnecAuthUserMatches(phoneValue: string): Promise<OnecPerson[]> {
  const digits = phoneValue.replace(/\D/g, "");
  let queryPhone = "";
  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    queryPhone = `8${last10}`;
  } else {
    throw new Error("Некорректный телефон для запроса 1С");
  }

  console.log("[onec auth] /umc_client/auth_user request", { phone: queryPhone });
  const rawMatches = await requestOnec<OnecRawRecord[]>("/umc_client/auth_user", "auth_user", {
    phone: queryPhone,
  });
  if (!Array.isArray(rawMatches)) {
    return [];
  }
  return rawMatches.map((item) => normalizeRecord(item) ?? {}).filter((item) => item.id || item.code);
}

export async function fetchOnecPatientDetails(patientId: string): Promise<OnecPatientDetails | null> {
  const safePatientId = patientId.toString().trim().replace(/[^\w-]/g, "");
  if (!safePatientId) {
    throw new Error("Не указан id пациента для загрузки медкарты");
  }
  console.log("[onec] /umc_client_users/patients request", { patientId: safePatientId });
  const rawPayload = await requestOnec<OnecRawRecord | OnecRawRecord[]>(
    "/umc_client_users/patients",
    "patients",
    {
      id: safePatientId,
    },
  );
  const rawList = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
  if (!rawList[0]) {
    return null;
  }

  const raw = rawList[0];
  const person = normalizeRecord(raw) ?? { id: safePatientId };
  const relativesRaw = Array.isArray((raw as Record<string, unknown>).relatives)
    ? ((raw as Record<string, unknown>).relatives as OnecRawRecord[])
    : [];
  const relatives = relativesRaw
    .map((item) => normalizeRelative(item))
    .filter((entry): entry is OnecRelative => Boolean(entry));


  return {
    ...person,
    relatives,
  };
}

type OnecDoctorRaw = {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  specialties?: string[] | string | null;
  photo?: string;
  image?: string;
  services?: OnecDoctorServiceRaw[] | null;
};

type OnecDoctorServiceRaw = {
  serviceID?: string;
  serviceName?: string;
  serviceTime?: string;
  serviceCost?: number | string;
};

const normalizeSpecialties = (value: OnecDoctorRaw["specialties"]) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : String(entry ?? "")))
      .filter((entry) => entry.length > 0);
  }
  return [String(value).trim()].filter((entry) => entry.length > 0);
};

const parseServiceTimeMinutes = (value?: string) => {
  if (!value) {
    return null;
  }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const mapDoctorService = (raw: OnecDoctorServiceRaw): DoctorServiceEntry | null => {
  const id = raw.serviceID?.toString().trim();
  if (!id) {
    return null;
  }
  const name = raw.serviceName?.toString().trim() || id;
  const price =
    typeof raw.serviceCost === "number"
      ? raw.serviceCost
      : raw.serviceCost
        ? Number(raw.serviceCost)
        : null;
  return {
    id,
    name,
    durationMinutes: parseServiceTimeMinutes(raw.serviceTime),
    price: Number.isNaN(price ?? NaN) ? null : price,
    currency: "RUB",
  };
};

const mapDoctorRecord = (raw: OnecDoctorRaw): DoctorDirectoryEntry | null => {
  const id = raw.id?.toString().trim();
  if (!id) {
    return null;
  }
  const fullName = composeFullName({
    full_name: typeof raw.full_name === "string" ? raw.full_name : undefined,
    first_name: undefined,
    last_name: undefined,
    middle_name: undefined,
  });

  const photo =
    typeof raw.image === "string"
      ? raw.image.trim()
      : typeof raw.photo === "string"
        ? raw.photo.trim()
        : undefined;

  return {
    id,
    fullName: fullName || raw.full_name?.toString().trim() || id,
    email: typeof raw.email === "string" ? raw.email.trim() : undefined,
    phone: typeof raw.phone === "string" ? raw.phone.trim() : undefined,
    specialties: normalizeSpecialties(raw.specialties),
    photoUrl: photo && photo.length > 0 ? photo : undefined,
    services: Array.isArray(raw.services)
      ? raw.services
          .map((service) => mapDoctorService(service))
          .filter((service): service is DoctorServiceEntry => Boolean(service))
      : undefined,
  };
};

export async function fetchOnecDoctorsDirectory(query?: { id?: string }): Promise<DoctorDirectoryEntry[]> {
  const params = query?.id ? { id: query.id } : undefined;
  let rawList: OnecDoctorRaw[] = [];
  try {
    rawList = await requestOnecBasic<OnecDoctorRaw[]>("/doctors/get_doctors", "get_doctors", params);
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return [];
    }
    throw error;
  }
  if (!Array.isArray(rawList)) {
    return [];
  }
  return rawList
    .map((raw) => {
      try {
        return mapDoctorRecord(raw);
      } catch (error) {
        console.warn("Failed to normalize doctor entry", raw, error);
        return null;
      }
    })
    .filter((entry): entry is DoctorDirectoryEntry => Boolean(entry));
}

type OnecServiceRaw = {
  id?: string;
  category?: string;
  subcategory?: string;
  name?: string;
  price?: number | string;
  currency?: string;
  duration_minutes?: number | string;
};

const mapServiceRecord = (raw: OnecServiceRaw): ServiceDirectoryEntry | null => {
  const id = raw.id?.toString().trim();
  if (!id) {
    return null;
  }
  return {
    id,
    category: raw.category?.toString().trim() || "Общие услуги",
    subcategory: raw.subcategory?.toString().trim() || null,
    name: raw.name?.toString().trim() || id,
    price: typeof raw.price === "number" ? raw.price : raw.price ? Number(raw.price) : undefined,
    currency: raw.currency?.toString().trim() || undefined,
    durationMinutes:
      typeof raw.duration_minutes === "number"
        ? raw.duration_minutes
        : raw.duration_minutes
          ? Number(raw.duration_minutes)
          : undefined,
  };
};

export async function fetchOnecServicesDirectory(query?: { id?: string }): Promise<ServiceDirectoryEntry[]> {
  const params = query?.id ? { id: query.id } : undefined;
  const rawList = await requestOnecBasic<OnecServiceRaw[]>("/services/service", "services", params);
  if (!Array.isArray(rawList)) {
    return [];
  }
  return rawList
    .map((raw) => {
      try {
        return mapServiceRecord(raw);
      } catch (error) {
        console.warn("Failed to normalize service entry", raw, error);
        return null;
      }
    })
    .filter((entry): entry is ServiceDirectoryEntry => Boolean(entry));
}

export type OnecDocumentRecord = {
  id?: string | null;
  patient_id?: string | null;
  title?: string | null;
  date?: string | null;
};

export async function fetchOnecDocuments(patientId: string): Promise<OnecDocumentRecord[]> {
  const safePatientId = patientId.toString().trim().replace(/[^\w-]/g, "");
  if (!safePatientId) {
    throw new Error("Не указан id пациента для загрузки документов");
  }
  try {
    console.log("[onec] /umc_client_users/results request", { patientId: safePatientId });
    const docs = await requestOnec<OnecDocumentRecord[]>(
      "/umc_client_users/results",
      "results",
      { id: safePatientId },
    );
    if (!Array.isArray(docs)) {
      return [];
    }
    return docs;
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      console.warn("[onec] /umc_client_users/results logical error code=2", { patientId: safePatientId });
      return [];
    }
    throw error;
  }
}

export type OnecAppointmentRecord = {
  id?: string | null;
  patient_id?: string | null;
  date?: string | null;
  doctor?: string | null;
  doctor_id?: string | null;
  specialties?: string[] | string | null;
  image?: string | null;
};

export type OnecScheduleSlot = {
  from?: string | null;
  to?: string | null;
  duration?: number | string | null;
};

export type OnecScheduleAppointmentWork = {
  nomenclatureID?: string | null;
  nomenclatureName?: string | null;
  continuance?: string | null;
  workerID?: string | null;
  workerName?: string | null;
};

export type OnecScheduleAppointmentRecord = {
  webID?: string | null;
  doctorID?: string | null;
  doctorName?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  works?: OnecScheduleAppointmentWork[] | null;
};

export type OnecScheduleDate = {
  date?: string | null;
  slots?: OnecScheduleSlot[] | null;
};

export type OnecScheduleDoctor = {
  doctor_id?: string | null;
  dates?: OnecScheduleDate[] | null;
};

export type OnecScheduleClinic = {
  clinic_id?: string | null;
  doctors?: OnecScheduleDoctor[] | null;
};

export async function fetchOnecAppointments(patientId: string): Promise<OnecAppointmentRecord[]> {
  const safePatientId = patientId.toString().trim().replace(/[^\w-]/g, "");
  if (!safePatientId) {
    throw new Error("Не указан id пациента для загрузки приемов");
  }
  try {
    console.log("[onec] /umc_client_users/appointments request", { patientId: safePatientId });
    const appointments = await requestOnec<OnecAppointmentRecord[]>(
      "/umc_client_users/appointments",
      "appointments",
      { id: safePatientId },
    );
    if (!Array.isArray(appointments)) {
      return [];
    }
    return appointments;
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      console.warn("[onec] /umc_client_users/appointments logical error code=2", { patientId: safePatientId });
      return [];
    }
    throw error;
  }
}

async function requestOnecPost<T>(path: string, context: string, query?: Record<string, string>) {
  try {
    return await requestJsonPost<T>(path, context, "bearer", query);
  } catch (error) {
    if (shouldRetryWithBasic(error)) {
      console.warn(`Bearer-запрос 1С (${context}) отклонён, выполняем повтор по Basic Auth`);
      cachedToken = null;
      return requestJsonPost<T>(path, context, "basic", query);
    }
    throw error;
  }
}

export async function fetchOnecSchedule(doctorId: string): Promise<OnecScheduleClinic[]> {
  const safeDoctorId = doctorId.toString().trim().replace(/[^\w-]/g, "");
  if (!safeDoctorId) {
    throw new Error("Не указан id врача для загрузки расписания");
  }
  console.log("[onec] /schedule/schedule request", { doctorId: safeDoctorId });
  const schedule = await requestOnec<OnecScheduleClinic[]>("/schedule/schedule", "schedule", {
    id: safeDoctorId,
  });
  if (!Array.isArray(schedule)) {
    return [];
  }
  return schedule;
}

export async function fetchOnecScheduleAppointments(params: {
  patientId: string;
  status: string;
}): Promise<OnecScheduleAppointmentRecord[]> {
  const safePatientId = params.patientId.toString().trim().replace(/[^\w-]/g, "");
  const safeStatus = params.status.toString().trim();
  if (!safePatientId) {
    throw new Error("Не указан id пациента для загрузки заявок");
  }
  if (!safeStatus) {
    throw new Error("Не указан статус заявок для загрузки");
  }
  console.log("[onec] /schedule/appointments request", { patientId: safePatientId, status: safeStatus });
  const result = await requestOnec<OnecScheduleAppointmentRecord[]>(
    "/schedule/appointments",
    "schedule_appointments",
    {
      patientID: safePatientId,
      status: safeStatus,
    },
  );
  if (!Array.isArray(result)) {
    return [];
  }
  return result;
}

export async function submitOnecScheduleRequest(params: {
  doctorID: string;
  patientID: string;
  startDate: string;
  endDate: string;
  serviceID?: string;
}): Promise<string> {
  const query: Record<string, string> = {
    doctorID: params.doctorID,
    patientID: params.patientID,
    startDate: params.startDate,
    endDate: params.endDate,
  };
  if (params.serviceID) {
    query.serviceID = params.serviceID;
  }
  console.log("[onec] /schedule/request request", query);
  try {
    const requestId = await requestOnecPost<string>("/schedule/request", "schedule_request", query);
    return requestId;
  } catch (error) {
    console.warn("[onec] /schedule/request POST failed, retrying with GET", error);
    const requestId = await requestOnec<string>("/schedule/request", "schedule_request", query);
    return requestId;
  }
}

export async function downloadOnecDocument(uid: string) {
  if (!uid) {
    throw new Error("Не указан uid документа");
  }
  return requestOnecBinary("/umc_client_users/document", "document", { uid });
}

export async function downloadOnecAppointmentDocument(uid: string) {
  if (!uid) {
    throw new Error("Не указан uid документа");
  }
  return requestOnecBinary("/umc_client_users/appointment_pdf", "appointment_pdf", { uid });
}
