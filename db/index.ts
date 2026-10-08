import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

function createPool() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
  });
  // Timestamps are stored and compared in UTC (the UI formats to Africa/Nairobi). Drizzle reads
  // timestamp columns as UTC, so NOW() and column defaults must produce UTC too, whatever the
  // MySQL server's own timezone is. The event hands us the raw callback-style connection.
  pool.on("connection", (connection) => {
    (connection as unknown as { query: (sql: string) => void }).query("SET time_zone = '+00:00'");
  });
  return pool;
}

export const pool = globalForDb.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export const db = drizzle(pool, { schema, mode: "default" });
