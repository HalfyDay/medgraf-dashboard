import { NextResponse } from "next/server";
import { createLoginSession, issueOtpForSession, type RemoteProfileSnapshot } from "@/server/loginSessionStore";
import { getOtpDebugCode, sendLoginOtpSms } from "@/server/smsService";
import { getUserByPhone } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

const DEBUG_PHONE_SHOW_CODE = "+79111111111";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };
  if (!phone) {
    return NextResponse.json({ error: "Введите номер телефона" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
  }

  let hasLocalAccount = false;
  let displayName: string | null = null;
  try {
    const existing = await getUserByPhone(normalizedPhone);
    hasLocalAccount = Boolean(existing);
    displayName = existing?.fullName ?? null;
  } catch (error) {
    console.error("Не удалось проверить локальную учетную запись:", error);
    return NextResponse.json({ error: "Не удалось проверить учетную запись" }, { status: 500 });
  }

  let sessionId: string | null = null;
  let otpExpiresAt: number | null = null;
  let debugCode: string | undefined;

  if (!hasLocalAccount) {
    const emptySnapshot: RemoteProfileSnapshot = {};
    try {
      const session = await createLoginSession(normalizedPhone, emptySnapshot);
      sessionId = session.sessionId;

      const otpResult = await issueOtpForSession(session.sessionId);
      otpExpiresAt = otpResult.expiresAt;
      await sendLoginOtpSms(normalizedPhone, otpResult.code);
      debugCode = normalizedPhone === DEBUG_PHONE_SHOW_CODE ? otpResult.code : getOtpDebugCode(otpResult.code);
    } catch (error) {
      console.error("Не удалось создать сессию входа:", error);
      return NextResponse.json({ error: "Не удалось запустить вход" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    hasLocalPassword: hasLocalAccount,
    sessionId,
    displayName,
    otpExpiresAt,
    debugCode,
  });
}
