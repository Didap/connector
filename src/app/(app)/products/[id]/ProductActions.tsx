"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ProductActions({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"probe" | "delete" | null>(null);

  async function probe() {
    setBusy("probe");
    try {
      const res = await fetch(`/api/products/${productId}/probe`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`Probe failed: ${j.error ?? res.status}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (!confirm("Eliminare questo prodotto e tutte le sue actions/runs?")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Delete failed");
        return;
      }
      router.push("/products");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button variant="secondary" onClick={probe} disabled={busy !== null}>
        <RefreshCcw size={14} className={busy === "probe" ? "animate-spin" : ""} />
        Probe
      </Button>
      <Button variant="danger" onClick={del} disabled={busy !== null}>
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
