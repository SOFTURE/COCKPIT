// Private by default: a visitor without a session cookie is sent to the login page. The health endpoint stays open
// for the deploy's probe, and the digest's unsubscribe page and one-click route for whoever got the mail. The guard only checks that the cookie is there; every page and action calls requireUser().
import { createAuthGuard } from "@softure-ai/auth/proxy";
import { NextResponse, type NextRequest } from "next/server";
import softureConfig from "./softure.config.ts";

const guard = createAuthGuard(softureConfig, { protect: ["/"], exclude: ["/api/health", "/unsubscribe", "/api/mailing/unsubscribe"] });

export function proxy(request: NextRequest): Response {
  return guard(request) ?? NextResponse.next();
}

// Static files never need the guard.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
