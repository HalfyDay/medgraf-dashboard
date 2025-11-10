import iconv from "iconv-lite";

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
  };
}

function ensureSuccess<T>(body: OnecEnvelope<T>, context: string): T {
  const statusText = body.error ?? body.error_message ?? "unknown";
  const code = body.code ?? body.error_code ?? "unknown";
  if (statusText === "success" && code === "0") {
    return body.details;
  }
  if (code === "2") {
    throw new OnecLogicalError("Пользователь не найден в 1С", code, context);
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

function buildQuery(query?: Record<string, string>) {
  return query ? `?${new URLSearchParams(query).toString()}` : "";
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
  return ensureSuccess(payload, context);
}

function shouldRetryWithBasic(error: unknown) {
  if (!(error instanceof OnecRequestError)) {
    return false;
  }
  const body = error.body.toLowerCase();
  return body.includes("параметра 'iss'") || body.includes("token") || body.includes("токен");
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

  const rawMatches = await requestOnec<OnecRawRecord[]>("/umc_client/auth_user", "auth_user", query);
  if (!Array.isArray(rawMatches) || rawMatches.length === 0) {
    throw new OnecLogicalError("Пользователь не найден в 1С", "2", "auth_user");
  }

  const summary = normalizeRecord(rawMatches[0]) ?? {};
  let patient: OnecPerson | undefined;

  const codeToLookup = summary.code ?? summary.id ?? undefined;
  if (codeToLookup) {
    const patientResponse = await requestOnec<OnecRawRecord[]>(
      "/umc_client_users/patients",
      "patients",
      { id: codeToLookup },
    ).catch((error) => {
      console.warn("Не удалось получить карточку пациента 1С:", error);
      return [];
    });

    if (Array.isArray(patientResponse) && patientResponse.length > 0) {
      patient = normalizeRecord(patientResponse[0]);
    }
  }

  return { summary, patient };
}
