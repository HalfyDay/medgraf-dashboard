import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  fetchOnecAuthUserMatches,
  OnecLogicalError,
  type OnecPerson,
} from "@/server/onecAuthClient";
import {
  buildLockMessage,
  checkBlocked,
  getClientIp,
  registerFailure,
  registerSuccess,
  type GuardTarget,
} from "@/server/authGuard";
import { setAuthCookie } from "@/server/authCookie";
import { getUserByPhone, updateUserById, type DbUserRow } from "@/server/userStore";
import { normalizePhone } from "@/utils/phone";

function buildError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeOnecId(value?: string | null) {
  const trimmed = value?.toString().trim();
  return trimmed ? trimmed : null;
}

function resolveMatchOnecId(match: OnecPerson | undefined) {
  return normalizeOnecId(match?.id ?? match?.code ?? null);
}

export async function POST(req: Request) {
  const { phone, password } = (await req.json()) as { phone?: string; password?: string };

  if (!phone || !password) {
    return buildError("Specify phone and password", 400);
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return buildError("Enter full phone number", 401);
  }

  const guardTargets: GuardTarget[] = [
    { scope: "login_password_phone", key: normalizedPhone },
    { scope: "login_password_ip", key: getClientIp(req) },
  ];

  const blocked = await checkBlocked(guardTargets);
  if (blocked.blocked) {
    return buildError(buildLockMessage(blocked.retryAfterMs), 429);
  }

  const failAuth = async () => {
    const failureState = await registerFailure(guardTargets);
    if (failureState.blocked) {
      return buildError(buildLockMessage(failureState.retryAfterMs), 429);
    }
    return buildError("Invalid credentials", 401);
  };

  let userRow: DbUserRow | null = null;
  try {
    userRow = await getUserByPhone(normalizedPhone);
  } catch (error) {
    console.error("Failed to find user by phone:", error);
    return buildError("Failed to find user", 500);
  }

  if (!userRow) {
    return failAuth();
  }

  const match = await bcrypt.compare(password, userRow.password);
  if (!match) {
    return failAuth();
  }

  let matches: OnecPerson[];
  try {
    matches = await fetchOnecAuthUserMatches(normalizedPhone);
  } catch (error) {
    if (error instanceof OnecLogicalError && error.code === "2") {
      return buildError("Medcard in 1C was not found. Check phone data.", 404);
    }
    const message = error instanceof Error ? error.message : "1C is temporarily unavailable";
    return buildError(message, 502);
  }

  if (matches.length === 0) {
    return buildError("Medcard in 1C was not found. Check phone data.", 404);
  }

  const localOnecId = normalizeOnecId(userRow.onecId);
  let matchedProfile: OnecPerson | undefined;

  if (localOnecId) {
    matchedProfile = matches.find((entry) => {
      const entryId = normalizeOnecId(entry.id);
      const entryCode = normalizeOnecId(entry.code);
      return entryId === localOnecId || entryCode === localOnecId;
    });

    // Regular password login must validate phone + onecId pair.
    if (!matchedProfile) {
      return failAuth();
    }
  } else if (matches.length === 1) {
    matchedProfile = matches[0];
  } else {
    return buildError("Account is not linked to a unique 1C profile", 409);
  }

  const remoteOnecId = resolveMatchOnecId(matchedProfile) ?? localOnecId;
  if (!remoteOnecId) {
    return buildError("1C profile id is missing", 502);
  }

  const remoteFullName = matchedProfile?.fullName ?? userRow.fullName ?? null;
  const remoteBirthDate = matchedProfile?.birthDate ?? userRow.birthDate ?? null;
  const remoteGender = matchedProfile?.gender ?? userRow.gender ?? null;
  const remoteMedcard = matchedProfile?.medcardNumber ?? userRow.medcardNumber ?? null;
  const remoteEmail = matchedProfile?.email ?? userRow.email ?? null;

  try {
    await updateUserById(userRow.id, {
      fullName: remoteFullName ?? undefined,
      birthDate: remoteBirthDate ?? undefined,
      gender: remoteGender ?? undefined,
      medcardNumber: remoteMedcard ?? undefined,
      onecId: remoteOnecId ?? undefined,
      email: remoteEmail ?? undefined,
    });
  } catch (error) {
    console.error("Failed to update local user profile:", error);
  }

  const user = {
    id: userRow.id,
    phone: userRow.phone,
    fullName: remoteFullName,
    birthDate: remoteBirthDate,
    email: remoteEmail,
    passportSeries: null,
    passportNumber: null,
    passportIssueDate: null,
    passportIssuedBy: null,
    onecId: remoteOnecId,
    medcardNumber: remoteMedcard,
    gender: remoteGender,
  };

  await registerSuccess(guardTargets);

  const response = NextResponse.json({
    success: true,
    user,
  });
  setAuthCookie(response, user);
  return response;
}
