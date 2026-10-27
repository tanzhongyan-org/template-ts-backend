import { config } from "../../core/config.js";
import type { HealthCheckResponse } from "./schemas.js";

export function getHealth(): HealthCheckResponse {
  return {
    status: "healthy",
    appName: config.APP_NAME,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  };
}
