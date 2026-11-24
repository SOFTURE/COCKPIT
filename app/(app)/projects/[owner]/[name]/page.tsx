// A watched project's page (FR-10): its active roadmap items with their stages, queued roadmaps, open changes, the
// owner's entries for this project (answered as in the inbox, first when there are any), links to the repository and to its history (FR-11),
// and its health from observability and its deploy state when it reports them (FR-17), and what wakes it on an owner-word issue (CV-2).
// The sections are tabs with icons and counters (CT-5); the shown tab lives in the address (`?tab=`).
import { TabBar } from "@softure-ai/theme-notion";
import { Activity, ExternalLink, FileQuestion, GitPullRequestArrow, History, Inbox, Map as MapIcon } from "lucide-react";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { fillMessage, getMessages } from "../../../../../messages/index.ts";
import config from "../../../../../softure.config.ts";
import { PageLayout } from "../../../../../src/shell/page-layout.tsx";
import { DeployDetails } from "../../../../../src/adapters/deploy/deploy-details.tsx";
import { loadProjectDeploy } from "../../../../../src/adapters/deploy/load-deploy.ts";
import { WakeDetails } from "../../../../../src/adapters/wake/wake-chip.tsx";
import { loadProjectWake } from "../../../../../src/adapters/wake/load-wake.ts";
import { HealthDetails } from "../../../../../src/adapters/observability/health-chip.tsx";
import { loadProjectHealth } from "../../../../../src/adapters/observability/load-health.ts";
import { parseRepositoryName } from "../../../../../src/forge/repository-name.ts";
import { loadProjectPage } from "../../../../../src/project-page/load-project-page.ts";
import { buildProjectTabs, type ProjectTabKey } from "../../../../../src/project-page/project-tabs.ts";
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

const TAB_ICONS: Readonly<Record<ProjectTabKey, ReactNode>> = {
  waiting: <Inbox aria-hidden="true" />,
  roadmaps: <MapIcon aria-hidden="true" />,
  changes: <GitPullRequestArrow aria-hidden="true" />,
  production: <Activity aria-hidden="true" />,
};

/** The tab links are touch-sized on a phone and the theme's control height from md up (as the other actions). */
const TAB_SIZE = "md:h-control-height md:min-w-0";

export default async function ProjectPage({ params, searchParams }: {
  readonly params: Promise<{ owner: string; name: string }>;
  readonly searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}) {
  const [{ owner, name }, query] = await Promise.all([params, searchParams]);
  const parsed = parseRepositoryName(`${decodeURIComponent(owner)}/${decodeURIComponent(name)}`);
  if (!parsed.ok) {
    notFound();
  }
  const repository = (await loadWatchedRepositories()).find((candidate) => candidate.key === parsed.value.key);
  if (repository === undefined) {
    notFound();
  }
  const [page, health, deploy, wake] = await Promise.all([
    loadProjectPage(repository),
    loadProjectHealth(repository.key),
    loadProjectDeploy(repository.key),
    loadProjectWake(repository.key),
  ]);
  const messages = getMessages(config.locale);
  const copy = messages.projectPage;
  const scanCopy = messages.scan;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const access = getRepositoryAccessStatus(repository);
  const requested = query.tab;
  const tabs = buildProjectTabs({
    basePath: `/projects/${repository.fullName}`,
    requested: typeof requested === "string" ? requested : undefined,
    entries: page.entries.length,
    roadmaps: page.state === null ? null : (page.state.activeRoadmap === null ? 0 : 1) + page.state.queued.length,
    changes: page.state === null ? null : page.state.openChanges.length,
    hasProduction: health.kind !== "none" || deploy.kind !== "none",
  });
  return (
    <PageLayout
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
    >
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
      <TabBar
        label={copy.tabsLabel}
        size="touch"
        tabClassName={TAB_SIZE}
        current={tabs.current}
        tabs={tabs.tabs.map((tab) => ({ key: tab.key, label: copy.tabs[tab.key], href: tab.href, icon: TAB_ICONS[tab.key], count: tab.count }))}
      />
      <div className="grid gap-4" data-tab-panel={tabs.current}>
        {tabs.current === "waiting" ? (
          <>
            <EntriesSection page={page} copy={copy} inboxCopy={messages.inbox} answerAction={answerEntryAction} />
            <WakeDetails wake={wake} copy={messages.wake} />
          </>
        ) : null}
        {(tabs.current === "roadmaps" || tabs.current === "changes") && page.state === null ? (
          <EmptyState icon={FileQuestion} title={copy.noStateTitle} description={copy.noStateDescription} />
        ) : null}
        {tabs.current === "roadmaps" && page.state !== null ? (
          <>
            <RoadmapSection roadmap={page.state.activeRoadmap} copy={copy} statusCopy={messages.roadmapView} />
            <QueuedSection queued={page.state.queued} copy={copy} />
          </>
        ) : null}
        {tabs.current === "changes" && page.state !== null ? <ChangesSection changes={page.state.openChanges} copy={copy} /> : null}
        {tabs.current === "production" ? (
          <SectionCard id="production" title={copy.productionTitle} description={copy.productionHint}>
            <div className="grid gap-4">
              <HealthDetails health={health} copy={messages.health} />
              <DeployDetails deploy={deploy} copy={messages.deploy} formatTime={formatTime} />
            </div>
          </SectionCard>
        ) : null}
      </div>
    </PageLayout>
  );
}
