import type { HealthCheckResponse } from "./schemas.js";

export function getHealth(): HealthCheckResponse {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  };
}
