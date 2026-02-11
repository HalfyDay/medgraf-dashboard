import { NextResponse } from "next/server";
import { fetchOnecContracts, OnecLogicalError } from "@/server/onecAuthClient";
import { getAuthFromRequest } from "@/server/authCookie";

type ContractItem = {
  uid: string;
  title: string;
  date: string;
  downloadUrl: string;
};

function sanitizeText(value: string | null | undefined, fallback: string) {
  const text = value?.toString().trim();
  return text && text.length > 0 ? text : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const patientId = url.searchParams.get("patientId")?.trim() || undefined;
  const auth = getAuthFromRequest(req);

  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!patientId) {
    return NextResponse.json({ error: "Не указан id пациента" }, { status: 400 });
  }
  if (!auth.onecId || auth.onecId !== patientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawContracts = await fetchOnecContracts(patientId);
    const contracts: ContractItem[] = rawContracts
      .filter((item) => item.UID && item.UID.toString().trim().length > 0)
      .map((item) => {
        const uid = item.UID?.toString().trim() || "";
        const title = sanitizeText(item.Type, uid);
        const date = sanitizeText(item.Date, "");
        const encodedTitle = encodeURIComponent(title);
        return {
          uid,
          title,
          date,
          downloadUrl: `/api/contracts/${encodeURIComponent(uid)}?patientId=${encodeURIComponent(patientId)}&filename=${encodedTitle}`,
        };
      });

    return NextResponse.json({ contracts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось получить список договоров";
    const status = error instanceof OnecLogicalError && error.code === "2" ? 200 : 502;
    return NextResponse.json({ contracts: [], error: message }, { status });
  }
}
