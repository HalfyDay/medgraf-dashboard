import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizationUrl,
  buildRedirectUri,
  createPkcePair,
  encodeOauthSession,
  fetchGosuslugiProfile,
  GOSUSLUGI_COOKIE_NAME,
  isGosuslugiMockMode,
} from "@/server/gosuslugiAuth";
import { ensureUserFromGosuslugi } from "@/server/authUser";
import { buildLocalStorageLoginResponse, buildErrorPage } from "@/server/authResponse";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const redirectUri = buildRedirectUri(origin);

  if (isGosuslugiMockMode()) {
    try {
      const profile = await fetchGosuslugiProfile("mock-code", "mock-verifier", redirectUri);
      const user = await ensureUserFromGosuslugi(profile);
      return buildLocalStorageLoginResponse(user);
    } catch (error) {
      console.error("Госуслуги (mock) ошибка входа:", error);
      return buildErrorPage("Не удалось выполнить вход в тестовом режиме", 500);
    }
  }

  try {
    const state = crypto.randomBytes(16).toString("hex");
    const { codeVerifier, codeChallenge } = createPkcePair();
    const authUrl = buildAuthorizationUrl({ redirectUri, state, codeChallenge });
    const response = NextResponse.redirect(authUrl, { status: 307 });
    response.cookies.set(GOSUSLUGI_COOKIE_NAME, encodeOauthSession({ state, codeVerifier, redirectUri }), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    console.error("Госуслуги: не удалось подготовить редирект:", error);
    return buildErrorPage("Интеграция с Госуслугами недоступна. Повторите попытку позже.", 500);
  }
}

