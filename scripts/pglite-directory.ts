// PGlite creates its data folder but not the folders above it: make them first for a `pglite://<dir>` URL.
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export async function ensurePgliteParent(url: string): Promise<void> {
  if (!url.startsWith("pglite://") || url === "pglite://") {
    return;
  }
  await mkdir(dirname(url.slice("pglite://".length)), { recursive: true });
}
