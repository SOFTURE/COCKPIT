import { ADMIN_ROLE } from "@softure-ai/auth";
import { getAuthMessages, hasRole } from "@softure-ai/auth/next";
import { Button } from "@softure-ai/theme-notion";
import { RotateCw } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { fillMessage, getMessages, type AppMessages } from "../../../messages/index.ts";
import config, { TEAM_PATH } from "../../../softure.config.ts";
import { AddRepositoryForm } from "../../../src/projects/add-repository-form.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { loadRepositorySuggestions, type RepositorySuggestions } from "../../../src/projects/load-repository-suggestions.ts";
import { WatchedRepositoryList } from "../../../src/projects/watched-repository-list.tsx";
import { SettingsRow } from "../../../src/settings/settings-row.tsx";
import { SignOutForm } from "../../../src/settings/sign-out-form.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";
import { SectionCard } from "../../../src/shell/section-card.tsx";
import { addRepositoryAction, refreshRepositoryListAction, removeRepositoryAction } from "./actions.ts";

// Every action on this screen: 44 px on a phone, the theme's 28 px control from md up.
const ACTION_SIZE = "md:h-7 md:px-2.5";

function ActionLink({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="touch" className={ACTION_SIZE}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

interface RepositoryListReadAtProps {
  readonly copy: AppMessages["repositories"];
  readonly suggestions: Promise<RepositorySuggestions>;
}

/**
 * When the token's repository list was read, with its refresh. Streamed: it shows once the list arrives, while the
 * Repository field above is already there (the field takes the same list as a promise, see AddRepositoryForm).
 */
async function RepositoryListReadAt({ copy, suggestions: pending }: RepositoryListReadAtProps) {
  const suggestions = await pending;
  if (suggestions.kind !== "listed") {
    return null;
  }
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <form action={refreshRepositoryListAction} className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
      <span>{fillMessage(copy.listReadAt, { time: formatTime(suggestions.readAt) })}</span>
      <Button type="submit" variant="ghost" size="touch" className={ACTION_SIZE}>
        <RotateCw aria-hidden="true" />
        {copy.refreshList}
      </Button>
    </form>
  );
}

export default async function SettingsPage() {
  const messages = getMessages(config.locale);
  const copy = messages.settings;
  const [repositories, isAdmin] = await Promise.all([loadWatchedRepositories(), hasRole(ADMIN_ROLE)]);
  // Not awaited: the page shows at once and the list joins the field when the forge answers.
  const suggestions = loadRepositorySuggestions(repositories);
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <SectionCard
        id="repositories-heading"
        title={messages.repositories.heading}
        description={messages.repositories.description}
        action={<ActionLink href="/scan-status">{messages.scan.settingsLink}</ActionLink>}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <AddRepositoryForm copy={messages.repositories} suggestions={suggestions} action={addRepositoryAction} />
            <Suspense fallback={null}>
              <RepositoryListReadAt copy={messages.repositories} suggestions={suggestions} />
            </Suspense>
          </div>
          <WatchedRepositoryList
            repositories={repositories}
            copy={messages.repositories}
            formatTime={createTimeFormatter(config.locale, config.timezone)}
            removeAction={removeRepositoryAction}
          />
        </div>
      </SectionCard>
      {isAdmin ? (
        <SectionCard
          id="team-heading"
          title={copy.teamHeading}
          description={copy.teamHint}
          action={<ActionLink href={TEAM_PATH}>{copy.teamLink}</ActionLink>}
        />
      ) : null}
      <SectionCard id="account-heading" title={copy.accountHeading} description={copy.accountHint}>
        <ul className="grid divide-y divide-border">
          <SettingsRow
            title={copy.passwordTitle}
            hint={copy.passwordHint}
            action={<ActionLink href="/account/password">{copy.changePassword}</ActionLink>}
          />
          <SettingsRow
            title={copy.assistantAccess}
            hint={copy.assistantHint}
            action={<ActionLink href="/account/mcp">{copy.assistantAction}</ActionLink>}
          />
          <SettingsRow
            title={copy.sessionTitle}
            hint={copy.sessionHint}
            action={<SignOutForm label={getAuthMessages(config).logout.submit} className={ACTION_SIZE} />}
          />
        </ul>
      </SectionCard>
    </PageLayout>
  );
}
