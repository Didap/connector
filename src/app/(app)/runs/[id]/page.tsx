import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc, and, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { runs, actions, products } from "@/lib/db/schema";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { MarkdownView } from "@/components/MarkdownView";
import { RunTabs } from "./RunTabs";
import { formatAbsolute, formatDuration } from "@/lib/utils";
import { diffRecommendations } from "@/lib/analytics/recommendations-diff";
import { GeoPulseReportSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await db.query.runs.findFirst({ where: eq(runs.id, id) });
  if (!run) notFound();
  const action = await db.query.actions.findFirst({ where: eq(actions.id, run.actionId) });
  const product = action
    ? await db.query.products.findFirst({ where: eq(products.id, action.productId) })
    : null;

  const prevRows = await db
    .select()
    .from(runs)
    .where(and(eq(runs.actionId, run.actionId), lt(runs.startedAt, run.startedAt), eq(runs.status, "ok")))
    .orderBy(desc(runs.startedAt))
    .limit(1);
  const prev = prevRows[0] ?? null;

  let report = null;
  let prevReport = null;
  if (run.reportJson) {
    const parsed = GeoPulseReportSchema.safeParse(JSON.parse(run.reportJson));
    if (parsed.success) report = parsed.data;
  }
  if (prev?.reportJson) {
    const parsed = GeoPulseReportSchema.safeParse(JSON.parse(prev.reportJson));
    if (parsed.success) prevReport = parsed.data;
  }
  const diff = report && prevReport
    ? diffRecommendations(prevReport.recommendations, report.recommendations)
    : null;

  return (
    <div className="space-y-6">
      <div>
        {action && product && (
          <Link
            href={`/products/${product.id}/actions/${action.id}`}
            className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            ← {product.name} / {action.name}
          </Link>
        )}
        <div className="flex items-center justify-between mt-2 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight">Run {run.id}</h1>
          <div className="flex items-center gap-2">
            <RunStatusBadge status={run.status} />
            <Badge variant="default">{run.triggeredBy}</Badge>
            {run.httpStatus && <Badge>HTTP {run.httpStatus}</Badge>}
            <Badge>{formatDuration(run.durationMs)}</Badge>
          </div>
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mt-1">
          {formatAbsolute(run.startedAt)} → {formatAbsolute(run.finishedAt)}
        </p>
      </div>

      {run.errorMessage && (
        <Card>
          <CardTitle className="text-[var(--color-danger)]">Error</CardTitle>
          <pre className="text-xs whitespace-pre-wrap font-mono text-[var(--color-fg-muted)]">
            {run.errorMessage}
          </pre>
        </Card>
      )}

      {run.reportMd && (
        <RunTabs
          markdown={run.reportMd}
          jsonReport={run.reportJson ?? "{}"}
          recommendations={report?.recommendations ?? []}
          diff={diff}
        />
      )}
    </div>
  );
}
