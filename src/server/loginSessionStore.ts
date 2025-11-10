import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import db from "@/utils/db";

export type RemoteProfileSnapshot = {
  code?: string | null;
  fullName?: string | null;
  birthDate?: string | null;
  medcardNumber?: string | null;
  gender?: string | null;
};

export type LoginSession = {
  sessionId: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  docVerified: boolean;
  otpVerified: boolean;
  otpCodeHash?: string | null;
  otpExpiresAt?: number | null;
  otpAttemptsLeft: number;
  remoteCode?: string | null;
  remoteFullName?: string | null;
  remoteBirthDate?: string | null;
  remoteGender?: string | null;
  remoteMedcard?: string | null;
  docLastDigits?: string | null;
};

type LoginSessionRow = {
  sessionId: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  docVerified: number;
  otpVerified: number;
  otpCodeHash?: string | null;
  otpExpiresAt?: number | null;
  otpAttemptsLeft?: number | null;
  remoteCode?: string | null;
  remoteFullName?: string | null;
  remoteBirthDate?: string | null;
  remoteGender?: string | null;
  remoteMedcard?: string | null;
  docLastDigits?: string | null;
};

export const SESSION_TTL_MS = 15 * 60 * 1000;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
const OTP_CODE_LENGTH = 4;

function mapRow(row: LoginSessionRow): LoginSession {
  return {
    sessionId: row.sessionId,
    phone: row.phone,
    createdAt: Number(row.createdAt),
    expiresAt: Number(row.expiresAt),
    docVerified: Boolean(row.docVerified),
    otpVerified: Boolean(row.otpVerified),
    otpCodeHash: row.otpCodeHash ?? null,
    otpExpiresAt: row.otpExpiresAt ? Number(row.otpExpiresAt) : null,
    otpAttemptsLeft: typeof row.otpAttemptsLeft === "number" ? row.otpAttemptsLeft : 0,
    remoteCode: row.remoteCode ?? null,
    remoteFullName: row.remoteFullName ?? null,
    remoteBirthDate: row.remoteBirthDate ?? null,
    remoteGender: row.remoteGender ?? null,
    remoteMedcard: row.remoteMedcard ?? null,
    docLastDigits: row.docLastDigits ?? null,
  };
}

export function createLoginSession(phone: string, remote: RemoteProfileSnapshot) {
  const sessionId = randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + SESSION_TTL_MS;

  return new Promise<LoginSession>((resolve, reject) => {
    db.run(`DELETE FROM login_sessions WHERE phone = ?`, [phone], (deleteErr) => {
      if (deleteErr) {
        reject(deleteErr);
        return;
      }

      db.run(
        `
          INSERT INTO login_sessions (
            sessionId,
            phone,
            createdAt,
            expiresAt,
            remoteCode,
            remoteFullName,
            remoteBirthDate,
            remoteGender,
            remoteMedcard
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          sessionId,
          phone,
          createdAt,
          expiresAt,
          remote.code ?? null,
          remote.fullName ?? null,
          remote.birthDate ?? null,
          remote.gender ?? null,
          remote.medcardNumber ?? null,
        ],
        (insertErr) => {
          if (insertErr) {
            reject(insertErr);
            return;
          }

          resolve({
            sessionId,
            phone,
            createdAt,
            expiresAt,
            docVerified: false,
            otpVerified: false,
            otpAttemptsLeft: 0,
            remoteCode: remote.code ?? null,
            remoteFullName: remote.fullName ?? null,
            remoteBirthDate: remote.birthDate ?? null,
            remoteGender: remote.gender ?? null,
            remoteMedcard: remote.medcardNumber ?? null,
            docLastDigits: null,
          });
        },
      );
    });
  });
}

export function getLoginSession(sessionId: string) {
  return new Promise<LoginSession | null>((resolve, reject) => {
    db.get(
      `
        SELECT
          sessionId,
          phone,
          createdAt,
          expiresAt,
          docVerified,
          otpVerified,
          otpCodeHash,
          otpExpiresAt,
          otpAttemptsLeft,
          remoteCode,
          remoteFullName,
          remoteBirthDate,
          remoteGender,
          remoteMedcard,
          docLastDigits
        FROM login_sessions
        WHERE sessionId = ?
      `,
      [sessionId],
      (err, row: LoginSessionRow | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ? mapRow(row) : null);
      },
    );
  });
}

export function updateSessionDocData(
  sessionId: string,
  remote: RemoteProfileSnapshot & { docDigits: string },
) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `
        UPDATE login_sessions
        SET
          docVerified = 1,
          docLastDigits = ?,
          remoteCode = COALESCE(?, remoteCode),
          remoteFullName = COALESCE(?, remoteFullName),
          remoteBirthDate = COALESCE(?, remoteBirthDate),
          remoteGender = COALESCE(?, remoteGender),
          remoteMedcard = COALESCE(?, remoteMedcard)
        WHERE sessionId = ?
      `,
      [
        remote.docDigits,
        remote.code ?? null,
        remote.fullName ?? null,
        remote.birthDate ?? null,
        remote.gender ?? null,
        remote.medcardNumber ?? null,
        sessionId,
      ],
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

export function saveOtpForSession(sessionId: string, codeHash: string, expiresAt: number) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `
        UPDATE login_sessions
        SET
          otpCodeHash = ?,
          otpExpiresAt = ?,
          otpAttemptsLeft = ?,
          otpVerified = 0
        WHERE sessionId = ?
      `,
      [codeHash, expiresAt, OTP_MAX_ATTEMPTS, sessionId],
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

export async function issueOtpForSession(sessionId: string) {
  const min = 10 ** (OTP_CODE_LENGTH - 1);
  const max = 10 ** OTP_CODE_LENGTH - 1;
  const code = String(Math.floor(Math.random() * (max - min + 1)) + min);
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = Date.now() + OTP_TTL_MS;
  await saveOtpForSession(sessionId, codeHash, expiresAt);
  return { code, expiresAt };
}

export function markOtpVerified(sessionId: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `
        UPDATE login_sessions
        SET
          otpVerified = 1,
          otpCodeHash = NULL,
          otpExpiresAt = NULL,
          otpAttemptsLeft = 0
        WHERE sessionId = ?
      `,
      [sessionId],
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

export function updateOtpAttempts(sessionId: string, attemptsLeft: number) {
  return new Promise<void>((resolve, reject) => {
    db.run(
      `UPDATE login_sessions SET otpAttemptsLeft = ? WHERE sessionId = ?`,
      [attemptsLeft, sessionId],
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

export function deleteLoginSession(sessionId: string) {
  return new Promise<void>((resolve, reject) => {
    db.run(`DELETE FROM login_sessions WHERE sessionId = ?`, [sessionId], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
