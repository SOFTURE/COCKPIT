// A watched project's history (FR-11): its latest CI and quality-review runs, merges, releases and the doctor's
// findings, read from the forge when opened, as tabs with icons and counts (CT-21; the shown tab lives in the address,
// `?tab=`). A block whose read fails says why in its own tab and the others still show.
import { CircleCheckBig, GitMerge, ShieldCheck, Stethoscope, Tag } from "lucide-react";
import { notFound } from "next/navigation";
import { getMessages } from "../../../../../../messages/index.ts";
import config from "../../../../../../softure.config.ts";
import { PageLayout } from "../../../../../../src/shell/page-layout.tsx";
import { parseRepositoryName } from "../../../../../../src/forge/repository-name.ts";
import { CiSection, DoctorSection, MergesSection, QualityReviewSection, ReleasesSection } from "../../../../../../src/project-page/history/history-sections.tsx";
import { buildHistoryTabs, type HistoryTabKey } from "../../../../../../src/project-page/history/history-tabs.ts";
import { PageTabs, TabPanel } from "../../../../../../src/shell/page-tabs.tsx";
import { loadHistory } from "../../../../../../src/project-page/history/load-history.ts";
import { createTimeFormatter } from "../../../../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../../../../src/projects/load-repositories.ts";

const TAB_ICONS = { ci: CircleCheckBig, "quality-review": ShieldCheck, merges: GitMerge, releases: Tag, doctor: Stethoscope } as const satisfies Record<HistoryTabKey, unknown>;

export default async function ProjectHistoryPage({ params, searchParams }: {
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
  const history = await loadHistory(repository);
  const messages = getMessages(config.locale);
  const copy = messages.projectHistory;
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  const requested = query.tab;
  const tabs = buildHistoryTabs({
    history,
    basePath: `/projects/${repository.fullName}/history`,
    requested: typeof requested === "string" ? requested : undefined,
  });
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
      <PageTabs
        label={copy.tabsLabel}
        current={tabs.current}
        tabs={tabs.tabs.map((tab) => ({ key: tab.key, label: copy.tabs[tab.key], href: tab.href, icon: TAB_ICONS[tab.key], count: tab.count }))}
      />
      <TabPanel current={tabs.current}>
        {tabs.current === "ci" ? <CiSection block={history.runs} copy={copy} formatTime={formatTime} /> : null}
        {tabs.current === "quality-review" ? <QualityReviewSection block={history.runs} copy={copy} formatTime={formatTime} /> : null}
        {tabs.current === "merges" ? <MergesSection block={history.merges} copy={copy} formatTime={formatTime} /> : null}
        {tabs.current === "releases" ? <ReleasesSection block={history.releases} copy={copy} formatTime={formatTime} /> : null}
        {tabs.current === "doctor" ? <DoctorSection block={history.doctor} copy={copy} /> : null}
      </TabPanel>
    </PageLayout>
  );
}
