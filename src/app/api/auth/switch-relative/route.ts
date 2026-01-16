import { NextResponse } from "next/server";
import { fetchOnecAuthUserMatches } from "@/server/onecAuthClient";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: string;
    memberId?: string;
  };

  if (!body.phone || !body.memberId) {
    return buildError("Не указаны параметры для смены аккаунта", 400);
  }

  try {
    const matches = await fetchOnecAuthUserMatches(body.phone);
    const match = matches.find((item) => item.id === body.memberId || item.code === body.memberId);
    if (!match) {
      return buildError("Родственник не найден", 404);
    }

    return NextResponse.json({
      success: true,
      user: {
        fullName: match.fullName ?? null,
        birthDate: match.birthDate ?? null,
        gender: match.gender ?? null,
        medcardNumber: match.medcardNumber ?? null,
        email: match.email ?? null,
        passportNumber: match.docNum ? match.docNum.slice(-3) : null,
        onecId: match.id ?? match.code ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сменить аккаунт";
    return buildError(message, 502);
  }
}
