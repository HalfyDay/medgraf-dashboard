import { NextResponse } from "next/server";
import { getLoginSession, issueOtpForSession } from "@/server/loginSessionStore";
import { getOtpDebugCode, sendLoginOtpSms } from "@/server/smsService";

const DEBUG_PHONE_SHOW_CODE = "+79111111111";

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Неверный идентификатор сессии" }, { status: 400 });
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось загрузить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия истекла, запросите код заново" }, { status: 410 });
  }

  let otpResult;
  try {
    otpResult = await issueOtpForSession(sessionId);
    await sendLoginOtpSms(session.phone, otpResult.code);
  } catch (error) {
    console.error("Не удалось отправить SMS-код:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    otpExpiresAt: otpResult.expiresAt,
    debugCode: session.phone === DEBUG_PHONE_SHOW_CODE ? otpResult.code : getOtpDebugCode(otpResult.code),
  });
}
