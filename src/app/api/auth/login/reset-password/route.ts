import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { deleteLoginSession, getLoginSession } from "@/server/loginSessionStore";
import { getUserByPhone, updateUserById } from "@/server/userStore";
import { setAuthCookie } from "@/server/authCookie";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const { sessionId, password } = (await req.json()) as { sessionId?: string; password?: string };

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Не указан идентификатор сессии" }, { status: 400 });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов` },
      { status: 400 },
    );
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Ошибка получения сессии сброса пароля:", error);
    return NextResponse.json({ error: "Не удалось проверить сессию сброса пароля" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия истекла, запросите новый код" }, { status: 410 });
  }

  if (session.purpose !== "reset") {
    return NextResponse.json({ error: "Сессия не подходит для сброса пароля" }, { status: 400 });
  }

  if (!session.otpVerified) {
    return NextResponse.json({ error: "Подтвердите код из SMS" }, { status: 400 });
  }

  let user;
  try {
    user = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Ошибка поиска пользователя по телефону:", error);
    return NextResponse.json({ error: "Не удалось получить данные пользователя" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await updateUserById(user.id, { password: passwordHash });
  } catch (error) {
    console.error("Ошибка сохранения нового пароля:", error);
    return NextResponse.json({ error: "Не удалось сохранить пароль" }, { status: 500 });
  }

  try {
    await deleteLoginSession(sessionId);
  } catch (error) {
    console.warn("Не удалось удалить сессию сброса:", error);
  }

  const updatedUser = { ...user, password: passwordHash };

  const response = NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      fullName: updatedUser.fullName ?? null,
      birthDate: updatedUser.birthDate ?? null,
      email: updatedUser.email ?? null,
      passportSeries: updatedUser.passportSeries ?? null,
      passportNumber: updatedUser.passportNumber ?? null,
      passportIssuedBy: updatedUser.passportIssuedBy ?? null,
      passportIssueDate: updatedUser.passportIssueDate ?? null,
      onecId: updatedUser.onecId ?? null,
      medcardNumber: updatedUser.medcardNumber ?? null,
      gender: updatedUser.gender ?? null,
    },
  });
  setAuthCookie(response, {
    id: updatedUser.id,
    phone: updatedUser.phone,
    fullName: updatedUser.fullName ?? null,
    birthDate: updatedUser.birthDate ?? null,
    email: updatedUser.email ?? null,
    passportSeries: updatedUser.passportSeries ?? null,
    passportNumber: updatedUser.passportNumber ?? null,
    passportIssuedBy: updatedUser.passportIssuedBy ?? null,
    passportIssueDate: updatedUser.passportIssueDate ?? null,
    onecId: updatedUser.onecId ?? null,
    medcardNumber: updatedUser.medcardNumber ?? null,
    gender: updatedUser.gender ?? null,
  });
  return response;
}
