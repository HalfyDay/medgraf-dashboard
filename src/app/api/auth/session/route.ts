import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/server/authCookie";

export async function GET(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.id,
      phone: auth.phone,
      onecId: auth.onecId ?? null,
    },
  });
}
