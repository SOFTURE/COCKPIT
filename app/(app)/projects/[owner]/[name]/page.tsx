// A watched project's page (FR-10): its active roadmap items with their stages, queued roadmaps, open changes, the
// owner's entries for this project (answered as in the inbox, first when there are any), links to the repository and to its history (FR-11),
// and its health from observability and its deploy state when it reports them (FR-17).
import { PageHeader } from "@softure-ai/theme-notion";
import { ExternalLink, FileQuestion, History } from "lucide-react";
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../../messages/index.ts";
import config from "../../../../../softure.config.ts";
import { DeployDetails } from "../../../../../src/adapters/deploy/deploy-details.tsx";
import { loadProjectDeploy } from "../../../../../src/adapters/deploy/load-deploy.ts";
import { HealthDetails } from "../../../../../src/adapters/observability/health-chip.tsx";
import { loadProjectHealth } from "../../../../../src/adapters/observability/load-health.ts";
import { parseRepositoryName } from "../../../../../src/forge/repository-name.ts";
import { loadProjectPage } from "../../../../../src/project-page/load-project-page.ts";
import {
  ActionLink,
  ChangesSection,
  EntriesSection,
  QueuedSection,
  ReadFailureNotice,
  RoadmapSection,
} from "../../../../../src/project-page/project-page-sections.tsx";
import { createTimeFormatter } from "../../../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../../../src/projects/load-repositories.ts";
import { getRepositoryAccessStatus } from "../../../../../src/projects/repository-copy.ts";
import { RepositoryStatus } from "../../../../../src/projects/repository-status.tsx";
import { ReadStatus } from "../../../../../src/scan/read-status.tsx";
import { EmptyState } from "../../../../../src/shell/empty-page.tsx";
import { SectionCard } from "../../../../../src/shell/section-card.tsx";
import { answerEntryAction } from "../../../inbox/answer/actions.ts";

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
  const [page, health, deploy] = await Promise.all([loadProjectPage(repository), loadProjectHealth(repository.key), loadProjectDeploy(repository.key)]);
  const messages = getMessages(config.locale);
  const copy = messages.projectPage;
  const scanCopy = messages.scan;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const access = getRepositoryAccessStatus(repository);
  const hasProduction = health.kind !== "none" || deploy.kind !== "none";
  return (
    <div className="mx-auto grid w-full max-w-content-width gap-4">
      <PageHeader
        title={repository.fullName}
        crumbsLabel={messages.projectPage.crumbsLabel}
        crumbs={[{ label: messages.projectPage.crumbProjects, href: "/projects" }, { label: repository.fullName }]}
        description={copy.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionLink href={`/projects/${repository.fullName}/history`}>
              <History aria-hidden="true" />
              {copy.openHistory}
            </ActionLink>
            <ActionLink href={page.links.repository} isExternal>
              <ExternalLink aria-hidden="true" />
              {copy.openRepository}
            </ActionLink>
          </div>
        }
      />
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-small">
        <ReadStatus status={page.readStatus} copy={scanCopy} />
        {/* The access check of Settings, only when it found a missing permission: a readable one repeats the read status. */}
        {access === "missing_permissions" ? <RepositoryStatus status={access} copy={messages.repositories} /> : null}
        <span className="text-muted-foreground">{page.readAt === null ? copy.neverRead : fillMessage(copy.readAt, { time: formatTime(page.readAt) })}</span>
        {page.state === null ? null : <span className="text-muted-foreground">{fillMessage(copy.stateUpdated, { date: page.state.updatedAt.slice(0, 10) })}</span>}
      </div>
      {page.failure === null ? null : (
        <ReadFailureNotice
          failure={page.failure}
          reason={scanCopy.reasons[page.failure.status]}
          statusWord={scanCopy.status[page.failure.status]}
          copy={copy}
          formatTime={formatTime}
        />
      )}
      {page.entries.length === 0 ? null : <EntriesSection page={page} copy={copy} inboxCopy={messages.inbox} answerAction={answerEntryAction} />}
      {page.state === null ? (
        <EmptyState icon={FileQuestion} title={copy.noStateTitle} description={copy.noStateDescription} />
      ) : (
        <>
          <RoadmapSection roadmap={page.state.activeRoadmap} copy={copy} statusCopy={messages.roadmapView} />
          <QueuedSection queued={page.state.queued} copy={copy} />
          <ChangesSection changes={page.state.openChanges} copy={copy} />
        </>
      )}
      {hasProduction ? (
        <SectionCard id="production" title={copy.productionTitle} description={copy.productionHint}>
          <div className="grid gap-4">
            <HealthDetails health={health} copy={messages.health} />
            <DeployDetails deploy={deploy} copy={messages.deploy} formatTime={formatTime} />
          </div>
        </SectionCard>
      ) : null}
      {page.entries.length === 0 ? <EntriesSection page={page} copy={copy} inboxCopy={messages.inbox} answerAction={answerEntryAction} /> : null}
    </div>
  );
}
