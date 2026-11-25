import { describe, expect, it } from "vitest";
import { getServiceIdentity, SERVICE_NAMESPACE } from "../../src/observability/service.ts";

describe("getServiceIdentity", () => {
  it("names the process in the cockpit namespace with the environment and the release", () => {
    expect(getServiceIdentity("worker", { APP_ENVIRONMENT: "production", SOFTURE_RELEASE: "v2026.11.25" })).toEqual({
      serviceName: "cockpit-worker",
      serviceNamespace: SERVICE_NAMESPACE,
      environment: "production",
      serviceVersion: "v2026.11.25",
    });
  });

  it("leaves the environment and the version out when they are unset or blank", () => {
    expect(getServiceIdentity("web", { APP_ENVIRONMENT: " ", SOFTURE_RELEASE: undefined })).toEqual({
      serviceName: "cockpit",
      serviceNamespace: "cockpit",
    });
  });
});
