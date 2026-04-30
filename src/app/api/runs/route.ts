import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { runs, actions, products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const actionId = searchParams.get("actionId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 500);

  let query = db
    .select({
      run: runs,
      action: actions,
      product: products,
    })
    .from(runs)
    .leftJoin(actions, eq(runs.actionId, actions.id))
    .leftJoin(products, eq(actions.productId, products.id))
    .orderBy(desc(runs.startedAt))
    .limit(limit)
    .$dynamic();

  if (actionId) query = query.where(eq(runs.actionId, actionId));

  const rows = await query;
  return NextResponse.json({ runs: rows });
}
