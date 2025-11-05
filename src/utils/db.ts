import { Database } from "sqlite3";
import { join } from "path";

const dbFile = join(process.cwd(), "data.sqlite");
console.log("SQLite database file:", dbFile);

const db = new Database(dbFile, (err) => {
  if (err) {
    console.error("Не удалось подключиться к SQLite:", err);
  } else {
    console.log("Подключение к SQLite установлено");
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
        passportIssuedBy TEXT
      )
    `,
    (err) => {
      if (err) {
        console.error("Ошибка создания таблицы users:", err);
      } else {
        console.log("Таблица users создана или уже существует");
      }
    },
  );

  const columnsToEnsure = [
    { name: "passportSeries", definition: "TEXT" },
    { name: "passportNumber", definition: "TEXT" },
    { name: "passportIssueDate", definition: "TEXT" },
    { name: "passportIssuedBy", definition: "TEXT" },
  ];

  db.all(`PRAGMA table_info(users)`, (err, rows) => {
    if (err) {
      console.error("Не удалось проверить структуру таблицы users:", err);
      return;
    }

    const existingColumns = new Set<string>((rows ?? []).map((row) => row.name as string));
    columnsToEnsure.forEach(({ name, definition }) => {
      if (!existingColumns.has(name)) {
        db.run(`ALTER TABLE users ADD COLUMN ${name} ${definition}`, (alterErr) => {
          if (alterErr) {
            console.error(`Не удалось добавить колонку ${name} в таблицу users:`, alterErr);
          } else {
            console.log(`Колонка ${name} добавлена в таблицу users`);
          }
        });
      }
    });
  });
});

export default db;
