// Who COCKPIT's processes are in the telemetry backend: one namespace, one service per process, the environment and
// the release they run. The names follow the other SOFTURE apps (`<project>` and `<project>-worker`), so the same
// rules and dashboards read them. Export starts only when OTEL_EXPORTER_OTLP_ENDPOINT is set; the credential comes in
// OTEL_EXPORTER_OTLP_HEADERS (read by @softure-ai/observability itself, never by this code).

/** `service.namespace` of every COCKPIT process. */
export const SERVICE_NAMESPACE = "cockpit";

/** `service.name` of each process. */
export const SERVICE_NAMES = {
  web: "cockpit",
  worker: "cockpit-worker",
  migrate: "cockpit-migrate",
} as const;

export type ServiceRole = keyof typeof SERVICE_NAMES;

/** The paths whose requests get no trace: the container health checks poll them every few seconds. */
export const UNTRACED_PATHS = ["/api/health"] as const;

export interface ServiceIdentity {
  readonly serviceName: string;
  readonly serviceNamespace: string;
  readonly environment?: string;
  readonly serviceVersion?: string;
}

/** The identity of one process: `APP_ENVIRONMENT` (e.g. `production`) and `SOFTURE_RELEASE` (the release tag). */
export function getServiceIdentity(role: ServiceRole, env: Readonly<Record<string, string | undefined>> = process.env): ServiceIdentity {
  const environment = env.APP_ENVIRONMENT?.trim() ?? "";
  const release = env.SOFTURE_RELEASE?.trim() ?? "";
  return {
    serviceName: SERVICE_NAMES[role],
    serviceNamespace: SERVICE_NAMESPACE,
    ...(environment === "" ? {} : { environment }),
    ...(release === "" ? {} : { serviceVersion: release }),
  };
}
