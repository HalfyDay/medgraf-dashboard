import { NextResponse } from "next/server";
import { fetchOnecAuthUserMatches } from "@/server/onecAuthClient";
import { setAuthCookie } from "@/server/authCookie";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: string;
    memberId?: string;
    userId?: number;
  };

  const userId = typeof body.userId === "number" ? body.userId : Number(body.userId);

  if (!body.phone || !body.memberId || !Number.isFinite(userId)) {
    return buildError("Не указаны параметры для смены аккаунта", 400);
  }

  try {
    const matches = await fetchOnecAuthUserMatches(body.phone);
    const match = matches.find((item) => item.id === body.memberId || item.code === body.memberId);
    if (!match) {
      return buildError("Родственник не найден", 404);
    }

    const user = {
      id: userId,
      phone: body.phone,
      fullName: match.fullName ?? null,
      birthDate: match.birthDate ?? null,
      gender: match.gender ?? null,
      medcardNumber: match.medcardNumber ?? null,
      email: match.email ?? null,
      onecId: match.id ?? match.code ?? null,
    };

    const response = NextResponse.json({
      success: true,
      user,
    });
    setAuthCookie(response, user);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сменить аккаунт";
    return buildError(message, 502);
  }
}
