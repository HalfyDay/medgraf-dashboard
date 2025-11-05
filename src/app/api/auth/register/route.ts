import { NextResponse } from "next/server";
import db from "@/utils/db";
import bcrypt from "bcrypt";
import { normalizePhone } from "@/utils/phone";

type RegisterPayload = {
  phone: string;
  password: string;
  fullName: string;
  birthDate: string;
  email?: string;
  passportLastDigits: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as RegisterPayload;
  const { phone, password, fullName, birthDate, email, passportLastDigits } = body;

  if (!phone || !password || !fullName || !birthDate || !passportLastDigits) {
    return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
  }

  if (passportLastDigits.replace(/\D/g, "").length !== 3) {
    return NextResponse.json({ error: "Нужны только последние 3 цифры паспорта" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const normalizedPhone = normalizePhone(phone);

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
          passportIssuedBy
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        normalizedPhone,
        hash,
        fullName,
        birthDate,
        email ?? null,
        null,
        passportLastDigits,
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
          resolve(NextResponse.json({ error: "Не удалось завершить регистрацию" }, { status: 500 }));
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
              passportIssuedBy
            FROM users WHERE id = ?
          `,
          [this.lastID],
          (selectErr, row) => {
            if (selectErr || !row) {
              resolve(NextResponse.json({ error: "Не удалось подтвердить регистрацию" }, { status: 500 }));
              return;
            }

            resolve(
              NextResponse.json({
                success: true,
                user: {
                  id: row.id,
                  phone: row.phone,
                  fullName: row.fullName,
                  birthDate: row.birthDate,
                  email: row.email,
                  passportSeries: row.passportSeries,
                  passportNumber: row.passportNumber,
                  passportIssueDate: row.passportIssueDate,
                  passportIssuedBy: row.passportIssuedBy,
                },
              }),
            );
          },
        );
      },
    );
  });
}
