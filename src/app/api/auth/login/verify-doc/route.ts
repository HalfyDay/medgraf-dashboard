import { NextResponse } from "next/server";
import { extractUserFields, fetchOnecUserProfile } from "@/server/onecAuthClient";
import { getLoginSession, updateSessionDocData } from "@/server/loginSessionStore";

export async function POST(req: Request) {
  const { sessionId, docDigits } = (await req.json()) as { sessionId?: string; docDigits?: string };

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Неверный идентификатор сессии" }, { status: 400 });
  }
  if (!docDigits) {
    return NextResponse.json({ error: "Укажите последние 3 цифры паспорта" }, { status: 400 });
  }

  const digits = String(docDigits).replace(/\D/g, "").slice(-3);
  if (digits.length !== 3) {
    return NextResponse.json({ error: "Нужно ввести 3 цифры паспорта" }, { status: 400 });
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось загрузить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось продолжить авторизацию" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия истекла, запросите код заново" }, { status: 410 });
  }

  if (!session.otpVerified) {
    return NextResponse.json({ error: "Сначала подтвердите код из SMS" }, { status: 400 });
  }

  if (session.docVerified) {
    return NextResponse.json({ error: "Документ уже подтвержден" }, { status: 409 });
  }

  let profile;
  try {
    profile = await fetchOnecUserProfile(session.phone, digits);
  } catch (error) {
    const message = error instanceof Error ? error.message : "1С не вернула данные";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const fields = extractUserFields(profile);
  const remoteData = {
    code: profile.summary.code ?? profile.summary.id ?? null,
    fullName: fields.fullName ?? null,
    birthDate: fields.birthDate ?? null,
    gender: fields.gender ?? null,
    medcardNumber: fields.medcardNumber ?? null,
  };

  try {
    await updateSessionDocData(sessionId, remoteData);
  } catch (error) {
    console.error("Не удалось сохранить данные паспорта в сессии входа:", error);
    return NextResponse.json({ error: "Не удалось подтвердить паспортные данные" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}
