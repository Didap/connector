"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ActionDetailControls({
  actionId,
  enabled,
}: {
  actionId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"run" | "toggle" | "delete" | null>(null);

  async function runNow() {
    setBusy("run");
    try {
      const res = await fetch(`/api/actions/${actionId}/run`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (j.runId) {
        router.push(`/runs/${j.runId}`);
      } else {
        alert(`Run failed: ${j.error ?? res.status}`);
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggle() {
    setBusy("toggle");
    try {
      await fetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (!confirm("Eliminare questa action e tutti i run?")) return;
    setBusy("delete");
    try {
      await fetch(`/api/actions/${actionId}`, { method: "DELETE" });
      router.back();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button onClick={runNow} disabled={busy !== null}>
        {busy === "run" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        Run now
      </Button>
      <Button variant="secondary" onClick={toggle} disabled={busy !== null}>
        {enabled ? <Pause size={14} /> : <Play size={14} />}
      </Button>
      <Button variant="danger" onClick={del} disabled={busy !== null}>
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
