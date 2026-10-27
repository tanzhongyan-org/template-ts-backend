import type { RouterRoute } from "hono/types";

function matchesPattern(pattern: string, path: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
}

/** Methods the app serves on `path`; used to answer 405 instead of 404. */
export function allowedMethods(routes: RouterRoute[], path: string): string[] {
  const methods = new Set<string>();
  for (const route of routes) {
    if (route.method !== "ALL" && matchesPattern(route.path, path)) methods.add(route.method);
  }
  return [...methods].sort();
}
