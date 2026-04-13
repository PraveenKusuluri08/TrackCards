/**
 * One-time script: Set emailVerified for existing users so they can log in.
 * Run from project root: npx tsx scripts/verify-existing-users.ts
 * (Requires: npm i -D tsx. Set DATABASE_URL env or use .env)
 *
 * Or run this SQL directly in your DB:
 * UPDATE users SET email_verified = created_at WHERE email_verified IS NULL;
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() },
  });
  console.log(`Verified ${result.count} existing user(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
