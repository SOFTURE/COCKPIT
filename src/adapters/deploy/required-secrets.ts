// The secrets a compose file requires, by the rule `softure-deploy env render` (@softure-ai/deploy) renders them into
// the production env file: every `${NAME:?…}` and `${NAME?…}`, comments included; an escaped `$${…}` is skipped.

/** The compose file `softure-deploy init` writes and `env render` reads by default. */
export const COMPOSE_FILE = "docker/prod/docker-compose.yml";

const REQUIRED_NAME = /(\$*)\$\{([A-Za-z_][A-Za-z0-9_]*):?\?/g;

/** The distinct names the compose file requires, sorted. */
export function getRequiredNames(compose: string): string[] {
  const names = new Set<string>();
  for (const match of compose.matchAll(REQUIRED_NAME)) {
    // `$$` is a literal dollar, so an odd number of extra dollars before `${` (`$${`, `$$$${`) escapes it.
    const isEscaped = (match[1] ?? "").length % 2 === 1;
    if (!isEscaped && match[2] !== undefined) {
      names.add(match[2]);
    }
  }
  return [...names].sort();
}

/** The names `current` requires that `deployed` did not, sorted. */
export function getAddedNames(deployed: string, current: string): string[] {
  const before = new Set(getRequiredNames(deployed));
  return getRequiredNames(current).filter((name) => !before.has(name));
}
