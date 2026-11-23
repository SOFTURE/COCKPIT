// Private by default: a visitor without a session cookie is sent to the login page. The public paths (health probe,
// MCP endpoint, OAuth token and registration, discovery) stay open. The guard only checks that the cookie is there;
// every page and action calls requireUser().
import { createAuthGuard } from "@softure-ai/auth/proxy";
import { NextResponse, type NextRequest } from "next/server";
import softureConfig from "./softure.config.ts";
import { PUBLIC_PATHS } from "./src/security/public-paths.ts";

const guard = createAuthGuard(softureConfig, { protect: ["/"], exclude: PUBLIC_PATHS });

export function proxy(request: NextRequest): Response {
  return guard(request) ?? NextResponse.next();
}

// Static files never need the guard.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
