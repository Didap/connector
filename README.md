# Connector

Multi-product orchestrator for SEO/GEO/SEM monitoring. Holds the cron, the
secrets, and the report history; fires HMAC-signed webhooks at each product
on schedule. First wired product: Ditto (`POST /api/agents/geo-pulse`).

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in CONNECTOR_PASSWORD_HASH (bcrypt), SESSION_SECRET, DITTO_AGENT_SECRET
npm run db:migrate
npm run dev
```

Open http://localhost:3000 → first visit lands on `/setup` to create the
admin account.

## Add a product

1. **Products → New** — name, base URL (e.g. `https://ditto.design`),
   timezone. The form's "Probe" button hits the product's `GET` capabilities
   endpoint and shows which backends are wired (PostHog, Tavily…).
2. **Add an action** under that product:
   - `kind`: `geo-pulse` (only kind shipped today)
   - `path`: `/api/agents/geo-pulse`
   - `cron`: standard 5-field cron, evaluated in the product's timezone
   - `params`: queries, brand, competitors, windowDays
   - `secretEnvVar`: name of the env var holding the HMAC secret
     (e.g. `DITTO_AGENT_SECRET`). The **value** lives only in env, never
     in the DB.

The scheduler picks up the new action immediately (hot-reload) and starts
firing on its cron. Use **Run now** to trigger ad hoc.

## Wire contract

Mirror of [`/Users/w/Ditto/info.md`](https://github.com/Didap/ditto/blob/main/info.md):

- `X-Ditto-Signature: t=<unix-seconds>,v1=<hmac-sha256-hex>`
- HMAC-SHA256 over `${timestamp}.${rawJsonBody}`
- ±300s replay window, constant-time comparison
- Errors: `AGENT_SIGNATURE_MISSING|MALFORMED|EXPIRED|INVALID`

The conductor signs outgoing requests via [`src/lib/caller/signature.ts`](src/lib/caller/signature.ts);
the algorithm is identical to Ditto's verifier.

## Deploy (Coolify)

Push to `https://github.com/Didap/connector.git`. Coolify build pack:
`dockerfile`. Persistent volume on `/app/data` (SQLite lives there).

Required env vars on Coolify:

| Var | Purpose |
|---|---|
| `CONNECTOR_PASSWORD_HASH` | bcrypt hash of admin password |
| `SESSION_SECRET` | 32+ random bytes (hex) for cookie HMAC |
| `DATABASE_URL` | `file:/app/data/conductor.db` |
| `DITTO_AGENT_SECRET` | shared secret for Ditto's webhook |

## Adding a new product/action kind

The conductor is kind-agnostic in `invoke.ts` — it sends params, stores the
opaque report. To add a custom UI for a new kind:

1. Add the kind to `ActionKind` union in `src/lib/types.ts`.
2. Add a Zod schema for that kind's params.
3. Add a chart/widget under `src/components/` and render it conditionally
   from the action detail page.

## Smart monitoring

All derived from `runs.reportJson`:

- **Citation rate per query** over rolling 7/30/90d window
- **Competitor surfacing** — first-time appearance flagged
- **Recommendations diff** — new entries highlighted
- **Top events trend** — anomaly badge if drop > 50% vs trailing-4 mean
- **Tavily budget** — warning at 80%, critical at 95%
- **Capabilities drift** — detect missing backends after probe
