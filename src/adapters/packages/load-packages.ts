// Every watched project's package updates for the Packages page (CT-1), from the adapters' stored reads. A project
// that is not a Node project, or was never read, is left out.
import "server-only";
import { connection } from "next/server";
import { findAdapterReads } from "../../../modules/adapters/reads.ts";
import { findRepositories } from "../../../modules/projects/queries.ts";
import { DEFAULT_FORGE_API_URL } from "../../forge/client.ts";
import { getForgeWebUrl } from "../../forge/web-url.ts";
import { getDatabase } from "../../database.ts";
import { getPackagesView, type PackagesView } from "./packages-view.ts";

export interface PackagesRow {
  readonly key: string;
  readonly fullName: string;
  /** The owner's project group; null for No group (CT-35). */
  readonly groupId: number | null;
  readonly view: Exclude<PackagesView, { readonly kind: "none" }>;
}

export interface PackagesPage {
  /** The forge's web origin, for issue links. */
  readonly webUrl: string;
  readonly rows: readonly PackagesRow[];
}

export async function loadPackagesPage(): Promise<PackagesPage> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [repositories, reads] = await Promise.all([findRepositories(db), findAdapterReads(db)]);
  if (!repositories.ok || !reads.ok) {
    throw new Error("loadPackagesPage: reading the watched projects or their adapter reads failed");
  }
  const rows = repositories.value.flatMap((repository) => {
    const view = getPackagesView(reads.value, repository.key);
    return view.kind === "none" ? [] : [{ key: repository.key, fullName: repository.fullName, groupId: repository.groupId, view }];
  });
  return { webUrl: getForgeWebUrl(process.env.FORGE_API_URL ?? DEFAULT_FORGE_API_URL), rows };
}
