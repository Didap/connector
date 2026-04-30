import { z } from "zod";

export const ActionKindSchema = z.enum(["geo-pulse"]);
export type ActionKind = z.infer<typeof ActionKindSchema>;

export const GeoPulseParamsSchema = z.object({
  queries: z.array(z.string().min(3).max(200)).min(1).max(20).optional(),
  brand: z.array(z.string().min(1).max(100)).min(1).max(10).optional(),
  competitors: z.array(z.string().min(1).max(100)).max(20).optional(),
  windowDays: z.number().int().min(1).max(90).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type GeoPulseParams = z.infer<typeof GeoPulseParamsSchema>;

export const GeoPulseReportSchema = z.object({
  ranAt: z.string(),
  windowDays: z.number(),
  posthog: z
    .object({
      skipped: z.boolean(),
      reason: z.string().optional(),
      topEvents: z.array(z.object({ event: z.string(), count: z.number() })).optional(),
      funnel: z.unknown().nullable().optional(),
      anomalies: z.unknown().nullable().optional(),
    })
    .passthrough(),
  aiSearch: z
    .object({
      skipped: z.boolean(),
      reason: z.string().optional(),
      results: z
        .array(
          z.object({
            query: z.string(),
            cited: z.boolean(),
            position: z.string().optional(),
            competitorsAbove: z.array(z.string()).optional(),
            rawSnippet: z.string().optional(),
            source: z.string().optional(),
          }),
        )
        .optional(),
    })
    .passthrough(),
  trends: z
    .object({
      skipped: z.boolean(),
      reason: z.string().optional(),
      items: z
        .array(
          z.object({
            source: z.string(),
            title: z.string(),
            url: z.string(),
            why: z.string().optional(),
          }),
        )
        .optional(),
    })
    .passthrough(),
  budgets: z
    .array(
      z.object({
        scope: z.string(),
        period: z.string(),
        used: z.number(),
        hardLimit: z.number(),
        remaining: z.number(),
      }),
    )
    .optional(),
  recommendations: z.array(z.string()).optional(),
});
export type GeoPulseReport = z.infer<typeof GeoPulseReportSchema>;

export const GeoPulseResponseSchema = z.object({
  jobId: z.string(),
  report: GeoPulseReportSchema,
  markdown: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type GeoPulseResponse = z.infer<typeof GeoPulseResponseSchema>;

export const CapabilitiesSchema = z.object({
  name: z.string(),
  version: z.string(),
  capabilities: z.object({
    hmacSignatureVersion: z.string(),
    maxAgeSeconds: z.number(),
    backends: z.record(z.string(), z.boolean()),
  }),
  docs: z.string().optional(),
});
export type Capabilities = z.infer<typeof CapabilitiesSchema>;
