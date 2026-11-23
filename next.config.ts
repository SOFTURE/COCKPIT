import { withDatabaseBuild } from "@softure-ai/db/next-config";
import { withBuildInfo } from "@softure-ai/ops/next-config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OpenTelemetry's SDK stays out of the bundle so its module hooks run in Node itself.
  serverExternalPackages: ["@softure-ai/observability", "@electric-sql/pglite"],
  poweredByHeader: false,
  // The container image runs the standalone server (CMP-8); local runs and the e2e use `next start`.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  turbopack: { root: import.meta.dirname },
};

export default withBuildInfo(withDatabaseBuild(nextConfig, { host: "vps", appDir: import.meta.dirname }));
