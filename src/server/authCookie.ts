import crypto from "crypto";
import type { NextResponse } from "next/server";
import type { AuthUser } from "@/providers/AuthProvider";

export const AUTH_COOKIE_NAME = "mg_auth";
const AUTH_TTL_SECONDS = 30 * 60;

const AUTH_SECRET =
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";

if (!AUTH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required");
  } else {
    console.warn("[auth] AUTH_SECRET is not set; using insecure fallback for dev");
  }
}

type AuthPayload = {
  id: number;
  phone: string;
  onecId?: string | null;
  iat: number;
  exp: number;
};

const getAuthSecret = () => AUTH_SECRET || "dev-insecure-secret";

const toBase64Url = (value: string) =>
  Buffer.from(value, "utf-8").toString("base64url");

const fromBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf-8");

const signPayload = (payload: string) =>
  crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");

export function createAuthToken(user: AuthUser, ttlSeconds = AUTH_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthPayload = {
    id: user.id,
    phone: user.phone,
    onecId: user.onecId ?? null,
    iat: now,
    exp: now + ttlSeconds,
  };
  const body = toBase64Url(JSON.stringify(payload));
  const sig = signPayload(body);
  return `${body}.${sig}`;
}

export function verifyAuthToken(token: string | null | undefined): AuthPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = signPayload(body);
  if (sig.length !== expected.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64Url(body)) as AuthPayload;
    if (!payload?.exp || payload.exp * 1000 <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

const parseCookieHeader = (header: string | null) => {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = rest.join("=");
    return acc;
  }, {});
};

export function getAuthFromRequest(req: Request) {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  return verifyAuthToken(cookies[AUTH_COOKIE_NAME]);
}

export function setAuthCookie(res: NextResponse, user: AuthUser, ttlSeconds = AUTH_TTL_SECONDS) {
  const token = createAuthToken(user, ttlSeconds);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttlSeconds,
  });
}
