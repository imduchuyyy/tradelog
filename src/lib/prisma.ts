import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  // 1. Check if we are using PostgreSQL
  if (dbUrl.startsWith("postgres") || dbUrl.startsWith("postgresql")) {
    return new PrismaClient({
      adapter: new PrismaPg({ connectionString: dbUrl }),
    })
  }

  // 2. Fallback to SQLite Logic
  const dbPath = dbUrl.startsWith("file:")
    ? path.resolve(process.cwd(), dbUrl.replace("file:", "").replace("./", ""))
    : dbUrl;

  console.log("Connecting to Local SQLite at:", dbPath);
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
