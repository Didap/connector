import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { actions } from "@/lib/db/schema";
import { ActionKindSchema, GeoPulseParamsSchema } from "@/lib/types";
import { isValidCron } from "@/lib/cron";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const Create = z.object({
  name: z.string().min(1).max(100),
  kind: ActionKindSchema,
  path: z.string().min(1).max(200),
  cron: z.string().min(1).max(120).refine(isValidCron, { message: "invalid cron" }),
  enabled: z.boolean().default(true),
  params: GeoPulseParamsSchema,
  signatureHeader: z.string().min(1).max(80).default("X-Ditto-Signature"),
  secretEnvVar: z.string().min(1).max(120),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const rows = await db
    .select()
    .from(actions)
    .where(eq(actions.productId, id))
    .orderBy(desc(actions.createdAt));
  return NextResponse.json({ actions: rows });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = Create.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid", detail: body.error.issues }, { status: 400 });
  }
  const actionId = `act_${nanoid(10)}`;
  const now = new Date();
  await db.insert(actions).values({
    id: actionId,
    productId: id,
    name: body.data.name,
    kind: body.data.kind,
    path: body.data.path,
    cron: body.data.cron,
    enabled: body.data.enabled,
    paramsJson: JSON.stringify(body.data.params),
    signatureHeader: body.data.signatureHeader,
    secretEnvVar: body.data.secretEnvVar,
    createdAt: now,
    updatedAt: now,
  });
  const { reload } = await import("@/lib/scheduler");
  await reload();
  return NextResponse.json({ id: actionId });
}
