import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Plus, ExternalLink, RefreshCcw } from "lucide-react";
import { db } from "@/lib/db/client";
import { products, actions, runs } from "@/lib/db/schema";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { describeCron, nextRun } from "@/lib/cron";
import { formatRelative, formatDuration } from "@/lib/utils";
import { ProductActions } from "./ProductActions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) notFound();

  const productActions = await db
    .select()
    .from(actions)
    .where(eq(actions.productId, id))
    .orderBy(desc(actions.createdAt));

  const lastRunsRaw = await Promise.all(
    productActions.map(async (a) => {
      const r = await db.select().from(runs).where(eq(runs.actionId, a.id)).orderBy(desc(runs.startedAt)).limit(1);
      return [a.id, r[0] ?? null] as const;
    }),
  );
  const lastRuns = Object.fromEntries(lastRunsRaw);

  const caps = product.capabilitiesJson ? JSON.parse(product.capabilitiesJson) : null;
  const backends: Record<string, boolean> = caps?.capabilities?.backends ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <a
            href={product.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] flex items-center gap-1 mt-1"
          >
            {product.baseUrl} <ExternalLink size={11} />
          </a>
        </div>
        <ProductActions productId={product.id} />
      </div>

      <Card>
        <CardTitle>Capabilities</CardTitle>
        {caps ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{caps.name}</Badge>
              <Badge>signature {caps.capabilities?.hmacSignatureVersion}</Badge>
              <Badge>maxAge {caps.capabilities?.maxAgeSeconds}s</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(backends).map(([k, v]) => (
                <Badge key={k} variant={v ? "success" : "default"}>
                  {k}: {v ? "live" : "off"}
                </Badge>
              ))}
            </div>
            <p className="text-[11px] text-[var(--color-fg-muted)]">
              Probed {formatRelative(product.capabilitiesProbedAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-fg-muted)]">
            Non ancora probato. Premi <span className="font-mono text-xs">Probe</span>.
          </p>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="mb-0">Actions</CardTitle>
          <Link href={`/products/${product.id}/actions/new`}>
            <Button size="sm">
              <Plus size={12} /> Nuova action
            </Button>
          </Link>
        </div>
        {productActions.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nessuna action ancora.</p>
        ) : (
          <div className="space-y-2">
            {productActions.map((a) => {
              const lr = lastRuns[a.id];
              const next = nextRun(a.cron, product.timezone);
              return (
                <Link
                  key={a.id}
                  href={`/products/${product.id}/actions/${a.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-3 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {a.name}
                      <Badge variant="default">{a.kind}</Badge>
                      {!a.enabled && <Badge variant="warning">paused</Badge>}
                    </div>
                    <div className="text-[11px] text-[var(--color-fg-muted)] mt-0.5">
                      <span className="font-mono">{a.cron}</span> · {describeCron(a.cron)} · next{" "}
                      {next ? formatRelative(next) : "—"} · secret env <span className="font-mono">{a.secretEnvVar}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    {lr ? (
                      <>
                        <div className="text-[11px] text-[var(--color-fg-muted)]">
                          {formatRelative(lr.startedAt)} · {formatDuration(lr.durationMs)}
                        </div>
                        <RunStatusBadge status={lr.status} />
                      </>
                    ) : (
                      <Badge>idle</Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
