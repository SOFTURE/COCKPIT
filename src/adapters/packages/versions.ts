// Version order for "behind" (CT-1): major.minor.patch compared as numbers, a prerelease below its release. A version
// that is not of that shape compares as unknown, never as behind.

interface ParsedVersion {
  readonly core: readonly [number, number, number];
  readonly prerelease: string | null;
}

function parseVersion(version: string): ParsedVersion | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version.trim());
  if (match === null) {
    return null;
  }
  return { core: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: match[4] ?? null };
}

/** Negative when `left` is older, positive when newer, 0 when equal; null when either is not a version. */
export function compareVersions(left: string, right: string): number | null {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (a === null || b === null) {
    return null;
  }
  for (let index = 0; index < 3; index += 1) {
    const difference = (a.core[index] ?? 0) - (b.core[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  if (a.prerelease === b.prerelease) {
    return 0;
  }
  if (a.prerelease === null) {
    return 1;
  }
  if (b.prerelease === null) {
    return -1;
  }
  return a.prerelease.localeCompare(b.prerelease, "en", { numeric: true });
}

/** Whether the locked version is older than the newest published; false when either is unknown. */
export function isBehind(locked: string | null, latest: string | null): boolean {
  if (locked === null || latest === null) {
    return false;
  }
  const order = compareVersions(locked, latest);
  return order !== null && order < 0;
}
