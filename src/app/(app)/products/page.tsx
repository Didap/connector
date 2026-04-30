import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, ExternalLink } from "lucide-react";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <Link href="/products/new">
          <Button>
            <Plus size={14} /> Nuovo
          </Button>
        </Link>
      </div>
      {rows.length === 0 ? (
        <Card className="text-center py-12 text-sm text-[var(--color-fg-muted)]">Nessun prodotto.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map((p) => {
            const caps = p.capabilitiesJson ? JSON.parse(p.capabilitiesJson) : null;
            const backends: Record<string, boolean> = caps?.capabilities?.backends ?? {};
            return (
              <Link key={p.id} href={`/products/${p.id}`}>
                <Card className="hover:border-[var(--color-accent)]/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1 mt-0.5">
                        {p.baseUrl} <ExternalLink size={10} />
                      </div>
                      <div className="text-[11px] text-[var(--color-fg-muted)] mt-1">
                        tz {p.timezone} • last probe{" "}
                        {p.capabilitiesProbedAt ? formatRelative(p.capabilitiesProbedAt) : "—"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                      {Object.entries(backends).map(([k, v]) => (
                        <Badge key={k} variant={v ? "success" : "default"}>
                          {k}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
