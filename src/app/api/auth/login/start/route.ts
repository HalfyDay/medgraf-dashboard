import { NextResponse } from "next/server";
import { extractUserFields, fetchOnecUserProfile, OnecLogicalError } from "@/server/onecAuthClient";
import { createLoginSession, type RemoteProfileSnapshot } from "@/server/loginSessionStore";
import { getUserByPhone } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };
  if (!phone) {
    return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Введите номер телефона полностью" }, { status: 400 });
  }

  let profile;
  try {
    profile = await fetchOnecUserProfile(normalizedPhone);
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return NextResponse.json({ error: "Пользователь с таким телефоном не найден" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "1С недоступна";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const fields = extractUserFields(profile);
  const remoteSnapshot: RemoteProfileSnapshot = {
    code: profile.summary.code ?? profile.summary.id ?? null,
    fullName: fields.fullName ?? null,
    birthDate: fields.birthDate ?? null,
    gender: fields.gender ?? null,
    medcardNumber: fields.medcardNumber ?? null,
  };

  let hasLocalAccount = false;
  try {
    hasLocalAccount = Boolean(await getUserByPhone(normalizedPhone));
  } catch (error) {
    console.error("Не удалось проверить локальный аккаунт:", error);
    return NextResponse.json({ error: "Не удалось выполнить проверку пользователя" }, { status: 500 });
  }

  let sessionId: string | null = null;
  if (!hasLocalAccount) {
    try {
      const session = await createLoginSession(normalizedPhone, remoteSnapshot);
      sessionId = session.sessionId;
    } catch (error) {
      console.error("Не удалось создать сессию входа:", error);
      return NextResponse.json({ error: "Не удалось начать вход" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    hasLocalPassword: hasLocalAccount,
    sessionId,
    displayName: remoteSnapshot.fullName,
  });
}
