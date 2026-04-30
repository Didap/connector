import { GeoPulseReport } from "@/lib/types";

interface QueryStats {
  query: string;
  total: number;
  cited: number;
  rate: number;
  avgPosition: number | null;
  recentCompetitorsAbove: string[];
}

export interface CitationSeriesPoint {
  ts: number;
  cited: number;
  total: number;
  rate: number;
}

export function computeCitationStats(reports: GeoPulseReport[]): QueryStats[] {
  const byQuery = new Map<string, { total: number; cited: number; positions: number[]; competitors: Set<string> }>();
  for (const report of reports) {
    const results = report.aiSearch?.results ?? [];
    for (const r of results) {
      const slot = byQuery.get(r.query) ?? {
        total: 0,
        cited: 0,
        positions: [],
        competitors: new Set<string>(),
      };
      slot.total += 1;
      if (r.cited) slot.cited += 1;
      const pos = positionToRank(r.position);
      if (pos !== null) slot.positions.push(pos);
      for (const c of r.competitorsAbove ?? []) slot.competitors.add(c);
      byQuery.set(r.query, slot);
    }
  }
  return Array.from(byQuery.entries()).map(([query, s]) => ({
    query,
    total: s.total,
    cited: s.cited,
    rate: s.total ? s.cited / s.total : 0,
    avgPosition: s.positions.length ? s.positions.reduce((a, b) => a + b, 0) / s.positions.length : null,
    recentCompetitorsAbove: Array.from(s.competitors).slice(0, 10),
  }));
}

function positionToRank(p: string | undefined): number | null {
  if (!p) return null;
  if (p === "1st") return 1;
  if (p === "2nd") return 2;
  if (p === "3rd") return 3;
  if (p === "4+") return 4;
  if (p === "not-cited") return null;
  return null;
}

export function citationSeries(
  runs: { startedAt: Date; report: GeoPulseReport }[],
  query: string,
): CitationSeriesPoint[] {
  return runs.map(({ startedAt, report }) => {
    const results = report.aiSearch?.results?.filter((r) => r.query === query) ?? [];
    const total = results.length;
    const cited = results.filter((r) => r.cited).length;
    return {
      ts: startedAt.getTime(),
      total,
      cited,
      rate: total ? cited / total : 0,
    };
  });
}

export function topEventsSeries(
  runs: { startedAt: Date; report: GeoPulseReport }[],
): { ts: number; topEvent: string | null; count: number }[] {
  return runs.map(({ startedAt, report }) => {
    const top = report.posthog?.topEvents?.[0];
    return {
      ts: startedAt.getTime(),
      topEvent: top?.event ?? null,
      count: top?.count ?? 0,
    };
  });
}
