"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function TopEventsChart({
  data,
}: {
  data: { ts: number; topEvent: string | null; count: number }[];
}) {
  if (data.length === 0) {
    return <div className="text-sm text-[var(--color-fg-muted)] text-center py-8">Nessun dato.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a33" />
        <XAxis
          dataKey="ts"
          type="number"
          domain={["auto", "auto"]}
          tickFormatter={(v) => new Date(v).toLocaleDateString("it-IT", { month: "short", day: "numeric" })}
          stroke="#8a96a6"
          fontSize={11}
        />
        <YAxis stroke="#8a96a6" fontSize={11} />
        <Tooltip
          contentStyle={{
            background: "#14181d",
            border: "1px solid #232a33",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(v) => new Date(v as number).toLocaleString("it-IT")}
          formatter={(value, _name, item) => [
            `${value} (${item.payload.topEvent ?? "—"})`,
            "top event",
          ]}
        />
        <Bar dataKey="count" fill="#5b8dff" />
      </BarChart>
    </ResponsiveContainer>
  );
}
