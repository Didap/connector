import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const Create = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  timezone: z.string().min(1).max(64).default("Europe/Rome"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return NextResponse.json({ products: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = Create.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid", detail: body.error.issues }, { status: 400 });
  }
  const id = `prd_${nanoid(10)}`;
  const now = new Date();
  await db.insert(products).values({
    id,
    name: body.data.name,
    baseUrl: body.data.baseUrl.replace(/\/$/, ""),
    timezone: body.data.timezone,
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json({ id });
}
