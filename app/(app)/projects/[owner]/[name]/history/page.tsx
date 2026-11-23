// A watched project's history (FR-11): its latest merges and releases, CI and quality-review runs and the doctor's
// findings, read from the forge when opened; a block whose read fails says why and the others still show.
import { notFound } from "next/navigation";
import { getMessages } from "../../../../../../messages/index.ts";
import config from "../../../../../../softure.config.ts";
import { PageLayout } from "../../../../../../src/shell/page-layout.tsx";
import { parseRepositoryName } from "../../../../../../src/forge/repository-name.ts";
import { DoctorSection, MergesSection, ReleasesSection, RunsSection } from "../../../../../../src/project-page/history/history-sections.tsx";
import { loadHistory } from "../../../../../../src/project-page/history/load-history.ts";
import { createTimeFormatter } from "../../../../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../../../../src/projects/load-repositories.ts";

export default async function ProjectHistoryPage({ params }: { readonly params: Promise<{ owner: string; name: string }> }) {
  const { owner, name } = await params;
  const parsed = parseRepositoryName(`${decodeURIComponent(owner)}/${decodeURIComponent(name)}`);
  if (!parsed.ok) {
    notFound();
  }
  const repository = (await loadWatchedRepositories()).find((candidate) => candidate.key === parsed.value.key);
  if (repository === undefined) {
    notFound();
  }
  const history = await loadHistory(repository);
  const messages = getMessages(config.locale);
  const copy = messages.projectHistory;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <PageLayout
      title={repository.fullName}
      crumbsLabel={messages.projectPage.crumbsLabel}
      crumbs={[
        { label: messages.projectPage.crumbProjects, href: "/projects" },
        { label: repository.fullName, href: `/projects/${repository.fullName}` },
        { label: copy.crumbHistory },
      ]}
      description={copy.description}
    >
      <div className="grid gap-8">
        <DoctorSection block={history.doctor} copy={copy} />
        <RunsSection block={history.runs} copy={copy} formatTime={formatTime} />
        <MergesSection block={history.merges} copy={copy} formatTime={formatTime} />
        <ReleasesSection block={history.releases} copy={copy} formatTime={formatTime} />
      </div>
    </PageLayout>
  );
}
