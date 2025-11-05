import { NextResponse } from "next/server";
import db from "@/utils/db";
import { normalizePhone } from "@/utils/phone";

export async function POST(req: Request) {
  const { phone } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: "Не передан номер телефона" }, { status: 400 });
  }

  const normalized = normalizePhone(phone);

  return new Promise((resolve) => {
    db.get(`SELECT id FROM users WHERE phone = ?`, [normalized], (err, row) => {
      if (err) {
        resolve(NextResponse.json({ error: "Не удалось проверить номер" }, { status: 500 }));
        return;
      }

      resolve(NextResponse.json({ exists: Boolean(row) }));
    });
  });
}
