import "server-only";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

export async function seedAdmin() {
  const username = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.log(
      "[seed] SEED_ADMIN_PASSWORD not set — skipping. Set it on Coolify to provision the admin account.",
    );
    return;
  }

  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (existing) return;

  await db.insert(users).values({
    id: `usr_${nanoid(10)}`,
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  });
  console.log(`[seed] admin user "${username}" created`);
}
