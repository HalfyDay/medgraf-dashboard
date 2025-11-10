import { NextResponse } from "next/server";
import { extractUserFields, fetchOnecUserProfile } from "@/server/onecAuthClient";
import {
  getLoginSession,
  issueOtpForSession,
  updateSessionDocData,
} from "@/server/loginSessionStore";

export async function POST(req: Request) {
  const { sessionId, docDigits } = (await req.json()) as { sessionId?: string; docDigits?: string };

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Отсутствует идентификатор сессии" }, { status: 400 });
  }
  if (!docDigits) {
    return NextResponse.json({ error: "Укажите последние цифры документа" }, { status: 400 });
  }

  const digits = String(docDigits).replace(/\D/g, "").slice(-3);
  if (digits.length !== 3) {
    return NextResponse.json({ error: "Введите последние 3 цифры документа" }, { status: 400 });
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось получить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось проверить данные" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия устарела, начните заново" }, { status: 410 });
  }

  if (session.docVerified) {
    return NextResponse.json({ error: "Документ уже подтверждён" }, { status: 409 });
  }

  let profile;
  try {
    profile = await fetchOnecUserProfile(session.phone, digits);
  } catch (error) {
    const message = error instanceof Error ? error.message : "1С недоступна";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const fields = extractUserFields(profile);
  const remoteData = {
    code: profile.summary.code ?? profile.summary.id ?? null,
    fullName: fields.fullName ?? null,
    birthDate: fields.birthDate ?? null,
    gender: fields.gender ?? null,
    medcardNumber: fields.medcardNumber ?? null,
    docDigits: digits,
  };

  try {
    await updateSessionDocData(sessionId, remoteData);
  } catch (error) {
    console.error("Не удалось обновить сессию после проверки документа:", error);
    return NextResponse.json({ error: "Не удалось сохранить подтверждение документа" }, { status: 500 });
  }

  let otpResult;
  try {
    otpResult = await issueOtpForSession(sessionId);
  } catch (error) {
    console.error("Не удалось отправить SMS-код:", error);
    return NextResponse.json({ error: "Не удалось отправить код подтверждения" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    otpExpiresAt: otpResult.expiresAt,
    debugCode: process.env.NODE_ENV !== "production" ? otpResult.code : undefined,
  });
}
