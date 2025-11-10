import { NextResponse } from "next/server";
import type { AuthUser } from "@/providers/AuthProvider";
import { AUTH_STORAGE_KEY } from "@/constants/auth";

export function buildLocalStorageLoginResponse(user: AuthUser, redirectTo = "/home") {
  const payload = JSON.stringify(user).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Вход через Госуслуги</title>
  </head>
  <body style="font-family: sans-serif; background: #f5f7fb; margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh;">
    <div style="background:#fff; padding:32px; border-radius:24px; box-shadow:0 15px 45px rgba(15,143,233,0.18); text-align:center;">
      <p style="margin:0 0 12px; font-size:18px; color:#16345A;">Выполняем вход через Госуслуги…</p>
      <p style="margin:0; color:#5A719B; font-size:14px;">Если окно не закрылось автоматически, перезапустите процесс.</p>
    </div>
    <script>
      try {
        const user = ${payload};
        const storageKey = ${JSON.stringify(AUTH_STORAGE_KEY)};
        window.localStorage.setItem(storageKey, JSON.stringify(user));
        window.location.replace(${JSON.stringify(redirectTo)});
      } catch (error) {
        console.error(error);
        document.body.innerHTML = '<div style="padding:32px; max-width:420px; margin:0 auto; font-family:sans-serif;">Не удалось завершить вход. Закройте окно и попробуйте снова.</div>';
      }
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function buildErrorPage(message: string, status = 400) {
  const html = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Ошибка входа</title>
  </head>
  <body style="font-family: sans-serif; background:#fff; color:#16345A; padding:48px;">
    <h1 style="font-size:22px; margin-bottom:16px;">Не удалось войти</h1>
    <p style="font-size:16px;">${message}</p>
    <p style="color:#5A719B; font-size:14px;">Закройте окно и попробуйте еще раз.</p>
  </body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

