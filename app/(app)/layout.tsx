import { requireUser } from "@softure-ai/auth/next";
import type { ReactNode } from "react";
import { getMessages } from "../../messages/index.ts";
import config from "../../softure.config.ts";
import { loadInbox } from "../../src/inbox/load-inbox.ts";
import { loadOverview } from "../../src/overview/load-overview.ts";
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
  const [repositories, inbox, scanProgress] = await Promise.all([loadWatchedRepositories(), loadInbox(), loadScanProgress()]);
  const overview = await loadOverview(inbox);
  const projects = repositories.map((repository) => {
    const status = overview.statusByKey.get(repository.key);
    return {
      slug: repository.fullName,
      name: repository.fullName,
      statusIcon: status === undefined ? undefined : <ProjectStatusIcon status={status} copy={messages.overview} />,
    };
  });
  return (
    <AppShell
      copy={messages.shell}
      email={user.email}
      inboxCount={inbox.unansweredCount}
      projects={projects}
      headerActions={<RefreshControl copy={messages.refresh} initial={scanProgress} action={scanNowAction} />}
    >
      {children}
    </AppShell>
  );
}
