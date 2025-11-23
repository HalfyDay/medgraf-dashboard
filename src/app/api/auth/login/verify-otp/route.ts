import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getLoginSession, markOtpVerified, updateOtpAttempts } from "@/server/loginSessionStore";

export async function POST(req: Request) {
  const { sessionId, code } = (await req.json()) as { sessionId?: string; code?: string };
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Неверный идентификатор сессии" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Введите код из SMS" }, { status: 400 });
  }

  const cleanedCode = String(code).replace(/\D/g, "");

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось загрузить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось проверить код" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (!session.otpCodeHash || !session.otpExpiresAt) {
    return NextResponse.json({ error: "Код не запрошен или истек" }, { status: 400 });
  }

  if (session.otpExpiresAt < Date.now()) {
    return NextResponse.json({ error: "Код устарел, запросите новый" }, { status: 410 });
  }

  if (session.otpAttemptsLeft <= 0) {
    return NextResponse.json({ error: "Превышено количество попыток. Запросите новый код" }, { status: 429 });
  }

  const match = await bcrypt.compare(cleanedCode, session.otpCodeHash);
  if (!match) {
    const attemptsLeft = Math.max(0, (session.otpAttemptsLeft ?? 0) - 1);
    try {
      await updateOtpAttempts(sessionId, attemptsLeft);
    } catch (error) {
      console.error("Не удалось обновить счетчик попыток OTP:", error);
    }

    const message =
      attemptsLeft > 0
        ? `Неверный код. Осталось попыток: ${attemptsLeft}`
        : "Код заблокирован. Запросите новый";
    const status = attemptsLeft > 0 ? 400 : 429;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    await markOtpVerified(sessionId);
  } catch (error) {
    console.error("Не удалось сохранить подтверждение OTP:", error);
    return NextResponse.json({ error: "Не удалось подтвердить код" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
