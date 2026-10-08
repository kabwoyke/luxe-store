import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional when DATABASE_URL is already in the environment (CI, hosting).
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "mysql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL },
});
