import { NextResponse } from "next/server";
import { getLoginSession, issueOtpForSession } from "@/server/loginSessionStore";

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Отсутствует идентификатор сессии" }, { status: 400 });
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось получить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия устарела, начните заново" }, { status: 410 });
  }

  if (!session.docVerified) {
    return NextResponse.json({ error: "Сначала подтвердите документ" }, { status: 400 });
  }

  let otpResult;
  try {
    otpResult = await issueOtpForSession(sessionId);
  } catch (error) {
    console.error("Не удалось отправить SMS-код:", error);
    return NextResponse.json({ error: "Не удалось отправить код" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    otpExpiresAt: otpResult.expiresAt,
    debugCode: process.env.NODE_ENV !== "production" ? otpResult.code : undefined,
  });
}
