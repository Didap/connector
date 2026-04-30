import "server-only";
import cron, { type ScheduledTask } from "node-cron";
import { db } from "@/lib/db/client";
import { actions, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invokeAction } from "@/lib/caller/invoke";

interface SchedulerState {
  jobs: Map<string, ScheduledTask>;
  started: boolean;
}

const globalKey = "__connector_scheduler__";
const g = globalThis as unknown as { [globalKey]?: SchedulerState };
if (!g[globalKey]) {
  g[globalKey] = { jobs: new Map(), started: false };
}
const state = g[globalKey]!;

export async function startScheduler() {
  if (state.started) {
    await reload();
    return;
  }
  state.started = true;
  await reload();
  console.log(`[scheduler] started with ${state.jobs.size} job(s)`);
}

export async function reload() {
  for (const [, job] of state.jobs) {
    job.stop();
  }
  state.jobs.clear();

  const rows = await db
    .select({
      action: actions,
      product: products,
    })
    .from(actions)
    .leftJoin(products, eq(actions.productId, products.id))
    .where(eq(actions.enabled, true));

  for (const { action, product } of rows) {
    if (!product) continue;
    if (!cron.validate(action.cron)) {
      console.warn(`[scheduler] invalid cron "${action.cron}" for action ${action.id}`);
      continue;
    }
    const job = cron.schedule(
      action.cron,
      async () => {
        try {
          await invokeAction(action.id, "cron");
        } catch (err) {
          console.error(`[scheduler] action ${action.id} failed:`, err);
        }
      },
      { timezone: product.timezone },
    );
    state.jobs.set(action.id, job);
  }

  console.log(`[scheduler] reloaded — ${state.jobs.size} active job(s)`);
}

export function getActiveJobs(): string[] {
  return Array.from(state.jobs.keys());
}
