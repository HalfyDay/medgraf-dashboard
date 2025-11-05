import { NextResponse } from "next/server";
import db from "@/utils/db";
import bcrypt from "bcrypt";
import { normalizePhone } from "@/utils/phone";

export async function POST(req: Request) {
  const { phone, password } = await req.json();
  if (!phone || !password) {
    return NextResponse.json({ error: "Не передан номер телефона или пароль" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);

  return new Promise((resolve) => {
    db.get(
      `
        SELECT
          id,
          phone,
          password,
          fullName,
          birthDate,
          email,
          passportSeries,
          passportNumber,
          passportIssueDate,
          passportIssuedBy
        FROM users WHERE phone = ?
      `,
      [normalizedPhone],
      async (err, row) => {
        if (err || !row) {
          resolve(NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 }));
          return;
        }

        const match = await bcrypt.compare(password, row.password);
        if (!match) {
          resolve(NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 }));
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
  });
}
