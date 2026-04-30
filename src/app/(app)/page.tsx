import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, ExternalLink } from "lucide-react";
import { db } from "@/lib/db/client";
import { products, actions, runs } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { describeCron, nextRun } from "@/lib/cron";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));

  const data = await Promise.all(
    allProducts.map(async (p) => {
      const productActions = await db
        .select()
        .from(actions)
        .where(eq(actions.productId, p.id))
        .orderBy(desc(actions.createdAt));

      const lastRuns = await Promise.all(
        productActions.map(async (a) => {
          const r = await db.select().from(runs).where(eq(runs.actionId, a.id)).orderBy(desc(runs.startedAt)).limit(1);
          return { actionId: a.id, lastRun: r[0] ?? null };
        }),
      );
      const lastRunsMap = Object.fromEntries(lastRuns.map((r) => [r.actionId, r.lastRun]));
      return { product: p, actions: productActions, lastRunsMap };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--color-fg-muted)] mt-1">
            {allProducts.length} prodott{allProducts.length === 1 ? "o" : "i"} configurat
            {allProducts.length === 1 ? "o" : "i"}.
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus size={14} />
            Nuovo prodotto
          </Button>
        </Link>
      </div>

      {allProducts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-[var(--color-fg-muted)] mb-4">
            Nessun prodotto. Aggiungi il primo (es. Ditto) per iniziare a monitorare SEO/GEO.
          </p>
          <Link href="/products/new">
            <Button>
              <Plus size={14} />
              Aggiungi prodotto
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.map(({ product, actions: pActions, lastRunsMap }) => {
            const caps = product.capabilitiesJson ? JSON.parse(product.capabilitiesJson) : null;
            const backends: Record<string, boolean> = caps?.capabilities?.backends ?? {};
            return (
              <Card key={product.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Link href={`/products/${product.id}`} className="font-semibold hover:text-[var(--color-accent)]">
                      {product.name}
                    </Link>
                    <a
                      href={product.baseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] flex items-center gap-1 mt-1"
                    >
                      {product.baseUrl}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {Object.entries(backends).map(([k, v]) => (
                      <Badge key={k} variant={v ? "success" : "default"}>
                        {k}
                      </Badge>
                    ))}
                    {!caps && <Badge variant="warning">not probed</Badge>}
                  </div>
                </div>

                {pActions.length === 0 ? (
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Nessuna action.{" "}
                    <Link href={`/products/${product.id}/actions/new`} className="text-[var(--color-accent)] hover:underline">
                      Aggiungi
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pActions.map((a) => {
                      const lr = lastRunsMap[a.id];
                      const next = nextRun(a.cron, product.timezone);
                      return (
                        <Link
                          key={a.id}
                          href={`/products/${product.id}/actions/${a.id}`}
                          className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2 hover:bg-[var(--color-surface-2)] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.name}</div>
                            <div className="text-[11px] text-[var(--color-fg-muted)] truncate">
                              {describeCron(a.cron)} • next {next ? formatRelative(next) : "—"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {lr ? <RunStatusBadge status={lr.status} /> : <Badge>idle</Badge>}
                            {!a.enabled && <Badge variant="warning">paused</Badge>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
