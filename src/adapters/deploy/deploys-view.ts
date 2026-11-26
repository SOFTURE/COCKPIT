// The Deploys page's rows (CT-2): every watched project with a deploy source, by name, with its deploy view and its
// project group (CT-35). A project without a deploy workflow is left out.
import type { StoredAdapterRead } from "../../../modules/adapters/reads.ts";
import { getDeployView, type DeployView } from "./deploy-view.ts";

export interface DeployRepository {
  readonly key: string;
  readonly fullName: string;
  /** The owner's project group; null for No group. */
  readonly groupId: number | null;
}

export interface DeployRow {
  readonly key: string;
  readonly fullName: string;
  readonly groupId: number | null;
  readonly deploy: Exclude<DeployView, { readonly kind: "none" }>;
}

export function getDeployRows(repositories: readonly DeployRepository[], reads: readonly StoredAdapterRead[]): DeployRow[] {
  return repositories
    .flatMap((repository) => {
      const deploy = getDeployView(reads, repository.key);
      return deploy.kind === "none" ? [] : [{ key: repository.key, fullName: repository.fullName, groupId: repository.groupId, deploy }];
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName));
}

/** Whether the next deploy will stop at the secret check: the compose file gained required names since production. */
export function hasNewSecrets(row: DeployRow): boolean {
  return row.deploy.kind === "state" && (row.deploy.state.waiting?.secrets?.added.length ?? 0) > 0;
}
