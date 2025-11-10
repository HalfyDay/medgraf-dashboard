import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/utils/db";
import { normalizePhone } from "@/utils/phone";

type RegisterPayload = {
  phone: string;
  password: string;
  passportLastDigits: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterPayload;
  const { phone, password, passportLastDigits } = body;

  if (!phone || !password || !passportLastDigits) {
    return NextResponse.json(
      { error: "Укажите телефон, пароль и последние 3 цифры документа" },
      { status: 400 },
    );
  }

  const digits = passportLastDigits.replace(/\D/g, "").slice(-3);
  if (digits.length !== 3) {
    return NextResponse.json({ error: "Введите последние 3 цифры документа" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Некорректный номер телефона" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  return new Promise((resolve) => {
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
        digits,
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
            resolve(
              NextResponse.json(
                { error: "Пользователь с таким телефоном уже зарегистрирован" },
                { status: 409 },
              ),
            );
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

            resolve(
              NextResponse.json({
                success: true,
                user: row,
              }),
            );
          },
        );
      },
    );
  });
}
