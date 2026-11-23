// The forge's web origin, derived from its API base (FORGE_API_URL): links on the project page point there.

/** `https://api.github.com` → `https://github.com`; `<origin>/api/v3` (an enterprise server) → `<origin>`; any other base → its origin. */
export function getForgeWebUrl(apiUrl: string): string {
  const url = new URL(apiUrl);
  if (url.hostname === "api.github.com") {
    return "https://github.com";
  }
  return url.origin;
}

/** Links into one repository on the forge's web UI; paths are kept as the state names them. */
export interface RepositoryLinks {
  readonly repository: string;
  file(path: string): string;
  folder(path: string): string;
}

function encodePath(path: string): string {
  return path
    .replace(/^\/+/, "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function createRepositoryLinks(webUrl: string, fullName: string, branch: string): RepositoryLinks {
  const repository = `${webUrl.replace(/\/+$/, "")}/${encodePath(fullName)}`;
  const ref = encodePath(branch);
  return {
    repository,
    file: (path) => `${repository}/blob/${ref}/${encodePath(path)}`,
    folder: (path) => `${repository}/tree/${ref}/${encodePath(path)}`,
  };
}
