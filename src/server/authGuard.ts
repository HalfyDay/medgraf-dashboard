import db from "@/utils/db";

export type GuardScope =
  | "password_change_phone"
  | "password_change_ip"
  | "login_password_phone"
  | "login_password_ip";

export type GuardTarget = {
  scope: GuardScope;
  key: string;
};

type GuardRow = {
  scope: GuardScope;
  key: string;
  failures: number;
  lockUntil: number;
  lockLevel: number;
};

type GuardPolicy = {
  threshold: number;
  baseLockMs: number;
  maxLockMs: number;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

const POLICIES: Record<GuardScope, GuardPolicy> = {
  // 5 failed attempts -> 30 min lock. Then 60, 120, ... up to 24h.
  password_change_phone: { threshold: 5, baseLockMs: 30 * MINUTE_MS, maxLockMs: 24 * HOUR_MS },
  // IP fallback for cases where phone is not yet available.
  password_change_ip: { threshold: 8, baseLockMs: 20 * MINUTE_MS, maxLockMs: 24 * HOUR_MS },
  // Password login brute force protection.
  login_password_phone: { threshold: 7, baseLockMs: 15 * MINUTE_MS, maxLockMs: 24 * HOUR_MS },
  login_password_ip: { threshold: 25, baseLockMs: 10 * MINUTE_MS, maxLockMs: 24 * HOUR_MS },
};

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

function getRow(scope: GuardScope, key: string) {
  return new Promise<GuardRow | null>((resolve, reject) => {
    db.get(
      `
        SELECT scope, key, failures, lockUntil, lockLevel
        FROM auth_guard
        WHERE scope = ? AND key = ?
      `,
      [scope, key],
      (err, row: GuardRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ?? null);
      },
    );
  });
}

function upsertRow(row: GuardRow) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `
        INSERT INTO auth_guard (scope, key, failures, lockUntil, lockLevel, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(scope, key) DO UPDATE SET
          failures = excluded.failures,
          lockUntil = excluded.lockUntil,
          lockLevel = excluded.lockLevel,
          updatedAt = excluded.updatedAt
      `,
      [row.scope, row.key, row.failures, row.lockUntil, row.lockLevel, Date.now()],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      },
    );
  });
}

function clearRow(scope: GuardScope, key: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(`DELETE FROM auth_guard WHERE scope = ? AND key = ?`, [scope, key], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

async function checkOne(target: GuardTarget) {
  const row = await getRow(target.scope, target.key);
  if (!row) {
    return { blocked: false as const, retryAfterMs: 0 };
  }
  const retryAfterMs = row.lockUntil - Date.now();
  if (retryAfterMs > 0) {
    return { blocked: true as const, retryAfterMs };
  }
  return { blocked: false as const, retryAfterMs: 0 };
}

async function failOne(target: GuardTarget) {
  const policy = POLICIES[target.scope];
  const current = await getRow(target.scope, target.key);
  const now = Date.now();

  if (current && current.lockUntil > now) {
    return { blocked: true as const, retryAfterMs: current.lockUntil - now };
  }

  const nextFailures = (current?.failures ?? 0) + 1;
  const currentLockLevel = current?.lockLevel ?? 0;

  if (nextFailures < policy.threshold) {
    await upsertRow({
      scope: target.scope,
      key: target.key,
      failures: nextFailures,
      lockUntil: 0,
      lockLevel: currentLockLevel,
    });
    return { blocked: false as const, retryAfterMs: 0 };
  }

  const nextLockLevel = currentLockLevel + 1;
  const lockMs = Math.min(policy.baseLockMs * 2 ** (nextLockLevel - 1), policy.maxLockMs);
  const lockUntil = now + lockMs;

  await upsertRow({
    scope: target.scope,
    key: target.key,
    failures: 0,
    lockUntil,
    lockLevel: nextLockLevel,
  });

  return { blocked: true as const, retryAfterMs: lockMs };
}

export async function checkBlocked(targets: GuardTarget[]) {
  let maxRetryAfterMs = 0;
  for (const target of targets) {
    const state = await checkOne(target);
    if (state.blocked && state.retryAfterMs > maxRetryAfterMs) {
      maxRetryAfterMs = state.retryAfterMs;
    }
  }
  return { blocked: maxRetryAfterMs > 0, retryAfterMs: maxRetryAfterMs };
}

export async function registerFailure(targets: GuardTarget[]) {
  let maxRetryAfterMs = 0;
  for (const target of targets) {
    const state = await failOne(target);
    if (state.blocked && state.retryAfterMs > maxRetryAfterMs) {
      maxRetryAfterMs = state.retryAfterMs;
    }
  }
  return { blocked: maxRetryAfterMs > 0, retryAfterMs: maxRetryAfterMs };
}

export async function registerSuccess(targets: GuardTarget[]) {
  await Promise.all(targets.map((target) => clearRow(target.scope, target.key)));
}

export function buildLockMessage(retryAfterMs: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / MINUTE_MS));
  return `Too many failed attempts. Try again in ${minutes} min.`;
}

