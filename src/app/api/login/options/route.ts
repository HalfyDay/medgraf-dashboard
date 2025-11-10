import { NextResponse } from "next/server";

const OPTIONS = {
  methods: [
    {
      id: "password",
      label: "Вход по паролю",
      description: "Стандартный логин с номером телефона и паролем.",
    },
    {
      id: "otp",
      label: "Одноразовый код",
      description: "Получите одноразовый код в SMS, если забыли пароль.",
    },
  ],
  passkey: {
    supported: false,
  },
  rateLimit: {
    windowSeconds: 60,
    maxAttempts: 5,
  },
};

export async function GET() {
  return NextResponse.json(OPTIONS, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
