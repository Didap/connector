import { ensureMigrated } from "@/lib/db/client";
import { startScheduler } from "@/lib/scheduler";
import { seedAdmin } from "@/lib/seed";

try {
  ensureMigrated();
} catch (err) {
  console.error("[instrumentation] migration failed:", err);
}

seedAdmin().catch((err) => {
  console.error("[instrumentation] seed failed:", err);
});

startScheduler().catch((err) => {
  console.error("[instrumentation] scheduler start failed:", err);
});
