import { config } from "../../core/config.js";
import type { HealthCheckResponse } from "./schemas.js";

export function getHealth(): HealthCheckResponse {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: config.APP_VERSION,
  };
}
