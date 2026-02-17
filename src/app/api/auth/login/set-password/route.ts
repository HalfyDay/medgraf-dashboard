import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { deleteLoginSession, getLoginSession } from "@/server/loginSessionStore";
import {
  buildLockMessage,
  checkBlocked,
  getClientIp,
  registerFailure,
  registerSuccess,
  type GuardTarget,
} from "@/server/authGuard";
import {
  extractUserFields,
  fetchOnecUserProfile,
  OnecLogicalError,
} from "@/server/onecAuthClient";
import { setAuthCookie } from "@/server/authCookie";
import { getUserByPhone, insertUser, updateUserById } from "@/server/userStore";

const MIN_PASSWORD_LENGTH = 8;

function lockError(retryAfterMs: number) {
  return NextResponse.json({ error: buildLockMessage(retryAfterMs) }, { status: 429 });
}

function buildTargets(ip: string, phone?: string | null): GuardTarget[] {
  const targets: GuardTarget[] = [{ scope: "password_change_ip", key: ip }];
  if (phone) {
    targets.push({ scope: "password_change_phone", key: phone });
  }
  return targets;
}

export async function POST(req: Request) {
  const { sessionId, password } = (await req.json()) as {
    sessionId?: string;
    password?: string;
  };

  const clientIp = getClientIp(req);
  const earlyTargets = buildTargets(clientIp);
  const earlyBlock = await checkBlocked(earlyTargets);
  if (earlyBlock.blocked) {
    return lockError(earlyBlock.retryAfterMs);
  }

  if (!sessionId || typeof sessionId !== "string") {
    const failed = await registerFailure(earlyTargets);
    if (failed.blocked) return lockError(failed.retryAfterMs);
    return NextResponse.json({ error: "Session id is required" }, { status: 400 });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    const failed = await registerFailure(earlyTargets);
    if (failed.blocked) return lockError(failed.retryAfterMs);
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
      { status: 400 },
    );
  }

  let session;
  try {
    session = await getLoginSession(sessionId);
  } catch (error) {
    console.error("Failed to read login session:", error);
    return NextResponse.json({ error: "Failed to complete password setup" }, { status: 500 });
  }

  const targets = buildTargets(clientIp, session?.phone ?? null);
  const blocked = await checkBlocked(targets);
  if (blocked.blocked) {
    return lockError(blocked.retryAfterMs);
  }

  const fail = async (error: string, status: number) => {
    const failureState = await registerFailure(targets);
    if (failureState.blocked) {
      return lockError(failureState.retryAfterMs);
    }
    return NextResponse.json({ error }, { status });
  };

  if (!session) {
    return fail("Session not found", 404);
  }

  if (session.expiresAt < Date.now()) {
    return fail("Session expired, start again", 410);
  }

  if (!session.docVerified || !session.otpVerified) {
    return fail("Confirm document and SMS code first", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let existingUser = null;
  try {
    existingUser = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Failed to load existing user:", error);
    return NextResponse.json({ error: "Failed to save password" }, { status: 500 });
  }

  let profileFields = {
    fullName: session.remoteFullName ?? null,
    birthDate: session.remoteBirthDate ?? null,
    gender: session.remoteGender ?? null,
    medcardNumber: session.remoteMedcard ?? null,
    email: null as string | null,
  };

  if (session.docLastDigits) {
    try {
      const profile = await fetchOnecUserProfile(session.phone, session.docLastDigits);
      const fields = extractUserFields(profile);
      profileFields = {
        fullName: fields.fullName ?? profileFields.fullName,
        birthDate: fields.birthDate ?? profileFields.birthDate,
        gender: fields.gender ?? profileFields.gender,
        medcardNumber: fields.medcardNumber ?? profileFields.medcardNumber,
        email: fields.email ?? profileFields.email,
      };
    } catch (error) {
      if (error instanceof OnecLogicalError && error.code === "2") {
        console.warn("1C medcard was not found while saving password");
      } else {
        console.warn("Failed to enrich profile from 1C while saving password:", error);
      }
    }
  }

  const profileUpdates = {
    password: passwordHash,
    fullName: profileFields.fullName ?? null,
    birthDate: profileFields.birthDate ?? null,
    gender: profileFields.gender ?? null,
    medcardNumber: profileFields.medcardNumber ?? null,
    onecId: session.remoteCode ?? null,
    passportNumber: null,
    email: profileFields.email ?? null,
  };

  try {
    if (existingUser) {
      await updateUserById(existingUser.id, profileUpdates);
    } else {
      await insertUser({
        phone: session.phone,
        ...profileUpdates,
      });
    }
  } catch (error) {
    console.error("Failed to save user profile while setting password:", error);
    return NextResponse.json({ error: "Failed to save password" }, { status: 500 });
  }

  let freshUser;
  try {
    freshUser = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Failed to re-read user after save:", error);
    return NextResponse.json({ error: "Failed to complete password setup" }, { status: 500 });
  }

  if (!freshUser) {
    return NextResponse.json({ error: "User not found after save" }, { status: 500 });
  }

  try {
    await deleteLoginSession(sessionId);
  } catch (error) {
    console.warn("Failed to delete login session:", error);
  }

  await registerSuccess(targets);

  const response = NextResponse.json({
    success: true,
    user: freshUser,
  });
  setAuthCookie(response, freshUser);
  return response;
}
