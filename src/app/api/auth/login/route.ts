import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  extractUserFields,
  fetchOnecUserProfile,
  OnecLogicalError,
  type OnecUserProfile,
} from "@/server/onecAuthClient";
import { getUserByPhone, updateUserById, type DbUserRow } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const { phone, password } = (await req.json()) as { phone?: string; password?: string };

  if (!phone || !password) {
    return buildError("Укажите телефон и пароль", 400);
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return buildError("Введите номер телефона полностью", 401);
  }

  let userRow: DbUserRow | null = null;
  try {
    userRow = await getUserByPhone(normalizedPhone);
  } catch (error) {
    console.error("Не удалось выполнить поиск пользователя:", error);
    return buildError("Не удалось выполнить поиск пользователя", 500);
  }

  if (!userRow) {
    return buildError("Неверные данные для входа", 401);
  }

  const match = await bcrypt.compare(password, userRow.password);
  if (!match) {
    return buildError("Неверные данные для входа", 401);
  }

  let profile: OnecUserProfile;
  try {
    profile = await fetchOnecUserProfile(normalizedPhone, userRow.passportNumber ?? undefined);
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return buildError("Карта в 1С не найдена. Проверьте номер и паспортные данные.", 404);
    }
    const message = error instanceof Error ? error.message : "1С временно недоступна";
    return buildError(message, 502);
  }

  const profileFields = extractUserFields(profile);
  const remoteFullName = profileFields.fullName ?? userRow.fullName ?? null;
  const remoteBirthDate = profileFields.birthDate ?? userRow.birthDate ?? null;
  const remoteGender = profileFields.gender ?? userRow.gender ?? null;
  const remoteMedcard = profileFields.medcardNumber ?? userRow.medcardNumber ?? null;
  const remoteEmail = profileFields.email ?? userRow.email ?? null;
  const remoteOnecId = profile.summary.code ?? profile.summary.id ?? userRow.onecId ?? null;

  try {
    await updateUserById(userRow.id, {
      fullName: remoteFullName ?? undefined,
      birthDate: remoteBirthDate ?? undefined,
      gender: remoteGender ?? undefined,
      medcardNumber: remoteMedcard ?? undefined,
      onecId: remoteOnecId ?? undefined,
      email: remoteEmail ?? undefined,
    });
  } catch (error) {
    console.error("Не удалось обновить локальные данные пользователя:", error);
  }

  return NextResponse.json({
    success: true,
    user: {
      id: userRow.id,
      phone: userRow.phone,
      fullName: remoteFullName,
      birthDate: remoteBirthDate,
      email: remoteEmail,
      passportSeries: userRow.passportSeries,
      passportNumber: userRow.passportNumber,
      passportIssueDate: userRow.passportIssueDate,
      passportIssuedBy: userRow.passportIssuedBy,
      onecId: remoteOnecId,
      medcardNumber: remoteMedcard,
      gender: remoteGender,
    },
  });
}
