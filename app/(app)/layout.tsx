import { requireUser } from "@softure-ai/auth/next";
import type { ReactNode } from "react";
import { getMessages } from "../../messages/index.ts";
import config from "../../softure.config.ts";
import { loadInbox } from "../../src/inbox/load-inbox.ts";
import { loadOverview } from "../../src/overview/load-overview.ts";
import { createGroupCollator, groupProjects } from "../../src/projects/group-projects.ts";
import { loadProjectGroups } from "../../src/projects/load-project-groups.ts";
import { loadWatchedRepositories } from "../../src/projects/load-repositories.ts";
import { loadScanProgress } from "../../src/scan/load-scan-progress.ts";
import { AppShell } from "../../src/shell/app-shell.tsx";
import { RefreshControl } from "../../src/shell/refresh-control.tsx";
import { ProjectStatusIcon } from "../../src/status/project-status-badge.tsx";
import { scanNowAction } from "./scan-status/actions.ts";

/** Every screen of the app: a signed-in owner only (requireUser redirects anyone else to the login page). */
export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const user = await requireUser();
  const messages = getMessages(config.locale);
  const [repositories, groups, inbox, scanProgress] = await Promise.all([loadWatchedRepositories(), loadProjectGroups(), loadInbox(), loadScanProgress()]);
  const overview = await loadOverview(inbox);
  const projects = repositories.map((repository) => {
    const status = overview.statusByKey.get(repository.key);
    return {
      slug: repository.fullName,
      name: repository.fullName,
      groupId: repository.groupId,
      statusIcon: status === undefined ? undefined : <ProjectStatusIcon status={status} copy={messages.overview} />,
    };
  });
  // CT-33: the sidebar shows the projects in the owner's groups; it keeps this order and groups nothing itself.
  const projectSections = groupProjects(projects, groups, { collator: createGroupCollator(config.locale) });
  return (
    <AppShell
      copy={messages.shell}
      email={user.email}
      inboxCount={inbox.unansweredCount}
      projectSections={projectSections}
      headerActions={<RefreshControl copy={messages.refresh} initial={scanProgress} action={scanNowAction} />}
    >
      {children}
    </AppShell>
  );
}
