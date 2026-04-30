import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchSuggestions } from "@/lib/suggest";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const suggestions = await fetchSuggestions(product.baseUrl, product.name);
    return NextResponse.json({ suggestions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
