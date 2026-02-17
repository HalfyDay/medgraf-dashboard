import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/server/authCookie";
import { fetchOnecAuthUserMatches, OnecLogicalError, type OnecPerson } from "@/server/onecAuthClient";

function normalizeId(value?: string | null) {
  const trimmed = value?.toString().trim();
  return trimmed ? trimmed : null;
}

function pickMatch(matches: OnecPerson[], onecId?: string | null) {
  const targetId = normalizeId(onecId);
  if (targetId) {
    return matches.find((entry) => {
      const entryId = normalizeId(entry.id);
      const entryCode = normalizeId(entry.code);
      return entryId === targetId || entryCode === targetId;
    });
  }
  if (matches.length === 1) {
    return matches[0];
  }
  return undefined;
}

function toLastDigits(docNum?: string | null) {
  const digits = (docNum ?? "").replace(/\D/g, "").slice(-3);
  return digits.length === 3 ? digits : null;
}

export async function GET(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const matches = await fetchOnecAuthUserMatches(auth.phone);
    const match = pickMatch(matches, auth.onecId);
    return NextResponse.json({
      passportLastDigits: toLastDigits(match?.docNum),
    });
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return NextResponse.json({ passportLastDigits: null });
    }
    const message = error instanceof Error ? error.message : "1C is temporarily unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

