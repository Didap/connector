"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarkdownView } from "@/components/MarkdownView";
import { cn } from "@/lib/utils";
import type { RecommendationsDiff } from "@/lib/analytics/recommendations-diff";

type Tab = "report" | "recommendations" | "json" | "diff";

export function RunTabs({
  markdown,
  jsonReport,
  recommendations,
  diff,
}: {
  markdown: string;
  jsonReport: string;
  recommendations: string[];
  diff: RecommendationsDiff | null;
}) {
  const [tab, setTab] = useState<Tab>("report");
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "report", label: "Report" },
    { id: "recommendations", label: "Recommendations", count: recommendations.length },
    ...(diff ? ([{ id: "diff", label: "Diff" }] as const) : []),
    { id: "json", label: "JSON" },
  ];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-[var(--color-border)] flex items-center gap-1 px-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-3 py-2.5 text-xs border-b-2 transition-colors -mb-px",
              tab === t.id
                ? "border-[var(--color-accent)] text-[var(--color-fg)]"
                : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 text-[10px] text-[var(--color-fg-muted)]">{t.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="p-5">
        {tab === "report" && <MarkdownView source={markdown} />}
        {tab === "recommendations" && (
          <div className="space-y-2 text-sm">
            {recommendations.length === 0 ? (
              <p className="text-[var(--color-fg-muted)]">Nessuna raccomandazione.</p>
            ) : (
              recommendations.map((r, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Badge variant="info">{i + 1}</Badge>
                  <span>{r}</span>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "diff" && diff && (
          <div className="space-y-2 text-xs">
            {diff.added.length === 0 && diff.removed.length === 0 ? (
              <p className="text-[var(--color-fg-muted)]">Nessun cambio.</p>
            ) : (
              <>
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
                {diff.unchanged.length > 0 && (
                  <p className="text-[var(--color-fg-muted)] pt-2 text-[11px]">
                    {diff.unchanged.length} unchanged
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {tab === "json" && (
          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-[var(--color-fg-muted)] max-h-[60vh] overflow-auto scrollbar-thin">
            {JSON.stringify(JSON.parse(jsonReport), null, 2)}
          </pre>
        )}
      </div>
    </Card>
  );
}
