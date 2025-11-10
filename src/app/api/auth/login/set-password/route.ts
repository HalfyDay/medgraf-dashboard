import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  deleteLoginSession,
  getLoginSession,
} from "@/server/loginSessionStore";
import {
  extractUserFields,
  fetchOnecUserProfile,
  OnecLogicalError,
} from "@/server/onecAuthClient";
import { getUserByPhone, insertUser, updateUserById } from "@/server/userStore";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const { sessionId, password } = (await req.json()) as {
    sessionId?: string;
    password?: string;
  };

  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "Отсутствует идентификатор сессии" }, { status: 400 });
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Пароль должен содержать не менее ${MIN_PASSWORD_LENGTH} символов` },
      { status: 400 },
    );
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Не удалось получить сессию входа:", error);
    return NextResponse.json({ error: "Не удалось завершить настройку пароля" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  if (session.expiresAt < Date.now()) {
    return NextResponse.json({ error: "Сессия устарела, начните заново" }, { status: 410 });
  }

  if (!session.docVerified || !session.otpVerified) {
    return NextResponse.json({ error: "Подтвердите документ и код из SMS" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let existingUser = null;
  try {
    existingUser = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Не удалось проверить локального пользователя:", error);
    return NextResponse.json({ error: "Не удалось сохранить пароль" }, { status: 500 });
  }

  let profileFields = {
    fullName: session.remoteFullName ?? null,
    birthDate: session.remoteBirthDate ?? null,
    gender: session.remoteGender ?? null,
    medcardNumber: session.remoteMedcard ?? null,
    email: null as string | null,
  };

  if (session.docLastDigits) {
    try {
      const profile = await fetchOnecUserProfile(session.phone, session.docLastDigits);
      const fields = extractUserFields(profile);
      profileFields = {
        fullName: fields.fullName ?? profileFields.fullName,
        birthDate: fields.birthDate ?? profileFields.birthDate,
        gender: fields.gender ?? profileFields.gender,
        medcardNumber: fields.medcardNumber ?? profileFields.medcardNumber,
        email: fields.email ?? profileFields.email,
      };
    } catch (error) {
      if (error instanceof OnecLogicalError && error.code === "2") {
        console.warn("Карта в 1С не найдена при сохранении пароля");
      } else {
        console.warn("Не удалось обновить данные из 1С при сохранении пароля:", error);
      }
    }
  }

  const profileUpdates = {
    password: passwordHash,
    fullName: profileFields.fullName ?? null,
    birthDate: profileFields.birthDate ?? null,
    gender: profileFields.gender ?? null,
    medcardNumber: profileFields.medcardNumber ?? null,
    onecId: session.remoteCode ?? null,
    passportNumber: session.docLastDigits ?? null,
    email: profileFields.email ?? null,
  };

  try {
    if (existingUser) {
      await updateUserById(existingUser.id, profileUpdates);
    } else {
      await insertUser({
        phone: session.phone,
        ...profileUpdates,
      });
    }
  } catch (error) {
    console.error("Не удалось сохранить данные пользователя:", error);
    return NextResponse.json({ error: "Не удалось сохранить пароль" }, { status: 500 });
  }

  let freshUser;
  try {
    freshUser = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Не удалось перечитать данные пользователя:", error);
    return NextResponse.json({ error: "Не удалось завершить настройку пароля" }, { status: 500 });
  }

  if (!freshUser) {
    return NextResponse.json({ error: "Пользователь не найден после сохранения" }, { status: 500 });
  }

  try {
    await deleteLoginSession(sessionId);
  } catch (error) {
    console.warn("Не удалось удалить сессию входа:", error);
  }

  return NextResponse.json({
    success: true,
    user: freshUser,
  });
}
