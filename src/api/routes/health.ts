import { Hono } from "hono";
import { getHealth } from "../../domain/health/service.js";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  const health = getHealth();
  return c.json(health);
});
