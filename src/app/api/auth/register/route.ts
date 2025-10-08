import { NextResponse } from "next/server";
import db from "@/utils/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { phone, password, fullName, birthDate, email } = await req.json();

  if (!phone || !password || !fullName || !birthDate || !email) {
    return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO users (phone, password, fullName, birthDate, email) VALUES (?, ?, ?, ?, ?)`,
      [phone, hash, fullName, birthDate, email],
      function (err) {
        if (err) {
          return resolve(
            NextResponse.json({ error: "Пользователь уже существует" }, { status: 400 })
          );
        }
        resolve(NextResponse.json({ success: true, id: this.lastID }));
      }
    );
  });
}
