// The pull requests merged into the main branch since a release, from the commits the compare API lists: a GitHub
// merge commit ("Merge pull request #N from …") and a squash commit ("Title (#N)") both name their pull request on the
// first line. A commit that names none (a direct push, a merge of the main branch into a branch) is not counted.

const MERGE_COMMIT = /^Merge pull request #(\d+)\b/;
const SQUASH_COMMIT = /\(#(\d+)\)\s*$/;

function getPullRequestNumber(message: string): string | null {
  const firstLine = message.split("\n", 1)[0] ?? "";
  return MERGE_COMMIT.exec(firstLine)?.[1] ?? SQUASH_COMMIT.exec(firstLine)?.[1] ?? null;
}

/** How many distinct pull requests the commit messages name. */
export function countMergedPullRequests(messages: readonly string[]): number {
  const numbers = new Set(messages.map(getPullRequestNumber).filter((number): number is string => number !== null));
  return numbers.size;
}
