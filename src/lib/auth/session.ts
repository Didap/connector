import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

const COOKIE_NAME = "connector_session";
const SESSION_DAYS = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    token: tokenHash,
    userId,
    expiresAt,
    createdAt: now,
  });

  await db.delete(sessions).where(lt(sessions.expiresAt, now));

  return token;
}

function cookieIsSecure(): boolean {
  const explicit = process.env.COOKIE_SECURE;
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieIsSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.token, tokenHash),
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.token, tokenHash));
    return null;
  }
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  return user ?? null;
}

export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, hashToken(token)));
}

export async function destroyCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await destroySession(token);
  await clearSessionCookie();
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
