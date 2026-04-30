import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { deriveSecretEnvVar } from "@/lib/suggest";
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
  const host = (() => {
    try {
      return new URL(product.baseUrl).hostname.replace(/^www\./, "");
    } catch {
      return product.baseUrl;
    }
  })();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuova azione</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-1">
          per <span className="text-[var(--color-fg)] font-medium">{product.name}</span> ({host})
        </p>
      </div>
      <NewActionForm
        productId={id}
        productName={product.name}
        productHost={host}
        derivedSecretEnvVar={deriveSecretEnvVar(product.name)}
      />
    </div>
  );
}
