import { z } from "zod";

export const healthCheckResponseSchema = z.object({
  status: z.literal("healthy"),
  appName: z.string(),
  environment: z.string(),
  timestamp: z.string().datetime(),
});

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
