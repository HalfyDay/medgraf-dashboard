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
import { setAuthCookie } from "@/server/authCookie";
import { getUserByPhone, updateUserById } from "@/server/userStore";

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
  const { sessionId, password } = (await req.json()) as { sessionId?: string; password?: string };

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
    console.error("Failed to read reset session:", error);
    return NextResponse.json({ error: "Failed to verify reset session" }, { status: 500 });
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
    return fail("Session expired, request a new code", 410);
  }

  if (session.purpose !== "reset") {
    return fail("Session is not valid for password reset", 400);
  }

  if (!session.otpVerified) {
    return fail("Confirm SMS code first", 400);
  }

  let user;
  try {
    user = await getUserByPhone(session.phone);
  } catch (error) {
    console.error("Failed to find user by phone:", error);
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }

  if (!user) {
    return fail("User not found", 404);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await updateUserById(user.id, { password: passwordHash });
  } catch (error) {
    console.error("Failed to save new password:", error);
    return NextResponse.json({ error: "Failed to save password" }, { status: 500 });
  }

  try {
    await deleteLoginSession(sessionId);
  } catch (error) {
    console.warn("Failed to delete reset session:", error);
  }

  await registerSuccess(targets);

  const updatedUser = { ...user, password: passwordHash };

  const response = NextResponse.json({
    success: true,
    user: {
      id: updatedUser.id,
      phone: updatedUser.phone,
      fullName: updatedUser.fullName ?? null,
      birthDate: updatedUser.birthDate ?? null,
      email: updatedUser.email ?? null,
      passportSeries: null,
      passportNumber: null,
      passportIssuedBy: null,
      passportIssueDate: null,
      onecId: updatedUser.onecId ?? null,
      medcardNumber: updatedUser.medcardNumber ?? null,
      gender: updatedUser.gender ?? null,
    },
  });
  setAuthCookie(response, {
    id: updatedUser.id,
    phone: updatedUser.phone,
    fullName: updatedUser.fullName ?? null,
    birthDate: updatedUser.birthDate ?? null,
    email: updatedUser.email ?? null,
    passportSeries: null,
    passportNumber: null,
    passportIssuedBy: null,
    passportIssueDate: null,
    onecId: updatedUser.onecId ?? null,
    medcardNumber: updatedUser.medcardNumber ?? null,
    gender: updatedUser.gender ?? null,
  });
  return response;
}
