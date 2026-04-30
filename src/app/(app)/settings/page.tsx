import Link from "next/link";
import { eq } from "drizzle-orm";
import { Info, KeyRound, ExternalLink } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/db/client";
import { actions, products } from "@/lib/db/schema";
import { describeCron } from "@/lib/cron";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const rows = await db
    .select({
      action: actions,
      product: products,
    })
    .from(actions)
    .leftJoin(products, eq(actions.productId, products.id))
    .where(eq(actions.enabled, true));

  const requiredEnvVars = Array.from(new Set(rows.map((r) => r.action.secretEnvVar))).sort();
  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Impostazioni</h1>

      <Card className="bg-[var(--color-surface-2)]/40">
        <div className="flex gap-3 items-start">
          <Info className="text-[var(--color-accent)] shrink-0 mt-0.5" size={18} />
          <div className="space-y-2 text-sm">
            <p className="font-medium">Dove vivono i secret?</p>
            <p className="text-[var(--color-fg-muted)] text-xs leading-relaxed">
              Ogni azione referenzia un nome di env var (es. <code className="font-mono">DITTO_AGENT_SECRET</code>). Il
              valore — il segreto vero — vive solo nelle env var di Coolify, mai nel database di Connector.
            </p>
            <div className="text-xs text-[var(--color-fg-muted)] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[11px] font-bold">
                  1
                </span>
                <span>
                  Vai su Coolify →{" "}
                  <a
                    href="http://178.104.36.242:8000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    178.104.36.242:8000 <ExternalLink size={10} className="inline" />
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[11px] font-bold">
                  2
                </span>
                <span>
                  Apri l&apos;app <strong>Connector</strong> → Environment Variables → aggiungi{" "}
                  <code className="font-mono">SECRET_NAME = &lt;valore&gt;</code>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[11px] font-bold">
                  3
                </span>
                <span>
                  Apri l&apos;app del prodotto target (es. <strong>Ditto</strong>) → Environment Variables → stesso
                  nome, <strong>stesso valore</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-[11px] font-bold">
                  4
                </span>
                <span>Restart entrambe le app (o redeploy)</span>
              </div>
            </div>
            <p className="text-xs text-[var(--color-fg-muted)] pt-2">
              Per generare un valore random sicuro:{" "}
              <code className="font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">openssl rand -hex 32</code>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <KeyRound size={14} /> Stato dei secret
          </span>
        </CardTitle>
        <p className="text-xs text-[var(--color-fg-muted)] mb-3">
          Mostro solo se il valore è settato sull&apos;app Connector. Lo stesso valore deve essere anche sul prodotto
          target — quello non posso verificarlo da qui.
        </p>
        {requiredEnvVars.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            Nessuna azione attiva.{" "}
            <Link href="/products" className="text-[var(--color-accent)] hover:underline">
              Aggiungi un prodotto
            </Link>{" "}
            per iniziare.
          </p>
        ) : (
          <ul className="space-y-2">
            {requiredEnvVars.map((v) => (
              <li key={v} className="flex items-center justify-between text-sm">
                <span className="font-mono">{v}</span>
                {process.env[v] ? <Badge variant="success">presente su Connector</Badge> : <Badge variant="danger">manca</Badge>}
              </li>
            ))}
          </ul>
        )}
        {missing.length > 0 && (
          <p className="text-xs text-[var(--color-warning)] mt-3">
            ⚠ {missing.length} env var{missing.length === 1 ? "" : "s"} non settat{missing.length === 1 ? "a" : "e"} su
            Connector — i run di queste azioni falliranno con <span className="font-mono">missing secret</span>.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>Schedule attivi</CardTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nessuna azione attiva.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map(({ action, product }) => (
              <li key={action.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-[var(--color-fg-muted)]">{product?.name ?? "—"}</span> /{" "}
                  <span className="font-medium">{action.name}</span>
                </span>
                <span className="text-xs text-[var(--color-fg-muted)]">{describeCron(action.cron)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
