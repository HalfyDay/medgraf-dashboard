import { NextResponse } from "next/server";
import { fetchOnecDoctorsDirectory } from "@/server/onecAuthClient";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  try {
    const data = await fetchOnecDoctorsDirectory(id ? { id } : undefined);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Failed to fetch doctors from 1C", error);
    return NextResponse.json(
      { error: "Не удалось загрузить список врачей" },
      { status: 502 },
    );
  }
}
