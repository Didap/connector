"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState("Ditto");
  const [baseUrl, setBaseUrl] = useState("https://ditto.design");
  const [timezone, setTimezone] = useState("Europe/Rome");
  const [probePath, setProbePath] = useState("/api/agents/geo-pulse");
  const [probe, setProbe] = useState<{
    name?: string;
    capabilities?: { backends: Record<string, boolean>; hmacSignatureVersion?: string };
  } | null>(null);
  const [probing, setProbing] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function runProbe() {
    setErr("");
    setProbe(null);
    setProbing(true);
    try {
      const url = new URL(probePath, baseUrl).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setProbe(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "probe failed");
    } finally {
      setProbing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseUrl, timezone }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "create failed");
        return;
      }
      const { id } = await res.json();
      if (probe) {
        await fetch(`/api/products/${id}/probe?path=${encodeURIComponent(probePath)}`, {
          method: "POST",
        }).catch(() => {});
      }
      router.push(`/products/${id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form className="space-y-4" onSubmit={submit}>
        <FormRow>
          <Label htmlFor="n">Nome</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormRow>
        <FormRow>
          <Label htmlFor="b" hint="senza slash finale">Base URL</Label>
          <Input id="b" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://example.com" required />
        </FormRow>
        <FormRow>
          <Label htmlFor="tz">Timezone</Label>
          <Input id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} required />
        </FormRow>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <div className="flex items-end gap-2">
            <FormRow className="flex-1">
              <Label htmlFor="pp" hint="GET endpoint, no auth">Probe path</Label>
              <Input id="pp" value={probePath} onChange={(e) => setProbePath(e.target.value)} />
            </FormRow>
            <Button type="button" variant="secondary" onClick={runProbe} disabled={probing || !baseUrl}>
              {probing ? "..." : "Probe"}
            </Button>
          </div>
          {probe?.capabilities && (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 space-y-2">
              <div className="text-xs text-[var(--color-fg-muted)]">
                <span className="font-mono">{probe.name}</span> • signature{" "}
                <span className="font-mono">{probe.capabilities.hmacSignatureVersion}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(probe.capabilities.backends).map(([k, v]) => (
                  <Badge key={k} variant={v ? "success" : "default"}>
                    {k}: {v ? "live" : "off"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {err && <p className="text-xs text-[var(--color-danger)]">{err}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? "..." : "Crea prodotto"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
