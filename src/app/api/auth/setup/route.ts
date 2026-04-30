import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession, hasAnyUser, setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const Body = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  if (await hasAnyUser()) {
    return NextResponse.json({ error: "setup already complete" }, { status: 400 });
  }
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid", detail: body.error.issues }, { status: 400 });
  }

  const id = `usr_${nanoid(10)}`;
  await db.insert(users).values({
    id,
    username: body.data.username,
    passwordHash: hashPassword(body.data.password),
    createdAt: new Date(),
  });

  const token = await createSession(id);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
