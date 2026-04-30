import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { NewActionForm } from "./NewActionForm";

export const dynamic = "force-dynamic";

export default async function NewActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) notFound();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nuova action <span className="text-[var(--color-fg-muted)] font-normal">— {product.name}</span>
      </h1>
      <NewActionForm productId={id} />
    </div>
  );
}
