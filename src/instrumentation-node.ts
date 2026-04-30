import { ensureMigrated } from "@/lib/db/client";
import { startScheduler } from "@/lib/scheduler";

try {
  ensureMigrated();
} catch (err) {
  console.error("[instrumentation] migration failed:", err);
}

startScheduler().catch((err) => {
  console.error("[instrumentation] scheduler start failed:", err);
});
