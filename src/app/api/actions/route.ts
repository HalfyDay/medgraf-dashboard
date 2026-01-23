import { NextResponse } from "next/server";

import iconv from "iconv-lite";
import { buildOnecAuthHeader } from "@/server/onecAuthClient";

const ACTIONS_URL =
  process.env.NEXT_PUBLIC_ACTIONS_URL ||
  process.env.ACTIONS_URL ||
  "http://ob75av-o5lx9s-319rsf-umcclient.medgraft.ru/hs/actions/action";

const ACTIONS_BEARER =
  process.env.ACTIONS_TOKEN ||
  process.env.NEXT_PUBLIC_ACTIONS_TOKEN ||
  process.env.NEXT_PUBLIC_ONEC_TOKEN;
const ACTIONS_BASIC_USER =
  process.env.ACTIONS_USER || process.env.ACTIONS_BASIC_USER || process.env.NEXT_PUBLIC_ACTIONS_USER;
const ACTIONS_BASIC_PASS =
  process.env.ACTIONS_PASS || process.env.ACTIONS_BASIC_PASS || process.env.NEXT_PUBLIC_ACTIONS_PASS;

export async function GET() {
  const endpoint = ACTIONS_URL;
  const envHeader =
    ACTIONS_BEARER && ACTIONS_BEARER.trim()
      ? `Bearer ${ACTIONS_BEARER.trim()}`
      : ACTIONS_BASIC_USER !== undefined
        ? `Basic ${Buffer.from(`${ACTIONS_BASIC_USER}:${ACTIONS_BASIC_PASS ?? ""}`).toString("base64")}`
        : null;
  const primaryAuth = envHeader || (await buildOnecAuthHeader("basic"));

  if (!envHeader) {
    console.warn("[api/actions] using auto 1C auth header (set ACTIONS_TOKEN or ACTIONS_USER/ACTIONS_PASS to override)");
  }

  console.log("[api/actions] -> request", {
    endpoint,
    auth: primaryAuth ? (primaryAuth.startsWith("Basic ") ? "basic" : "bearer") : "none",
  });

  try {
    const requestOnce = async (authorization?: string) => {
      return fetch(endpoint, {
        cache: "no-store",
        headers: authorization ? { Authorization: authorization } : undefined,
      });
    };

    const secondaryAuth =
      envHeader && envHeader.startsWith("Basic")
        ? await buildOnecAuthHeader("bearer")
        : await buildOnecAuthHeader("basic");

    let upstream = await requestOnce(primaryAuth ?? undefined);
    if ((upstream.status === 401 || upstream.status === 402) && secondaryAuth !== primaryAuth) {
      console.warn(`[api/actions] auth rejected (${upstream.status}), retrying with secondary auth`);
      upstream = await requestOnce(secondaryAuth);
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const utf8Text = buffer.toString("utf-8");
    const cp1251Text = iconv.decode(buffer, "win1251");

    const countCyr = (text: string) => (text.match(/[А-Яа-яЁё]/g) ?? []).length;
    const pickText = () => {
      const utfScore = countCyr(utf8Text);
      const cpScore = countCyr(cp1251Text);
      if (cpScore > utfScore) return cp1251Text;
      return utf8Text;
    };

    const tryParse = (text: string) => (text ? JSON.parse(text) : null);

    let payload: unknown;
    const chosen = pickText();

    try {
      payload = tryParse(chosen);
    } catch {
      try {
        payload = tryParse(cp1251Text);
      } catch {
        try {
          payload = tryParse(utf8Text);
        } catch {
          payload = chosen;
        }
      }
    }

    console.log("[api/actions] <- response", {
      status: upstream.status,
      ok: upstream.ok,
      payload,
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "upstream_error", status: upstream.status, payload },
        { status: upstream.status },
      );
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (error) {
    console.error("[api/actions] failed", error);
    return NextResponse.json(
      { error: "proxy_failed", message: (error as Error).message },
      { status: 500 },
    );
  }
}
