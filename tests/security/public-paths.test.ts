import { createAuthGuard } from "@softure-ai/auth/proxy";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import config from "../../softure.config.ts";
import { PUBLIC_PATHS } from "../../src/security/public-paths.ts";

const guard = createAuthGuard(config, { protect: ["/"], exclude: PUBLIC_PATHS });

function isRedirected(path: string): boolean {
  return guard(new NextRequest(`http://localhost:3000${path}`, { method: path.startsWith("/api/") ? "POST" : "GET" })) !== null;
}

describe("the session guard's public paths", () => {
  it("lets assistants reach the MCP endpoint, the OAuth token and registration routes and discovery without a cookie", () => {
    for (const path of ["/api/mcp", "/api/oauth/token", "/api/oauth/register", "/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource/api/mcp", "/api/health", "/unsubscribe", "/api/mailing/unsubscribe"]) {
      expect(isRedirected(path), path).toBe(false);
    }
  });

  it("keeps the token page, the consent page and its decision behind the session", () => {
    for (const path of ["/account/mcp", "/oauth/authorize", "/api/oauth/authorize", "/inbox"]) {
      expect(isRedirected(path), path).toBe(true);
    }
  });
});
