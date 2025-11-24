import { NextResponse } from "next/server";
import { createLoginSession, issueOtpForSession } from "@/server/loginSessionStore";
import { getOtpDebugCode, sendLoginOtpSms } from "@/server/smsService";
import { getUserByPhone } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

const DEBUG_PHONE_SHOW_CODE = "+79111111111";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };

  if (!phone) {
    return NextResponse.json({ error: "Не указан номер телефона" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Введите корректный номер телефона" }, { status: 400 });
  }

  let user;
  try {
    user = await getUserByPhone(normalizedPhone);
  } catch (error) {
    console.error("Ошибка поиска пользователя:", error);
    return NextResponse.json({ error: "Не удалось проверить номер" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  try {
    const session = await createLoginSession(
      normalizedPhone,
      {
        code: user.onecId ?? null,
        fullName: user.fullName ?? null,
        birthDate: user.birthDate ?? null,
        medcardNumber: user.medcardNumber ?? null,
        gender: user.gender ?? null,
      },
      "reset",
    );
    const otpResult = await issueOtpForSession(session.sessionId);
    await sendLoginOtpSms(normalizedPhone, otpResult.code);

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      otpExpiresAt: otpResult.expiresAt,
      debugCode: normalizedPhone === DEBUG_PHONE_SHOW_CODE ? otpResult.code : getOtpDebugCode(otpResult.code),
      displayName: user.fullName ?? null,
    });
  } catch (error) {
    console.error("Ошибка создания сессии сброса пароля:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }
}
