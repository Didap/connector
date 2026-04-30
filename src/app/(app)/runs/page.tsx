import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { runs, actions, products } from "@/lib/db/schema";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { formatAbsolute, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunsListPage() {
  const rows = await db
    .select({
      run: runs,
      action: actions,
      product: products,
    })
    .from(runs)
    .leftJoin(actions, eq(runs.actionId, actions.id))
    .leftJoin(products, eq(actions.productId, products.id))
    .orderBy(desc(runs.startedAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
      {rows.length === 0 ? (
        <Card className="text-center py-12 text-sm text-[var(--color-fg-muted)]">Nessun run ancora.</Card>
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map(({ run, action, product }) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RunStatusBadge status={run.status} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {product?.name ?? "—"} / {action?.name ?? "—"}
                    </div>
                    <div className="text-[11px] text-[var(--color-fg-muted)] truncate">
                      {formatAbsolute(run.startedAt)} · {run.triggeredBy}
                      {run.errorMessage ? ` · ${run.errorMessage.slice(0, 60)}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  {run.httpStatus && <Badge>HTTP {run.httpStatus}</Badge>}
                  <span className="font-mono text-[var(--color-fg-muted)]">{formatDuration(run.durationMs)}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
