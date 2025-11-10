import { NextResponse } from "next/server";
import { createLoginSession, type RemoteProfileSnapshot } from "@/server/loginSessionStore";
import { getUserByPhone } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };
  if (!phone) {
    return NextResponse.json({ error: "Введите номер телефона" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Введите номер телефона полностью" }, { status: 400 });
  }

  let hasLocalAccount = false;
  let displayName: string | null = null;
  try {
    const existing = await getUserByPhone(normalizedPhone);
    hasLocalAccount = Boolean(existing);
    displayName = existing?.fullName ?? null;
  } catch (error) {
    console.error("Не удалось проверить наличие пользователя:", error);
    return NextResponse.json({ error: "Не удалось проверить аккаунт" }, { status: 500 });
  }

  let sessionId: string | null = null;
  if (!hasLocalAccount) {
    const emptySnapshot: RemoteProfileSnapshot = {};
    try {
      const session = await createLoginSession(normalizedPhone, emptySnapshot);
      sessionId = session.sessionId;
    } catch (error) {
      console.error("Не удалось создать сессию входа:", error);
      return NextResponse.json({ error: "Не удалось подготовить вход" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    hasLocalPassword: hasLocalAccount,
    sessionId,
    displayName,
  });
}

