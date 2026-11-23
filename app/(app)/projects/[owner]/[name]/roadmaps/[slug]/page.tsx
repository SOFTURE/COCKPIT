// One roadmap of a watched project, inside COCKPIT: read from its file on the forge when opened and parsed into its
// items, orders and the owner's steps; the state's items when the file cannot be read.
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { getMessages } from "../../../../../../../messages/index.ts";
import config from "../../../../../../../softure.config.ts";
import { PageLayout } from "../../../../../../../src/shell/page-layout.tsx";
import { parseRepositoryName } from "../../../../../../../src/forge/repository-name.ts";
import { ActionLink } from "../../../../../../../src/project-page/project-page-sections.tsx";
import { loadWatchedRepositories } from "../../../../../../../src/projects/load-repositories.ts";
import { splitRoadmapTitle } from "../../../../../../../src/roadmap/build-roadmap-view.ts";
import { loadRoadmapView } from "../../../../../../../src/roadmap/load-roadmap-view.ts";
import { ChecksSection, FallbackNotice, ItemsSection, OrdersSection, RoadmapOverview } from "../../../../../../../src/roadmap/roadmap-view.tsx";

export default async function RoadmapPage({ params }: { readonly params: Promise<{ owner: string; name: string; slug: string }> }) {
  const { owner, name, slug } = await params;
  const parsed = parseRepositoryName(`${decodeURIComponent(owner)}/${decodeURIComponent(name)}`);
  if (!parsed.ok) {
    notFound();
  }
  const repository = (await loadWatchedRepositories()).find((candidate) => candidate.key === parsed.value.key);
  if (repository === undefined) {
    notFound();
  }
  const loaded = await loadRoadmapView(repository, decodeURIComponent(slug));
  if (loaded === null) {
    notFound();
  }
  const { view, fileLink } = loaded;
  const messages = getMessages(config.locale);
  const copy = messages.roadmapView;
  const pageName = splitRoadmapTitle(view.title);
  return (
    <PageLayout
      title={pageName.title}
      crumbsLabel={messages.projectPage.crumbsLabel}
      crumbs={[
        { label: messages.projectPage.crumbProjects, href: "/projects" },
        { label: repository.fullName, href: `/projects/${repository.fullName}` },
        { label: pageName.title },
      ]}
      description={[pageName.subtitle, view.heading, pageName.subtitle === null && view.heading === null ? copy.description : null].filter((part) => part !== null).join(" · ")}
      actions={
        <ActionLink href={fileLink} isExternal>
          <ExternalLink aria-hidden="true" />
          {copy.openFile}
        </ActionLink>
      }
    >
      <FallbackNotice view={view} copy={copy} />
      <RoadmapOverview view={view} copy={copy} pageCopy={messages.projectPage} />
      <ItemsSection view={view} copy={copy} />
      <ChecksSection view={view} copy={copy} />
      <OrdersSection view={view} copy={copy} />
    </PageLayout>
  );
}
