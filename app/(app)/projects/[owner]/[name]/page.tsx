// A watched project's page. Until the scan reads projects (CMP-3) and the page fills in (CMP-9), it shows the
// repository's access as the Settings screen checked it.
import { PageHeader } from "@softure-ai/theme-notion";
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../../messages/index.ts";
import config from "../../../../../softure.config.ts";
import { parseRepositoryName } from "../../../../../src/forge/repository-name.ts";
import { createTimeFormatter } from "../../../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../../../src/projects/load-repositories.ts";
import { getRepositoryAccessStatus } from "../../../../../src/projects/repository-copy.ts";
import { RepositoryStatus } from "../../../../../src/projects/repository-status.tsx";

export default async function ProjectPage({ params }: { readonly params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const parsed = parseRepositoryName(`${decodeURIComponent(owner)}/${decodeURIComponent(name)}`);
  if (!parsed.ok) {
    notFound();
  }
  const repository = (await loadWatchedRepositories()).find((candidate) => candidate.key === parsed.value.key);
  if (repository === undefined) {
    notFound();
  }
  const copy = getMessages(config.locale).repositories;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <>
      <PageHeader title={repository.fullName} description={copy.projectPlaceholder} />
      <div className="grid gap-2 py-4">
        <div>
          <RepositoryStatus status={getRepositoryAccessStatus(repository)} copy={copy} />
        </div>
        <p className="text-small text-muted-foreground">{fillMessage(copy.defaultBranch, { branch: repository.defaultBranch })}</p>
        <p className="text-small text-muted-foreground">{fillMessage(copy.checkedAt, { time: formatTime(repository.checkedAt) })}</p>
      </div>
    </>
  );
}
