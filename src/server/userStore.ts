import db from "@/utils/db";

export type DbUserRow = {
  id: number;
  phone: string;
  password: string;
  fullName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssueDate?: string | null;
  passportIssuedBy?: string | null;
  onecId?: string | null;
  medcardNumber?: string | null;
  gender?: string | null;
};

type InsertUserPayload = {
  phone: string;
  password: string;
  fullName?: string | null;
  birthDate?: string | null;
  email?: string | null;
  passportSeries?: string | null;
  passportNumber?: string | null;
  passportIssueDate?: string | null;
  passportIssuedBy?: string | null;
  onecId?: string | null;
  medcardNumber?: string | null;
  gender?: string | null;
};

type UpdateUserPayload = Partial<Omit<InsertUserPayload, "phone">>;

export function getUserByPhone(phone: string) {
  return new Promise<DbUserRow | null>((resolve, reject) => {
    db.get(
      `
        SELECT
          id,
          phone,
          password,
          fullName,
          birthDate,
          email,
          passportSeries,
          passportNumber,
          passportIssueDate,
          passportIssuedBy,
          onecId,
          medcardNumber,
          gender
        FROM users
        WHERE phone = ?
      `,
      [phone],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row ?? null);
      },
    );
  });
}

export function insertUser(payload: InsertUserPayload) {
  return new Promise<DbUserRow>((resolve, reject) => {
    db.run(
      `
        INSERT INTO users (
          phone,
          password,
          fullName,
          birthDate,
          email,
          passportSeries,
          passportNumber,
          passportIssueDate,
          passportIssuedBy,
          onecId,
          medcardNumber,
          gender
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.phone,
        payload.password,
        payload.fullName ?? null,
        payload.birthDate ?? null,
        payload.email ?? null,
        payload.passportSeries ?? null,
        payload.passportNumber ?? null,
        payload.passportIssueDate ?? null,
        payload.passportIssuedBy ?? null,
        payload.onecId ?? null,
        payload.medcardNumber ?? null,
        payload.gender ?? null,
      ],
      function (err) {
        if (err) {
          reject(err);
          return;
        }

        db.get(
          `
            SELECT
              id,
              phone,
              password,
              fullName,
              birthDate,
              email,
              passportSeries,
              passportNumber,
              passportIssueDate,
              passportIssuedBy,
              onecId,
              medcardNumber,
              gender
            FROM users
            WHERE id = ?
          `,
          [this.lastID],
          (selectErr, row) => {
            if (selectErr || !row) {
              reject(selectErr ?? new Error("Не удалось прочитать созданного пользователя"));
              return;
            }
            resolve(row as DbUserRow);
          },
        );
      },
    );
  });
}

export function updateUserById(id: number, updates: UpdateUserPayload) {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return Promise.resolve();
  }

  const setClauses = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, value]) => (value ?? null)) as unknown[];
  values.push(id);

  return new Promise<void>((resolve, reject) => {
    db.run(
      `
        UPDATE users
        SET ${setClauses}
        WHERE id = ?
      `,
      values,
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
