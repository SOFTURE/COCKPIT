import { ADMIN_ROLE } from "@softure-ai/auth";
import { getAuthMessages, hasRole } from "@softure-ai/auth/next";
import { Button } from "@softure-ai/theme-notion";
import { RotateCw } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { fillMessage, getMessages, type AppMessages } from "../../../messages/index.ts";
import config, { TEAM_PATH } from "../../../softure.config.ts";
import type { WatchedRepository } from "../../../modules/projects/queries.ts";
import { AddRepositoryForm } from "../../../src/projects/add-repository-form.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { loadRepositorySuggestions } from "../../../src/projects/load-repository-suggestions.ts";
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

interface AddRepositoryFieldProps {
  readonly copy: AppMessages["repositories"];
  readonly repositories: readonly WatchedRepository[];
}

/**
 * The add field with the token's repositories. Streamed: the page does not wait for this list, and until it arrives
 * the same field takes a typed `owner/name` (the Suspense fallback).
 */
async function AddRepositoryField({ copy, repositories }: AddRepositoryFieldProps) {
  const suggestions = await loadRepositorySuggestions(repositories);
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <div className="grid gap-2">
      <AddRepositoryForm copy={copy} suggestions={suggestions} action={addRepositoryAction} />
      {suggestions.kind === "listed" ? (
        <form action={refreshRepositoryListAction} className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
          <span>{fillMessage(copy.listReadAt, { time: formatTime(suggestions.readAt) })}</span>
          <Button type="submit" variant="ghost" size="touch" className={ACTION_SIZE}>
            <RotateCw aria-hidden="true" />
            {copy.refreshList}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export default async function SettingsPage() {
  const messages = getMessages(config.locale);
  const copy = messages.settings;
  const [repositories, isAdmin] = await Promise.all([loadWatchedRepositories(), hasRole(ADMIN_ROLE)]);
  return (
    <PageLayout title={copy.title} description={copy.description}>
      <SectionCard
        id="repositories-heading"
        title={messages.repositories.heading}
        description={messages.repositories.description}
        action={<ActionLink href="/scan-status">{messages.scan.settingsLink}</ActionLink>}
      >
        <div className="grid gap-4">
          <Suspense fallback={<AddRepositoryForm copy={messages.repositories} suggestions={{ kind: "loading" }} action={addRepositoryAction} />}>
            <AddRepositoryField copy={messages.repositories} repositories={repositories} />
          </Suspense>
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
