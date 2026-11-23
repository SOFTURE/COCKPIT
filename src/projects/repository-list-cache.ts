// The repositories the access token can read, kept in the server process so Settings does not page through the forge
// on every visit (CV-4). A fresh list is served as it is; a stale one is served at once while one background read
// replaces it; a failed read keeps the last good list. Reads that arrive while the forge answers share that read.
import type { Clock } from "@softure-ai/core";
import type { ForgeRead } from "../forge/client.ts";

export interface RepositoryList {
  readonly names: readonly string[];
  readonly readAt: Date;
}

export interface RepositoryListCacheOptions {
  /** Reads the list from the forge. */
  readonly list: () => Promise<ForgeRead<string[]>>;
  readonly clock: Clock;
  /** How long a list is served without a new read. */
  readonly freshMs: number;
  /** Called with the failure kind when a read fails; the last good list stays. */
  readonly onFailure?: (kind: string) => void;
}

export interface RepositoryListCache {
  /** The list, read from the forge only when there is none or it is stale; `null` while no read has succeeded. */
  read(): Promise<RepositoryList | null>;
  /** Reads the forge now, even when the list is fresh; returns the last good list when the read fails. */
  refresh(): Promise<RepositoryList | null>;
  /** Resolves once no forge read is running (for tests and the refresh action). */
  settled(): Promise<void>;
}

export function createRepositoryListCache({ list, clock, freshMs, onFailure }: RepositoryListCacheOptions): RepositoryListCache {
  let current: RepositoryList | null = null;
  let running: Promise<RepositoryList | null> | null = null;

  function startRead(): Promise<RepositoryList | null> {
    if (running !== null) {
      return running;
    }
    const readAt = clock.now();
    running = list()
      .then((answer) => {
        if (answer.ok) {
          current = { names: answer.value, readAt };
        } else {
          onFailure?.(answer.kind);
        }
        return current;
      })
      .catch((error: unknown) => {
        // A thrown read is a bug in the client; the page keeps the last good list instead of failing.
        onFailure?.(error instanceof Error ? error.message : "unexpected");
        return current;
      })
      .finally(() => {
        running = null;
      });
    return running;
  }

  function isFresh(entry: RepositoryList): boolean {
    return clock.now().getTime() - entry.readAt.getTime() < freshMs;
  }

  return {
    read: async () => {
      if (current === null) {
        return startRead();
      }
      if (!isFresh(current)) {
        // Deliberately not awaited: the stale list answers now, the background read replaces it for the next visit.
        void startRead();
      }
      return current;
    },
    refresh: () => startRead(),
    settled: async () => {
      await running;
    },
  };
}
