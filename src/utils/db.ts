import { Database } from "sqlite3";
import { join } from "path";

const dbFile = join(process.cwd(), "data.sqlite");
console.log("SQLite database file:", dbFile);

const db = new Database(dbFile, (err) => {
  if (err) {
    console.error("Не удалось подключиться к SQLite:", err);
  } else {
    console.log("Подключение к SQLite успешно");
  }
});

db.serialize(() => {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        fullName TEXT,
        birthDate TEXT,
        email TEXT,
        passportSeries TEXT,
        passportNumber TEXT,
        passportIssueDate TEXT,
        passportIssuedBy TEXT,
        onecId TEXT,
        medcardNumber TEXT,
        gender TEXT
      )
    `,
    (err) => {
      if (err) {
        console.error("Ошибка создания таблицы users:", err);
      } else {
        console.log("Таблица users готова");
      }
    },
  );

  const columnsToEnsure = [
    { name: "passportSeries", definition: "TEXT" },
    { name: "passportNumber", definition: "TEXT" },
    { name: "passportIssueDate", definition: "TEXT" },
    { name: "passportIssuedBy", definition: "TEXT" },
    { name: "onecId", definition: "TEXT" },
    { name: "medcardNumber", definition: "TEXT" },
    { name: "gender", definition: "TEXT" },
  ];

  db.all(`PRAGMA table_info(users)`, (err, rows) => {
    if (err) {
      console.error("Ошибка получения списка столбцов таблицы users:", err);
      return;
    }

    const existingColumns = new Set<string>((rows ?? []).map((row) => row.name as string));
    columnsToEnsure.forEach(({ name, definition }) => {
      if (!existingColumns.has(name)) {
        db.run(`ALTER TABLE users ADD COLUMN ${name} ${definition}`, (alterErr) => {
          if (alterErr) {
            console.error(`Ошибка добавления колонки ${name} в таблицу users:`, alterErr);
          } else {
            console.log(`Колонка ${name} добавлена в таблицу users`);
          }
        });
      }
    });
  });

  db.run(
    `
      CREATE TABLE IF NOT EXISTS login_sessions (
        sessionId TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        docVerified INTEGER DEFAULT 0,
        otpVerified INTEGER DEFAULT 0,
        otpCodeHash TEXT,
        otpExpiresAt INTEGER,
        otpAttemptsLeft INTEGER DEFAULT 0,
        remoteCode TEXT,
        remoteFullName TEXT,
        remoteBirthDate TEXT,
        remoteGender TEXT,
        remoteMedcard TEXT,
        docLastDigits TEXT,
        purpose TEXT DEFAULT 'register'
      )
    `,
    (err) => {
      if (err) {
        console.error("Ошибка создания таблицы login_sessions:", err);
      }
    },
  );

  db.run(
    `
      CREATE INDEX IF NOT EXISTS idx_login_sessions_phone ON login_sessions (phone)
    `,
    (err) => {
      if (err) {
        console.error("Ошибка создания индекса idx_login_sessions_phone:", err);
      }
    },
  );

  const loginSessionColumnsToEnsure = [{ name: "purpose", definition: "TEXT DEFAULT 'register'" }];

  db.all(`PRAGMA table_info(login_sessions)`, (err, rows) => {
    if (err) {
      console.error("Ошибка получения списка столбцов таблицы login_sessions:", err);
      return;
    }

    const existingColumns = new Set<string>((rows ?? []).map((row) => row.name as string));
    loginSessionColumnsToEnsure.forEach(({ name, definition }) => {
      if (!existingColumns.has(name)) {
        db.run(`ALTER TABLE login_sessions ADD COLUMN ${name} ${definition}`, (alterErr) => {
          if (alterErr) {
            console.error(`Ошибка добавления колонки ${name} в таблицу login_sessions:`, alterErr);
          } else {
            console.log(`Колонка ${name} добавлена в таблицу login_sessions`);
          }
        });
      }
    });
  });
});

export default db;
