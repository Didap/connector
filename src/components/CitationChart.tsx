"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

interface RunSeriesPoint {
  ts: number;
  [query: string]: number;
}

const COLORS = ["#5b8dff", "#4ade80", "#fbbf24", "#f87171", "#a78bfa", "#06b6d4", "#ec4899", "#94a3b8"];

export function CitationChart({
  runs,
  queries,
}: {
  runs: { ts: number; results: { query: string; cited: boolean }[] }[];
  queries: string[];
}) {
  const data = useMemo<RunSeriesPoint[]>(() => {
    return runs.map((r) => {
      const point: RunSeriesPoint = { ts: r.ts };
      for (const q of queries) {
        const match = r.results.find((x) => x.query === q);
        point[q] = match ? (match.cited ? 1 : 0) : 0;
      }
      return point;
    });
  }, [runs, queries]);

  if (runs.length === 0) {
    return (
      <div className="text-sm text-[var(--color-fg-muted)] text-center py-12">
        Ancora nessun run.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a33" />
        <XAxis
          dataKey="ts"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={(v) => new Date(v).toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
          stroke="#8a96a6"
          fontSize={11}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 1]}
          tickFormatter={(v) => (v === 1 ? "cited" : "no")}
          stroke="#8a96a6"
          fontSize={11}
        />
        <Tooltip
          contentStyle={{
            background: "#14181d",
            border: "1px solid #232a33",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => new Date(v as number).toLocaleString("it-IT")}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {queries.map((q, i) => (
          <Line
            key={q}
            type="stepAfter"
            dataKey={q}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
