import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const abs = Math.abs(diff);
  const sign = diff >= 0 ? "" : "in ";
  if (abs < 60_000) return `${sign}${Math.round(abs / 1000)}s${diff >= 0 ? " ago" : ""}`;
  if (abs < 3_600_000) return `${sign}${Math.round(abs / 60_000)}m${diff >= 0 ? " ago" : ""}`;
  if (abs < 86_400_000) return `${sign}${Math.round(abs / 3_600_000)}h${diff >= 0 ? " ago" : ""}`;
  return `${sign}${Math.round(abs / 86_400_000)}d${diff >= 0 ? " ago" : ""}`;
}

export function formatAbsolute(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return d.toLocaleString("it-IT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}
