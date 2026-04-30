import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { actions } from "@/lib/db/schema";
import { GeoPulseParamsSchema } from "@/lib/types";
import { isValidCron } from "@/lib/cron";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const Patch = z.object({
  name: z.string().min(1).max(100).optional(),
  path: z.string().min(1).max(200).optional(),
  cron: z.string().min(1).max(120).refine(isValidCron, { message: "invalid cron" }).optional(),
  enabled: z.boolean().optional(),
  params: GeoPulseParamsSchema.optional(),
  signatureHeader: z.string().min(1).max(80).optional(),
  secretEnvVar: z.string().min(1).max(120).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const action = await db.query.actions.findFirst({ where: eq(actions.id, id) });
  if (!action) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ action });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = Patch.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "invalid", detail: body.error.issues }, { status: 400 });
  }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  for (const [k, v] of Object.entries(body.data)) {
    if (v === undefined) continue;
    if (k === "params") updates.paramsJson = JSON.stringify(v);
    else updates[k] = v;
  }
  await db.update(actions).set(updates).where(eq(actions.id, id));
  const { reload } = await import("@/lib/scheduler");
  await reload();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(actions).where(eq(actions.id, id));
  const { reload } = await import("@/lib/scheduler");
  await reload();
  return NextResponse.json({ ok: true });
}
