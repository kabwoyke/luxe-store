// drizzle-kit does not emit a storage engine. Some MySQL installs (WAMP, XAMPP) default to MyISAM,
// which has no transactions or row locks, so every CREATE TABLE in our migrations says ENGINE=InnoDB.
// This runs after `drizzle-kit generate` and adds it to any CREATE TABLE that lacks it.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../db/migrations/", import.meta.url);
let changed = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql"))) {
  const path = new URL(file, dir);
  const sql = readFileSync(path, "utf8");
  const fixed = sql.replace(/\n\);(\r?\n--> statement-breakpoint|\r?\n?$)/g, (match, tail, offset) => {
    // Only touch statements that close a CREATE TABLE.
    const start = sql.lastIndexOf("CREATE TABLE", offset);
    const prevEnd = Math.max(sql.lastIndexOf("--> statement-breakpoint", offset), -1);
    return start > prevEnd ? `\n) ENGINE=InnoDB;${tail}` : match;
  });
  if (fixed !== sql) {
    writeFileSync(path, fixed);
    changed++;
    console.log(`ensure-innodb: updated ${file}`);
  }
}
if (changed === 0) console.log("ensure-innodb: all migrations already specify ENGINE=InnoDB");
