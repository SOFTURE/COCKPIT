// Paths the session guard (proxy.ts) lets through without a cookie: the deploy's health probe, the MCP endpoint
// (it authenticates by token), and the public OAuth routes and discovery documents assistants call before anyone
// signs in. The consent page and its decision stay guarded: they check the session themselves.
export const PUBLIC_PATHS: readonly string[] = [
  "/api/health",
  "/api/mcp",
  "/api/oauth/token",
  "/api/oauth/register",
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
];
