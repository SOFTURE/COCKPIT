// The contract of COCKPIT's optional adapters (FR-17): each reads one more fact about a watched project from a
// source beside its repository (health from observability, deploy state) during the scan. A project without the
// source shows nothing extra; a source that fails shows as unknown with a reason code; a forge rate limit stops the
// scan like any other forge read.
import type { ForgeClient } from "../forge/client.ts";

export interface AdapterProject {
  readonly owner: string;
  readonly name: string;
  /** The main branch the scan reads. */
  readonly branch: string;
}

export interface AdapterContext {
  /** The scan's forge client, for files the adapter reads from the repository (read-only). */
  readonly client: ForgeClient;
  readonly project: AdapterProject;
}

/** One adapter read: what is stored (`value`, `absent`, `unknown`), or a forge rate limit that stops the scan. */
export type AdapterRead<T> =
  | { readonly status: "value"; readonly value: T }
  | { readonly status: "absent" }
  | { readonly status: "unknown"; readonly reason: string }
  | { readonly status: "rate_limited"; readonly retryAfterSeconds: number | null };

export interface ProjectAdapter<T = unknown> {
  /** Stored with every read; lowercase letters, digits and `_`. */
  readonly id: string;
  read(context: AdapterContext): Promise<AdapterRead<T>>;
}
