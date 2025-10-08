import { Database } from "sqlite3";
import { join } from "path";

const dbFile = join(process.cwd(), "data.sqlite");
console.log("SQLite будет использовать файл:", dbFile);

const db = new Database(dbFile, (err) => {
  if (err) console.error("Ошибка при подключении к SQLite:", err);
  else console.log("Подключено к SQLite");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password TEXT,
      fullName TEXT,
      birthDate TEXT,
      email TEXT
    )
  `, (err) => {
    if (err) console.error("Не удалось создать таблицу users:", err);
    else console.log("Таблица users готова");
  });
});

export default db;
