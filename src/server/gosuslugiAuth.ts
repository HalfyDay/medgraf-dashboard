import crypto from "crypto";

export type GosuslugiProfile = {
  phone: string;
  fullName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  snils?: string | null;
};

const AUTH_URL = process.env.GOSUSLUGI_AUTH_URL;
const TOKEN_URL = process.env.GOSUSLUGI_TOKEN_URL;
const PROFILE_URL = process.env.GOSUSLUGI_PROFILE_URL;
const CLIENT_ID = process.env.GOSUSLUGI_CLIENT_ID;
const CLIENT_SECRET = process.env.GOSUSLUGI_CLIENT_SECRET;
const SCOPES = process.env.GOSUSLUGI_SCOPES ?? "openid profile";
const MOCK_MODE =
  process.env.GOSUSLUGI_MOCK === "true" ||
  !AUTH_URL ||
  !TOKEN_URL ||
  !PROFILE_URL ||
  !CLIENT_ID;

const MOCK_PROFILE: GosuslugiProfile = {
  phone: process.env.GOSUSLUGI_MOCK_PHONE ?? "79991112233",
  fullName: process.env.GOSUSLUGI_MOCK_FULLNAME ?? "Р“РѕСЃСѓСЃР»СѓРіР° РўРµСЃС‚РѕРІР°СЏ",
  birthDate: process.env.GOSUSLUGI_MOCK_BIRTHDATE ?? "1990-01-01",
  email: process.env.GOSUSLUGI_MOCK_EMAIL ?? "mock.user@gosuslugi.ru",
  snils: process.env.GOSUSLUGI_MOCK_SNILS ?? "123-456-789 00",
};

export const GOSUSLUGI_COOKIE_NAME = "mg_gosuslugi_oauth";

export function buildRedirectUri(origin: string) {
  const trimmedOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${trimmedOrigin}/api/auth/gosuslugi/callback`;
}

export function createPkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest()
    .toString("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildAuthorizationUrl(params: {
  redirectUri: string;
  state: string;
  codeChallenge: string;
}) {
  if (MOCK_MODE || !AUTH_URL || !CLIENT_ID) {
    throw new Error("Gosuslugi OAuth is not configured");
  }

  const url = new URL(AUTH_URL);
  const search = new URLSearchParams(url.search);
  search.set("client_id", CLIENT_ID);
  search.set("redirect_uri", params.redirectUri);
  search.set("response_type", "code");
  search.set("scope", SCOPES);
  search.set("state", params.state);
  search.set("code_challenge", params.codeChallenge);
  search.set("code_challenge_method", "S256");
  url.search = search.toString();
  return url.toString();
}

async function requestAccessToken(code: string, codeVerifier: string, redirectUri: string) {
  if (MOCK_MODE || !TOKEN_URL || !CLIENT_ID) {
    return { access_token: "mock-access-token" };
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });
  if (CLIENT_SECRET) {
    body.set("client_secret", CLIENT_SECRET);
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РјРµРЅСЏС‚СЊ РєРѕРґ РЅР° С‚РѕРєРµРЅ Р“РѕСЃСѓСЃР»СѓРі: ${text || response.statusText}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) {
    throw new Error("Р’ РѕС‚РІРµС‚Рµ Р“РѕСЃСѓСЃР»СѓРі РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ access_token");
  }
  return payload;
}

type ProfileRecord = {
  [key: string]: unknown;
  person?: ProfileRecord;
  contacts?: ProfileRecord;
};

const pickString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  return null;
};

const pickFromRecord = (record: ProfileRecord | undefined, keys: string[]): string | null => {
  if (!record) {
    return null;
  }
  for (const key of keys) {
    const candidate = pickString(record[key]);
    if (candidate) {
      return candidate;
    }
  }
  return null;
};

function mapProfile(raw: unknown): GosuslugiProfile {
  if (!raw || typeof raw !== "object") {
    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°Р·РѕР±СЂР°С‚СЊ РїСЂРѕС„РёР»СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р“РѕСЃСѓСЃР»СѓРіРё");
  }

  const record = raw as ProfileRecord;
  const person = record.person && typeof record.person === "object" ? (record.person as ProfileRecord) : undefined;
  const contacts = record.contacts && typeof record.contacts === "object" ? (record.contacts as ProfileRecord) : undefined;

  const primary =
    pickFromRecord(record, ["phone", "mobile_phone", "mobilePhone"]) ??
    pickFromRecord(person, ["mobile_phone", "mobilePhone"]) ??
    pickFromRecord(contacts, ["phone", "mobile", "mobile_phone"]);

  if (!primary) {
    throw new Error("РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РєРѕРЅС‚Р°РєС‚РЅС‹Р№ С‚РµР»РµС„РѕРЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р“РѕСЃСѓСЃР»СѓРіРё");
  }

  const nameParts = [
    pickFromRecord(record, ["last_name", "lastName"]),
    pickFromRecord(record, ["first_name", "firstName"]),
    pickFromRecord(record, ["middle_name", "middleName"]),
  ].filter(Boolean) as string[];

  const fullName =
    pickFromRecord(record, ["full_name", "fio"]) ??
    (nameParts.length ? nameParts.join(" ").trim() : null) ??
    pickFromRecord(person, ["full_name", "fio"]);

  const birthDate =
    pickFromRecord(record, ["birth_date", "birthDate"]) ??
    pickFromRecord(person, ["birth_date", "birthDate"]);
  const email =
    pickFromRecord(record, ["email"]) ??
    pickFromRecord(person, ["email"]) ??
    pickFromRecord(contacts, ["email"]);
  const snils = pickFromRecord(record, ["snils"]) ?? pickFromRecord(person, ["snils"]);

  return {
    phone: primary,
    fullName: fullName || null,
    birthDate: birthDate || null,
    email,
    snils,
  };
}

async function requestProfile(accessToken: string): Promise<GosuslugiProfile> {
  if (MOCK_MODE || !PROFILE_URL) {
    return { ...MOCK_PROFILE };
  }

  const response = await fetch(PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РїСЂРѕС„РёР»СЊ Р“РѕСЃСѓСЃР»СѓРі: ${text || response.statusText}`);
  }

  const raw = await response.json();
  return mapProfile(raw);
}

export async function fetchGosuslugiProfile(code: string, codeVerifier: string, redirectUri: string) {
  if (MOCK_MODE) {
    return { ...MOCK_PROFILE };
  }
  const { access_token } = await requestAccessToken(code, codeVerifier, redirectUri);
  return requestProfile(access_token);
}

export function encodeOauthSession(payload: { state: string; codeVerifier: string; redirectUri: string }) {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");
}

export function decodeOauthSession(value: string | undefined | null) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as {
      state: string;
      codeVerifier: string;
      redirectUri: string;
    };
  } catch {
    return null;
  }
}

export function isGosuslugiMockMode() {
  return MOCK_MODE;
}

