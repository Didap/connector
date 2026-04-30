"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FormRow } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const CRON_PRESETS = [
  { label: "Lunedì 08:00", value: "0 8 * * 1" },
  { label: "Ogni mattina 08:00", value: "0 8 * * *" },
  { label: "Ogni 6 ore", value: "0 */6 * * *" },
  { label: "Ogni 5 min (test)", value: "*/5 * * * *" },
];

const DEFAULT_PARAMS = {
  windowDays: 7,
  queries: [
    "best tool to extract design system from a URL",
    "AI design system generator for Claude Code and Cursor",
    "alternative to Locofy and html.to.design",
  ],
  brand: ["Ditto", "ditto.design"],
  competitors: ["Locofy", "html.to.design", "Builder.io", "Anima"],
  metadata: { campaign: "weekly-pulse" },
};

export function NewActionForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [name, setName] = useState("Weekly geo-pulse");
  const [path, setPath] = useState("/api/agents/geo-pulse");
  const [cron, setCron] = useState("0 8 * * 1");
  const [secretEnvVar, setSecretEnvVar] = useState("DITTO_AGENT_SECRET");
  const [signatureHeader, setSignatureHeader] = useState("X-Ditto-Signature");
  const [paramsJson, setParamsJson] = useState(JSON.stringify(DEFAULT_PARAMS, null, 2));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const cronError = useMemo(() => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) return "5 fields expected";
    return "";
  }, [cron]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    let params: unknown;
    try {
      params = JSON.parse(paramsJson);
    } catch {
      setErr("params: JSON non valido");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${productId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: "geo-pulse",
          path,
          cron,
          enabled: true,
          params,
          signatureHeader,
          secretEnvVar,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(JSON.stringify(j.detail ?? j.error ?? "errore"));
        return;
      }
      router.push(`/products/${productId}`);
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
          <Label hint="solo geo-pulse per ora">Kind</Label>
          <Badge variant="info">geo-pulse</Badge>
        </FormRow>

        <FormRow>
          <Label htmlFor="p">Path</Label>
          <Input id="p" value={path} onChange={(e) => setPath(e.target.value)} required />
        </FormRow>

        <FormRow>
          <Label htmlFor="c" hint={cronError ? `⚠ ${cronError}` : "5 fields, prodotto.timezone"}>
            Cron
          </Label>
          <Input id="c" value={cron} onChange={(e) => setCron(e.target.value)} required className="font-mono" />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {CRON_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setCron(p.value)}
                className="text-[11px] rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-accent)]/50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </FormRow>

        <div className="grid grid-cols-2 gap-3">
          <FormRow>
            <Label htmlFor="sh">Signature header</Label>
            <Input
              id="sh"
              value={signatureHeader}
              onChange={(e) => setSignatureHeader(e.target.value)}
              required
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="se" hint="nome env var">Secret env var</Label>
            <Input id="se" value={secretEnvVar} onChange={(e) => setSecretEnvVar(e.target.value)} required />
          </FormRow>
        </div>

        <FormRow>
          <Label htmlFor="pa" hint="queries, brand, competitors, windowDays, metadata">
            Params (JSON)
          </Label>
          <Textarea
            id="pa"
            value={paramsJson}
            onChange={(e) => setParamsJson(e.target.value)}
            rows={14}
            spellCheck={false}
            required
          />
        </FormRow>

        {err && <p className="text-xs text-[var(--color-danger)] whitespace-pre-wrap">{err}</p>}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={busy || cronError !== ""}>
            {busy ? "..." : "Crea action"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
