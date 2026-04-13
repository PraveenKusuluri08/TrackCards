import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * pg v8 warns when sslmode is require/prefer/verify-ca without opting into libpq
 * compatibility or verify-full. Opt in so future pg v9 behavior is explicit.
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
function normalizeDatabaseUrlForPg(url: string): string {
  try {
    const u = new URL(url);
    const params = u.searchParams;
    const sslmode = params.get("sslmode")?.toLowerCase();
    const needsCompat =
      sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca";
    if (needsCompat && !params.has("uselibpqcompat")) {
      params.set("uselibpqcompat", "true");
      u.search = params.toString();
      return u.toString();
    }
  } catch {
    // fall through
  }
  return url;
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  const connectionString = normalizeDatabaseUrlForPg(raw);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
