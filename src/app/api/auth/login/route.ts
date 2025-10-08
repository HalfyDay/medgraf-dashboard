import { NextResponse } from "next/server";
import db from "@/utils/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { phone, password } = await req.json();
  if (!phone || !password) {
    return NextResponse.json({ error: "Не указан телефон или пароль" }, { status: 400 });
  }

  return new Promise((resolve) => {
    db.get(
      `SELECT * FROM users WHERE phone = ?`,
      [phone],
      async (err, row) => {
        if (err || !row) {
          return resolve(
            NextResponse.json({ error: "Неправильные данные" }, { status: 401 })
          );
        }
        const match = await bcrypt.compare(password, row.password);
        if (!match) {
          return resolve(
            NextResponse.json({ error: "Неправильные данные" }, { status: 401 })
          );
        }
        // В реальном приложении здесь бы выдали JWT или сессию
        resolve(NextResponse.json({ success: true, user: { id: row.id, phone: row.phone } }));
      }
    );
  });
}
