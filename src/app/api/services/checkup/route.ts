import { NextResponse } from "next/server";
import { fetchOnecCheckups, OnecLogicalError, OnecRequestError } from "@/server/onecAuthClient";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id")?.trim() || undefined;

  try {
    const checkups = await fetchOnecCheckups({ id });
    return NextResponse.json({ checkups });
  } catch (error) {
    let message = "Failed to load checkups";
    if (error instanceof OnecRequestError) {
      message = `Ошибка 1С: ${error.status} ${error.body || error.message}`;
    } else if (error instanceof OnecLogicalError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }
    console.error("[api/services/checkup] failed", error);
    return buildError(message, 502);
  }
}
