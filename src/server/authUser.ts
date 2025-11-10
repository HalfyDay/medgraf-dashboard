import crypto from "crypto";
import bcrypt from "bcrypt";
import type { AuthUser } from "@/providers/AuthProvider";
import type { DbUserRow } from "@/server/userStore";
import { getUserByPhone, insertUser, updateUserById } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";
import type { GosuslugiProfile } from "@/server/gosuslugiAuth";

export function mapDbUserToAuthUser(row: DbUserRow): AuthUser {
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.fullName ?? null,
    birthDate: row.birthDate ?? null,
    email: row.email ?? null,
    passportSeries: row.passportSeries ?? null,
    passportNumber: row.passportNumber ?? null,
    passportIssueDate: row.passportIssueDate ?? null,
    passportIssuedBy: row.passportIssuedBy ?? null,
    onecId: row.onecId ?? null,
    medcardNumber: row.medcardNumber ?? null,
    gender: row.gender ?? null,
  };
}

export async function ensureUserFromGosuslugi(profile: GosuslugiProfile): Promise<AuthUser> {
  const normalizedPhone = normalizePhone(profile.phone);
  if (!normalizedPhone) {
    throw new Error("Не удалось определить номер телефона из профиля Госуслуг");
  }

  let existing = await getUserByPhone(normalizedPhone);
  const updates = {
    fullName: profile.fullName ?? existing?.fullName ?? null,
    birthDate: profile.birthDate ?? existing?.birthDate ?? null,
    email: profile.email ?? existing?.email ?? null,
    passportNumber: profile.snils ?? existing?.passportNumber ?? null,
  };

  if (existing) {
    await updateUserById(existing.id, updates);
    existing = await getUserByPhone(normalizedPhone);
  } else {
    const randomSecret = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(randomSecret, 10);
    existing = await insertUser({
      phone: normalizedPhone,
      password: passwordHash,
      fullName: updates.fullName ?? null,
      birthDate: updates.birthDate ?? null,
      email: updates.email ?? null,
      passportSeries: null,
      passportNumber: updates.passportNumber ?? null,
      passportIssueDate: null,
      passportIssuedBy: null,
      onecId: null,
      medcardNumber: null,
      gender: null,
    });
  }

  if (!existing) {
    throw new Error("Не удалось создать запись пользователя");
  }

  return mapDbUserToAuthUser(existing);
}

