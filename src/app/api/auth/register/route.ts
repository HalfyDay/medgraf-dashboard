import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/utils/db";
import { normalizePhone } from "@/utils/phone";
import { setAuthCookie } from "@/server/authCookie";
import type { AuthUser } from "@/providers/AuthProvider";

type RegisterPayload = {
  phone: string;
  password: string;
  passportLastDigits?: string;
};

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as RegisterPayload;
  const { phone, password } = body;

  if (!phone || !password) {
    return NextResponse.json({ error: "Укажите телефон и пароль" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Некорректный номер телефона" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  return new Promise<NextResponse>((resolve) => {
    db.run(
      `
        INSERT INTO users (
          phone,
          password,
          fullName,
          birthDate,
          email,
          passportSeries,
          passportNumber,
          passportIssueDate,
          passportIssuedBy,
          onecId,
          medcardNumber,
          gender
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedPhone,
        hash,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ],
      function (err) {
        if (err) {
          const message = err.message ?? "";
          if (message.includes("UNIQUE constraint failed") || message.includes("UNIQUE constraint")) {
            resolve(NextResponse.json({ error: "Пользователь с таким телефоном уже зарегистрирован" }, { status: 409 }));
            return;
          }
          resolve(NextResponse.json({ error: "Не удалось создать пользователя" }, { status: 500 }));
          return;
        }

        db.get(
          `
            SELECT
              id,
              phone,
              fullName,
              birthDate,
              email,
              passportSeries,
              passportNumber,
              passportIssueDate,
              passportIssuedBy,
              onecId,
              medcardNumber,
              gender
            FROM users WHERE id = ?
          `,
          [this.lastID],
          (selectErr, row) => {
            if (selectErr || !row) {
              resolve(NextResponse.json({ error: "Не удалось получить данные пользователя" }, { status: 500 }));
              return;
            }

            const user = row as AuthUser;
            const response = NextResponse.json({
              success: true,
              user,
            });
            setAuthCookie(response, user);
            resolve(response);
          },
        );
      },
    );
  });
}
