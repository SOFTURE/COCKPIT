// Paths the session guard (proxy.ts) lets through without a cookie: the deploy's health probe, the digest's
// unsubscribe page and one-click route (for whoever got the mail), the tab and home screen icons (the login page
// shows them too), the MCP endpoint
// (it authenticates by token), and the public OAuth routes and discovery documents assistants call before anyone
// signs in. The consent page and its decision stay guarded: they check the session themselves.
export const PUBLIC_PATHS: readonly string[] = [
  "/api/health",
  "/unsubscribe",
  "/api/mailing/unsubscribe",
  "/icon",
  "/apple-icon",
  "/api/mcp",
  "/api/oauth/token",
  "/api/oauth/register",
  "/.well-known/oauth-authorization-server",
  "/.well-known/oauth-protected-resource",
];
