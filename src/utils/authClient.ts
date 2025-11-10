import type { AuthUser } from "@/providers/AuthProvider";
import { postJson } from "@/utils/http";
import { normalizePhone } from "@/utils/phone";

export type LoginStartResponse = {
  success: boolean;
  hasLocalPassword: boolean;
  sessionId?: string | null;
  displayName?: string | null;
};

export type VerifyDocResponse = {
  success: boolean;
  otpExpiresAt: number;
  debugCode?: string;
};

export async function startRemoteLogin(phone: string) {
  return postJson<LoginStartResponse>("/api/auth/login/start", {
    phone: normalizePhone(phone),
  });
}

export async function verifyPassportDigits(sessionId: string, digits: string) {
  return postJson<VerifyDocResponse>("/api/auth/login/verify-doc", {
    sessionId,
    docDigits: digits,
  });
}

export async function resendLoginOtp(sessionId: string) {
  return postJson<VerifyDocResponse>("/api/auth/login/resend-otp", {
    sessionId,
  });
}

export async function verifyLoginOtp(sessionId: string, code: string) {
  return postJson<{ success: boolean }>("/api/auth/login/verify-otp", {
    sessionId,
    code,
  });
}

export async function finalizeLoginPassword(sessionId: string, password: string) {
  const result = await postJson<{ user: AuthUser }>("/api/auth/login/set-password", {
    sessionId,
    password,
  });
  return result.user;
}
