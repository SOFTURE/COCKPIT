// One roadmap of a watched project, inside COCKPIT: read from its file on the forge when opened and parsed into its
// items, orders and the owner's steps; the state's items when the file cannot be read. A queued roadmap, or one of its
// open items, is promoted to work from here.
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
import { findPromotion, isPromotableItem } from "../../../../../../../src/roadmap/promote-roadmap.ts";
import { PromoteForm } from "../../../../../../../src/roadmap/promote-form.tsx";
import { ChecksSection, FallbackNotice, ItemsSection, OrdersSection, RoadmapOverview } from "../../../../../../../src/roadmap/roadmap-view.tsx";
import { fillMessage } from "../../../../../../../messages/index.ts";
import { promoteRoadmapAction } from "./actions.ts";

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
  const { view, fileLink, promotions } = loaded;
  const messages = getMessages(config.locale);
  const copy = messages.roadmapView;
  const pageName = splitRoadmapTitle(view.title);
  const isQueued = view.kind === "queued";
  const wholePromotion = isQueued ? findPromotion(promotions, view.slug, null) : null;
  const wholeSent = wholePromotion === null ? null : { text: fillMessage(copy.promote.wholeSent, { number: wholePromotion.number }), url: wholePromotion.url, number: wholePromotion.number };
  const hasOpenItems = isQueued && view.items.some(isPromotableItem);
  const formProps = { copy: copy.promote, repositoryKey: repository.key, projectName: repository.fullName, slug: view.slug, roadmapName: view.slug, action: promoteRoadmapAction };
  const renderAction = (item: (typeof view.items)[number]) => {
    if (!isQueued || !isPromotableItem(item)) {
      return null;
    }
    const own = findPromotion(promotions, view.slug, item.id);
    const sent = own === null ? wholeSent : { text: fillMessage(copy.promote.sentNow, { number: own.number }), url: own.url, number: own.number };
    return <PromoteForm {...formProps} itemId={item.id} sent={sent} />;
  };
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
        <>
          {hasOpenItems || wholeSent !== null ? <PromoteForm {...formProps} itemId={null} sent={wholeSent} /> : null}
          <ActionLink href={fileLink} isExternal>
            <ExternalLink aria-hidden="true" />
            {copy.openFile}
          </ActionLink>
        </>
      }
    >
      <FallbackNotice view={view} copy={copy} />
      <RoadmapOverview view={view} copy={copy} pageCopy={messages.projectPage} />
      <ItemsSection view={view} copy={copy} renderAction={renderAction} />
      <ChecksSection view={view} copy={copy} />
      <OrdersSection view={view} copy={copy} />
    </PageLayout>
  );
}
