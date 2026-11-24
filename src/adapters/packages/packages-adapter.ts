// The packages adapter as the scan runs it (CT-1). The forge token already reads pull requests, Actions runs and
// files; the npm registry is public (`NPM_REGISTRY_URL`, default the public registry). One registry per scan run, so
// each package is asked once per scan.
import type { FetchFunction } from "@softure-ai/core";
import type { ProjectAdapter } from "../contract.ts";
import { createNpmRegistry, getNpmRegistryUrl } from "./npm-registry.ts";
import { PACKAGES_ADAPTER_ID, type PackagesState } from "./packages-state.ts";
import { readPackages } from "./read-packages.ts";

export function createPackagesAdapter(env: Readonly<Record<string, string | undefined>>, fetch?: FetchFunction): ProjectAdapter<PackagesState> {
  const registry = createNpmRegistry(getNpmRegistryUrl(env), fetch);
  return { id: PACKAGES_ADAPTER_ID, read: (context) => readPackages({ ...context, registry }) };
}
