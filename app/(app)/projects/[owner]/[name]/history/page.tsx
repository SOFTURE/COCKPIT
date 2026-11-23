// A watched project's history (FR-11): its latest merges and releases, CI and quality-review runs and the doctor's
// findings, read from the forge when opened; a block whose read fails says why and the others still show.
import { PageHeader } from "@softure-ai/theme-notion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages } from "../../../../../../messages/index.ts";
import config from "../../../../../../softure.config.ts";
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
  const copy = getMessages(config.locale).projectHistory;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <>
      <PageHeader title={repository.fullName} description={copy.description} />
      <div className="grid gap-8 py-4">
        <p className="text-small">
          <Link href={`/projects/${repository.fullName}`} className="inline-flex items-center gap-1 underline underline-offset-2">
            <ArrowLeft aria-hidden="true" className="size-3.5 shrink-0" />
            {copy.backToProject}
          </Link>
        </p>
        <DoctorSection block={history.doctor} copy={copy} />
        <RunsSection block={history.runs} copy={copy} formatTime={formatTime} />
        <MergesSection block={history.merges} copy={copy} formatTime={formatTime} />
        <ReleasesSection block={history.releases} copy={copy} formatTime={formatTime} />
      </div>
    </>
  );
}
