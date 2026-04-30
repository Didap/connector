import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/db/client";
import { actions, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardTitle>Secrets richiesti</CardTitle>
        <p className="text-xs text-[var(--color-fg-muted)] mb-3">
          Ogni action referenzia un nome di env var. Il <strong>valore</strong> deve essere settato nell'ambiente del
          conductor (es. su Coolify). Qui mostro solo se è presente.
        </p>
        {requiredEnvVars.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nessuna action attiva.</p>
        ) : (
          <ul className="space-y-2">
            {requiredEnvVars.map((v) => (
              <li key={v} className="flex items-center justify-between text-sm">
                <span className="font-mono">{v}</span>
                {process.env[v] ? <Badge variant="success">set</Badge> : <Badge variant="danger">missing</Badge>}
              </li>
            ))}
          </ul>
        )}
        {missing.length > 0 && (
          <p className="text-xs text-[var(--color-warning)] mt-3">
            {missing.length} env var{missing.length === 1 ? "" : "s"} mancanti — i run di queste action falliranno con
            <span className="font-mono ml-1">missing secret</span>.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>Schedule attivi</CardTitle>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">Nessuna action attiva.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map(({ action, product }) => (
              <li key={action.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="text-[var(--color-fg-muted)]">{product?.name ?? "—"}</span> /{" "}
                  <span className="font-medium">{action.name}</span>
                </span>
                <span className="text-xs text-[var(--color-fg-muted)] font-mono">
                  {action.cron} · {describeCron(action.cron)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
