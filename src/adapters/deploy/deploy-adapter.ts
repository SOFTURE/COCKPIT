// The deploy adapter as the scan runs it. It needs no configuration: the forge token already reads the deploy
// workflow's runs (Actions) and the releases (Contents); a project without a deploy workflow shows nothing.
import type { ProjectAdapter } from "../contract.ts";
import { DEPLOY_ADAPTER_ID, type DeployState } from "./deploy-state.ts";
import { readDeploy } from "./read-deploy.ts";

export function createDeployAdapter(): ProjectAdapter<DeployState> {
  return { id: DEPLOY_ADAPTER_ID, read: readDeploy };
}
