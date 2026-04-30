"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Info, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Input";
import { Card, CardTitle } from "@/components/ui/Card";
import { ChipInput } from "@/components/ChipInput";

interface Suggestions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogSiteName?: string;
  hostname: string;
  brandSuggestions: string[];
  querySuggestions: string[];
}

const SCHEDULE_PRESETS = [
  { id: "weekly-mon-8", label: "Ogni lunedì alle 8:00", desc: "Buon ritmo per un report settimanale", cron: "0 8 * * 1" },
  { id: "daily-9", label: "Tutti i giorni alle 9:00", desc: "Più aggressivo, occhio al budget Tavily", cron: "0 9 * * *" },
  { id: "every-6h", label: "Ogni 6 ore", desc: "Solo se vuoi vedere oscillazioni rapide", cron: "0 */6 * * *" },
  { id: "test-5min", label: "Ogni 5 minuti (test)", desc: "Per verificare che tutto funzioni — disattiva dopo", cron: "*/5 * * * *" },
];

export function NewActionForm({
  productId,
  productName,
  productHost,
  derivedSecretEnvVar,
}: {
  productId: string;
  productName: string;
  productHost: string;
  derivedSecretEnvVar: string;
}) {
  const router = useRouter();
  const [scheduleId, setScheduleId] = useState("weekly-mon-8");
  const [name, setName] = useState("Pulse settimanale");
  const [queries, setQueries] = useState<string[]>([]);
  const [brand, setBrand] = useState<string[]>([productName]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [windowDays, setWindowDays] = useState(7);
  const [secretEnvVar, setSecretEnvVar] = useState(derivedSecretEnvVar);

  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [path, setPath] = useState("/api/agents/geo-pulse");
  const [signatureHeader, setSignatureHeader] = useState("X-Ditto-Signature");
  const [customCron, setCustomCron] = useState("");

  // Auto-suggest
  const [sugg, setSugg] = useState<Suggestions | null>(null);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");

  // Submit
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSugLoading(true);
      setSugError("");
      try {
        const res = await fetch(`/api/products/${productId}/suggest`, { method: "POST" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (cancelled) return;
        setSugg(j.suggestions);
        setQueries((prev) => (prev.length ? prev : j.suggestions.querySuggestions.slice(0, 4)));
        setBrand((prev) => {
          const merged = Array.from(new Set([...prev, ...j.suggestions.brandSuggestions]));
          return merged.slice(0, 5);
        });
      } catch (e) {
        if (!cancelled) setSugError(e instanceof Error ? e.message : "errore");
      } finally {
        if (!cancelled) setSugLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const cron = useMemo(() => {
    if (showAdvanced && customCron.trim()) return customCron.trim();
    return SCHEDULE_PRESETS.find((p) => p.id === scheduleId)?.cron ?? "0 8 * * 1";
  }, [scheduleId, customCron, showAdvanced]);

  const summary = useMemo(() => {
    const presetLabel = SCHEDULE_PRESETS.find((p) => p.id === scheduleId)?.label ?? "su un programma personalizzato";
    const qCount = queries.length;
    const cCount = competitors.length;
    return `${presetLabel}, Connector chiederà a Tavily come AI search risponde a ${qCount} ricerc${qCount === 1 ? "a" : "he"}, salverà se ${brand[0] || productName} è citato (e in che posizione), terrà d'occhio ${cCount} concorrent${cCount === 1 ? "e" : "i"}, e ti farà un report con grafici.`;
  }, [scheduleId, queries, competitors, brand, productName]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (queries.length === 0) {
      setErr("Aggiungi almeno una ricerca da monitorare.");
      return;
    }
    if (brand.length === 0) {
      setErr("Indica almeno un nome per il brand.");
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
          params: {
            queries,
            brand,
            competitors: competitors.length ? competitors : undefined,
            windowDays,
            metadata: { schedule: scheduleId },
          },
          signatureHeader,
          secretEnvVar,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(typeof j.detail === "string" ? j.detail : (j.error ?? "errore"));
        return;
      }
      router.push(`/products/${productId}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {/* Explainer */}
      <Card className="bg-[var(--color-surface-2)]/40 border-dashed">
        <div className="flex gap-3 items-start">
          <Sparkles className="text-[var(--color-accent)] shrink-0 mt-0.5" size={18} />
          <div className="space-y-1.5 text-sm">
            <p className="font-medium">Cos'è un'azione?</p>
            <p className="text-[var(--color-fg-muted)] leading-relaxed">
              Un&apos;<strong>azione</strong> è un controllo automatico che parte ogni X tempo. Per <strong>{productName}</strong>{" "}
              il tipo <code className="font-mono text-[11px] bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">geo-pulse</code>{" "}
              fa tre cose:
            </p>
            <ul className="text-[var(--color-fg-muted)] list-disc ml-5 space-y-1 text-xs">
              <li>
                Chiede a un&apos;AI search engine (Tavily) come risponde a delle ricerche, e segna se {productName} è citato
                (e in che posizione vs i concorrenti).
              </li>
              <li>Tira su gli eventi PostHog del periodo, per vedere se il traffico interno è in salute.</li>
              <li>Cerca trend rilevanti (Hacker News, news AI) che potrebbero impattare il business.</li>
            </ul>
            <p className="text-[var(--color-fg-muted)] text-xs pt-1">
              Tutto torna sul dashboard come grafici e raccomandazioni testuali, e ogni run viene confrontato con il
              precedente per evidenziare cose nuove.
            </p>
          </div>
        </div>
      </Card>

      {/* Auto-suggest banner */}
      {sugLoading && (
        <Card className="flex gap-2 items-center text-xs text-[var(--color-fg-muted)] py-3">
          <Loader2 size={14} className="animate-spin" />
          Sto leggendo {productHost} per suggerirti delle ricerche…
        </Card>
      )}
      {sugError && (
        <Card className="text-xs text-[var(--color-warning)] py-3">
          Non sono riuscito a leggere il sito ({sugError}). Niente di grave — compila a mano.
        </Card>
      )}
      {sugg && !sugLoading && (
        <Card className="bg-[var(--color-surface-2)]/40 py-3">
          <div className="text-xs text-[var(--color-fg-muted)] flex gap-2 items-start">
            <Check className="text-[var(--color-success)] shrink-0 mt-0.5" size={14} />
            <div>
              <span className="text-[var(--color-fg)]">Ho letto {sugg.hostname}.</span> Title:{" "}
              <span className="font-medium">{sugg.title?.slice(0, 80) ?? "—"}</span>. Descrizione:{" "}
              <span className="font-medium">{sugg.description?.slice(0, 100) ?? "—"}</span>. Ho proposto qualche ricerca
              qui sotto — togli quelle che non c&apos;entrano.
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-5">
        <FormRow>
          <Label htmlFor="n">Nome azione</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormRow>

        <FormRow>
          <Label hint="cliccane uno; il cron è gestito automaticamente">Quando deve partire</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SCHEDULE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setScheduleId(p.id)}
                className={
                  "text-left rounded-md border px-3 py-2 transition-colors " +
                  (scheduleId === p.id && !customCron
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50")
                }
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-[11px] text-[var(--color-fg-muted)]">{p.desc}</div>
              </button>
            ))}
          </div>
        </FormRow>

        <FormRow>
          <Label hint="ogni riga è una ricerca separata; premi Invio per aggiungerne una">
            Cosa cercare su AI search
          </Label>
          <ChipInput
            value={queries}
            onChange={setQueries}
            placeholder="es: best AI design system extractor"
            suggestions={sugg?.querySuggestions}
          />
        </FormRow>

        <FormRow>
          <Label hint="come ti chiamano negli articoli — Connector ti riconosce con queste parole">
            Nome del tuo brand
          </Label>
          <ChipInput
            value={brand}
            onChange={setBrand}
            placeholder="es: Ditto, ditto.design"
            suggestions={sugg?.brandSuggestions}
          />
        </FormRow>

        <FormRow>
          <Label hint="opzionale — se citati sopra di te scatta un alert">Concorrenti da tenere d&apos;occhio</Label>
          <ChipInput
            value={competitors}
            onChange={setCompetitors}
            placeholder="es: Locofy, Builder.io"
          />
        </FormRow>

        <FormRow>
          <Label>Finestra di analisi</Label>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setWindowDays(d)}
                className={
                  "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                  (windowDays === d
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50")
                }
              >
                ultimi {d} giorni
              </button>
            ))}
          </div>
        </FormRow>
      </Card>

      <Card className="bg-[var(--color-surface-2)]/40">
        <div className="flex gap-3 items-start">
          <Info className="text-[var(--color-accent)] shrink-0 mt-0.5" size={18} />
          <div className="space-y-2 text-sm flex-1">
            <p className="font-medium">Il secret HMAC (sicurezza)</p>
            <p className="text-[var(--color-fg-muted)] text-xs leading-relaxed">
              Connector firma ogni richiesta a {productName} con un segreto condiviso, in modo che {productName}
              accetti solo chiamate che provengono da te. Questo segreto:
            </p>
            <ul className="text-[var(--color-fg-muted)] text-xs list-disc ml-5 space-y-1">
              <li>
                Si chiama <code className="font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">{secretEnvVar}</code>{" "}
                (puoi cambiarlo in <em>Avanzato</em> qua sotto).
              </li>
              <li>
                Va settato in <strong>due</strong> posti su Coolify, con lo <strong>stesso identico valore</strong>:
                <br />
                <span className="block mt-1 ml-3">
                  ▸ App <strong>Connector</strong> → Environment Variables → aggiungi <code className="font-mono">{secretEnvVar}</code>
                </span>
                <span className="block ml-3">
                  ▸ App <strong>{productName}</strong> → Environment Variables → stesso nome, stesso valore (su Ditto è già lì)
                </span>
              </li>
              <li>
                Genera un valore random sicuro:{" "}
                <code className="font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">openssl rand -hex 32</code>
              </li>
            </ul>
            <p className="text-[11px] text-[var(--color-warning)] pt-1">
              Senza questo, l&apos;azione gira ma {productName} risponderà <code>401</code> e il run finisce in errore.
            </p>
          </div>
        </div>
      </Card>

      {/* Summary card */}
      <Card className="border-[var(--color-accent)]/30">
        <CardTitle>Riepilogo</CardTitle>
        <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">{summary}</p>
      </Card>

      {/* Advanced */}
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Avanzato (path, cron custom, header, secret env var)
      </button>
      {showAdvanced && (
        <Card className="space-y-4">
          <FormRow>
            <Label htmlFor="p">Path del webhook</Label>
            <Input id="p" value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" />
          </FormRow>
          <FormRow>
            <Label htmlFor="cc" hint="se compilato, sovrascrive i preset sopra">
              Cron custom (5 campi)
            </Label>
            <Input
              id="cc"
              value={customCron}
              onChange={(e) => setCustomCron(e.target.value)}
              placeholder="es: 0 8 * * 1"
              className="font-mono"
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="sh">Signature header</Label>
            <Input
              id="sh"
              value={signatureHeader}
              onChange={(e) => setSignatureHeader(e.target.value)}
              className="font-mono"
            />
          </FormRow>
          <FormRow>
            <Label htmlFor="se">Nome env var del secret</Label>
            <Input
              id="se"
              value={secretEnvVar}
              onChange={(e) => setSecretEnvVar(e.target.value)}
              className="font-mono"
            />
          </FormRow>
        </Card>
      )}

      {err && <p className="text-sm text-[var(--color-danger)]">{err}</p>}

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button type="submit" disabled={busy} size="lg">
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          Crea azione
        </Button>
      </div>
    </form>
  );
}
