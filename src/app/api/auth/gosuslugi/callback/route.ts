import { NextRequest, NextResponse } from "next/server";
import {
  decodeOauthSession,
  fetchGosuslugiProfile,
  GOSUSLUGI_COOKIE_NAME,
  isGosuslugiMockMode,
} from "@/server/gosuslugiAuth";
import { ensureUserFromGosuslugi } from "@/server/authUser";
import { buildErrorPage, buildLocalStorageLoginResponse } from "@/server/authResponse";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return buildErrorPage("Параметры ответа Госуслуг некорректны.", 400);
  }

  const cookieValue = req.cookies.get(GOSUSLUGI_COOKIE_NAME)?.value;
  const session = decodeOauthSession(cookieValue);

  if (!session || session.state !== state) {
    return buildErrorPage("Сессия авторизации истекла. Попробуйте войти снова.", 400);
  }

  try {
    const profile = await fetchGosuslugiProfile(code, session.codeVerifier, session.redirectUri);
    const user = await ensureUserFromGosuslugi(profile);
    const response = buildLocalStorageLoginResponse(user);
    response.cookies.set(GOSUSLUGI_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Госуслуги: ошибка завершения входа:", error);
    return buildErrorPage("Не удалось завершить вход через Госуслуги. Попробуйте позже.", 502);
  }
}

