import "server-only";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { actions, products, runs } from "@/lib/db/schema";
import { signRequest } from "./signature";

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;

interface InvokeResult {
  runId: string;
  status: "ok" | "error";
  httpStatus?: number;
  errorMessage?: string;
}

export async function invokeAction(
  actionId: string,
  triggeredBy: "cron" | "manual" = "manual",
): Promise<InvokeResult> {
  const action = await db.query.actions.findFirst({ where: eq(actions.id, actionId) });
  if (!action) throw new Error(`action ${actionId} not found`);
  const product = await db.query.products.findFirst({ where: eq(products.id, action.productId) });
  if (!product) throw new Error(`product ${action.productId} not found`);

  const runId = `run_${nanoid(12)}`;
  const startedAt = new Date();

  await db.insert(runs).values({
    id: runId,
    actionId,
    triggeredBy,
    startedAt,
    status: "running",
  });

  const secret = process.env[action.secretEnvVar];
  if (!secret) {
    const finishedAt = new Date();
    await db
      .update(runs)
      .set({
        status: "error",
        errorMessage: `secret env var ${action.secretEnvVar} not set on conductor`,
        finishedAt,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
      })
      .where(eq(runs.id, runId));
    return { runId, status: "error", errorMessage: "missing secret" };
  }

  const url = new URL(action.path, product.baseUrl).toString();
  const params = JSON.parse(action.paramsJson);
  const rawBody = JSON.stringify(params);

  let lastError = "";
  let lastStatus: number | undefined;
  let responseJson: { report?: unknown; markdown?: string } | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const signature = signRequest(rawBody, secret);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [action.signatureHeader]: signature,
        },
        body: rawBody,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      lastStatus = res.status;

      if (res.ok) {
        responseJson = (await res.json()) as { report?: unknown; markdown?: string };
        const finishedAt = new Date();
        await db
          .update(runs)
          .set({
            status: "ok",
            httpStatus: res.status,
            finishedAt,
            durationMs: finishedAt.getTime() - startedAt.getTime(),
            reportJson: JSON.stringify(responseJson.report ?? null),
            reportMd: responseJson.markdown ?? null,
          })
          .where(eq(runs.id, runId));
        return { runId, status: "ok", httpStatus: res.status };
      }

      const errBody = await res.text();
      lastError = `HTTP ${res.status}: ${errBody.slice(0, 500)}`;

      if (res.status >= 400 && res.status < 500) break;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < MAX_RETRIES - 1) {
      const backoffMs = 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  const finishedAt = new Date();
  await db
    .update(runs)
    .set({
      status: "error",
      httpStatus: lastStatus,
      errorMessage: lastError,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    })
    .where(eq(runs.id, runId));
  return { runId, status: "error", httpStatus: lastStatus, errorMessage: lastError };
}

export async function probeProduct(baseUrl: string, path: string): Promise<unknown> {
  const url = new URL(path, baseUrl).toString();
  const res = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`probe failed: HTTP ${res.status}`);
  return await res.json();
}
