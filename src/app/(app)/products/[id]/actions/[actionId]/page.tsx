import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { actions, products, runs } from "@/lib/db/schema";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RunStatusBadge } from "@/components/RunStatusBadge";
import { CitationChart } from "@/components/CitationChart";
import { TopEventsChart } from "@/components/TopEventsChart";
import { ActionDetailControls } from "./ActionDetailControls";
import { describeCron, nextRun } from "@/lib/cron";
import { formatAbsolute, formatRelative, formatDuration } from "@/lib/utils";
import { computeCitationStats, topEventsSeries } from "@/lib/analytics/citation-rate";
import { computeBudgets } from "@/lib/analytics/budget";
import { diffRecommendations } from "@/lib/analytics/recommendations-diff";
import { GeoPulseReportSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string; actionId: string }>;
}) {
  const { id: productId, actionId } = await params;
  const action = await db.query.actions.findFirst({ where: eq(actions.id, actionId) });
  if (!action) notFound();
  const product = await db.query.products.findFirst({ where: eq(products.id, action.productId) });
  if (!product) notFound();

  const runRows = await db
    .select()
    .from(runs)
    .where(eq(runs.actionId, actionId))
    .orderBy(desc(runs.startedAt))
    .limit(60);

  const okRuns = runRows.filter((r) => r.status === "ok" && r.reportJson);
  const reports = okRuns
    .map((r) => {
      try {
        const parsed = GeoPulseReportSchema.safeParse(JSON.parse(r.reportJson!));
        return parsed.success ? { run: r, report: parsed.data } : null;
      } catch {
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const params_ = JSON.parse(action.paramsJson);
  const queries: string[] = Array.isArray(params_.queries) ? params_.queries : [];

  const stats = computeCitationStats(reports.map((r) => r.report));
  const chartRuns = [...reports]
    .reverse()
    .map((r) => ({
      ts: r.run.startedAt.getTime(),
      results: (r.report.aiSearch.results ?? []).map((x) => ({ query: x.query, cited: x.cited })),
    }));
  const topEvents = topEventsSeries(
    [...reports].reverse().map((r) => ({ startedAt: r.run.startedAt, report: r.report })),
  );

  const latest = reports[0]?.report ?? null;
  const previous = reports[1]?.report ?? null;
  const diff = latest && previous
    ? diffRecommendations(previous.recommendations, latest.recommendations)
    : null;
  const budgets = latest ? computeBudgets(latest) : [];

  const next = nextRun(action.cron, product.timezone);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/products/${productId}`} className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
          ← {product.name}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              {action.name}
              <Badge variant="info">{action.kind}</Badge>
              {!action.enabled && <Badge variant="warning">paused</Badge>}
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              <span className="font-mono">{action.cron}</span> · {describeCron(action.cron)} · next{" "}
              {next ? formatRelative(next) : "—"}
            </p>
          </div>
          <ActionDetailControls actionId={action.id} enabled={action.enabled} />
        </div>
      </div>

      {budgets.length > 0 && (
        <Card>
          <CardTitle>Budgets</CardTitle>
          <div className="space-y-2">
            {budgets.map((b) => (
              <div key={b.scope}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>
                    <span className="font-medium">{b.scope}</span>
                    <span className="text-[var(--color-fg-muted)] ml-2">{b.period}</span>
                  </span>
                  <span className="font-mono text-[var(--color-fg-muted)]">
                    {b.used} / {b.hardLimit}
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                  <div
                    className={
                      b.level === "critical"
                        ? "bg-[var(--color-danger)] h-full"
                        : b.level === "warning"
                        ? "bg-[var(--color-warning)] h-full"
                        : "bg-[var(--color-success)] h-full"
                    }
                    style={{ width: `${Math.min(100, b.pct * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {queries.length > 0 && (
        <Card>
          <CardTitle>Citation per query (ultimi {chartRuns.length} run)</CardTitle>
          <CitationChart runs={chartRuns} queries={queries.slice(0, 8)} />
          {stats.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {stats.map((s) => (
                <div key={s.query} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate text-[var(--color-fg-muted)]">{s.query}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono">
                      {Math.round(s.rate * 100)}%
                    </span>
                    {s.recentCompetitorsAbove.length > 0 && (
                      <Badge variant="warning" title={s.recentCompetitorsAbove.join(", ")}>
                        +{s.recentCompetitorsAbove.length} comp
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {topEvents.some((e) => e.count > 0) && (
        <Card>
          <CardTitle>PostHog top event count</CardTitle>
          <TopEventsChart data={topEvents} />
        </Card>
      )}

      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
        <Card>
          <CardTitle>Recommendations diff (vs run precedente)</CardTitle>
          <div className="space-y-2 text-xs">
            {diff.added.map((r, i) => (
              <div key={`a${i}`} className="flex items-start gap-2">
                <Badge variant="success">NEW</Badge>
                <span>{r}</span>
              </div>
            ))}
            {diff.removed.map((r, i) => (
              <div key={`r${i}`} className="flex items-start gap-2 text-[var(--color-fg-muted)]">
                <Badge variant="default">gone</Badge>
                <span className="line-through">{r}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Run history</CardTitle>
        {runRows.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nessun run.</p>
        ) : (
          <div className="space-y-1.5">
            {runRows.map((r) => (
              <Link
                key={r.id}
                href={`/runs/${r.id}`}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-surface-2)]/50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RunStatusBadge status={r.status} />
                  <Badge variant="default">{r.triggeredBy}</Badge>
                  <span className="text-[var(--color-fg-muted)] truncate">
                    {formatAbsolute(r.startedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.httpStatus && <span className="font-mono">HTTP {r.httpStatus}</span>}
                  <span className="font-mono text-[var(--color-fg-muted)]">{formatDuration(r.durationMs)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
