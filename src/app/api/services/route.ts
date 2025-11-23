import { NextResponse } from "next/server";
import { fetchOnecServicesDirectory } from "@/server/onecAuthClient";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  try {
    const data = await fetchOnecServicesDirectory(id ? { id } : undefined);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch services from 1C", error);
    return NextResponse.json(
      { error: "Не удалось загрузить услуги" },
      { status: 502 },
    );
  }
}
