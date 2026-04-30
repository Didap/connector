import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { probeProduct } from "@/lib/caller/invoke";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "/api/agents/geo-pulse";

  try {
    const caps = await probeProduct(product.baseUrl, path);
    await db
      .update(products)
      .set({
        capabilitiesJson: JSON.stringify(caps),
        capabilitiesProbedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
    return NextResponse.json({ capabilities: caps });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
