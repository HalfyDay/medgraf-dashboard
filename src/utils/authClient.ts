import type { AuthUser } from "@/providers/AuthProvider";
import { postJson } from "@/utils/http";
import { normalizePhone } from "@/utils/phone";

export type RegisterPayload = {
  phone: string;
  password: string;
  fullName: string;
  birthDate: string;
  email?: string;
  passportLastDigits: string;
};

export async function checkPhoneExists(phone: string) {
  const result = await postJson<{ exists: boolean }>("/api/auth/check-phone", {
    phone: normalizePhone(phone),
  });
  return result.exists;
}

export async function registerUser(payload: RegisterPayload) {
  const result = await postJson<{ user: AuthUser }>("/api/auth/register", {
    ...payload,
    phone: normalizePhone(payload.phone),
  });
  return result.user;
}
