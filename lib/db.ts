import mysql, { type Pool } from "mysql2/promise";
import { HttpError } from "@/lib/http";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  const missing = [
    ["DB_HOST", DB_HOST],
    ["DB_USER", DB_USER],
    ["DB_PASSWORD", DB_PASSWORD],
    ["DB_NAME", DB_NAME],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new HttpError(
      503,
      `Database is not configured. Set ${missing.join(", ")} in .env.local and restart the app.`,
    );
  }

  const port = DB_PORT ? Number(DB_PORT) : 3306;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535.");
  }

  pool = mysql.createPool({
    host: DB_HOST,
    port,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    timezone: "Z",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}
