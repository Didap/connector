import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  timezone: text("timezone").notNull().default("Europe/Rome"),
  capabilitiesJson: text("capabilities_json"),
  capabilitiesProbedAt: integer("capabilities_probed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const actions = sqliteTable(
  "actions",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    path: text("path").notNull(),
    cron: text("cron").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    paramsJson: text("params_json").notNull(),
    signatureHeader: text("signature_header").notNull().default("X-Ditto-Signature"),
    secretEnvVar: text("secret_env_var").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    productIdx: index("actions_product_idx").on(t.productId),
  }),
);

export const runs = sqliteTable(
  "runs",
  {
    id: text("id").primaryKey(),
    actionId: text("action_id")
      .notNull()
      .references(() => actions.id, { onDelete: "cascade" }),
    triggeredBy: text("triggered_by").notNull(),
    startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    status: text("status").notNull(),
    httpStatus: integer("http_status"),
    durationMs: integer("duration_ms"),
    reportJson: text("report_json"),
    reportMd: text("report_md"),
    errorMessage: text("error_message"),
  },
  (t) => ({
    actionStartedIdx: index("runs_action_started_idx").on(t.actionId, t.startedAt),
    statusIdx: index("runs_status_idx").on(t.status),
  }),
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Action = typeof actions.$inferSelect;
export type Run = typeof runs.$inferSelect;
