import { ADMIN_ROLE } from "@softure-ai/auth";
import { getAuthMessages, hasRole } from "@softure-ai/auth/next";
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@softure-ai/theme-notion";
import Link from "next/link";
import type { ReactNode } from "react";
import { getMessages } from "../../../messages/index.ts";
import config, { TEAM_PATH } from "../../../softure.config.ts";
import { AddRepositoryForm } from "../../../src/projects/add-repository-form.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { loadRepositorySuggestions } from "../../../src/projects/load-repository-suggestions.ts";
import { WatchedRepositoryList } from "../../../src/projects/watched-repository-list.tsx";
import { SettingsRow } from "../../../src/settings/settings-row.tsx";
import { SignOutForm } from "../../../src/settings/sign-out-form.tsx";
import { addRepositoryAction, removeRepositoryAction } from "./actions.ts";

// Every action on this screen: 44 px on a phone, the theme's 28 px control from md up.
const ACTION_SIZE = "md:h-7 md:px-2.5";

interface SettingsCardProps {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly children?: ReactNode;
}

function SettingsCard({ id, title, description, action, children }: SettingsCardProps) {
  return (
    <Card aria-labelledby={id} role="region" className="gap-5 py-5">
      <CardHeader className="px-5">
        <CardTitle>
          <h2 id={id} className="text-heading-3">
            {title}
          </h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        {action === undefined ? null : <CardAction>{action}</CardAction>}
      </CardHeader>
      {children === undefined ? null : <CardContent className="px-5">{children}</CardContent>}
    </Card>
  );
}

function ActionLink({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return (
    <Button asChild variant="outline" size="touch" className={ACTION_SIZE}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export default async function SettingsPage() {
  const messages = getMessages(config.locale);
  const copy = messages.settings;
  const [repositories, isAdmin] = await Promise.all([loadWatchedRepositories(), hasRole(ADMIN_ROLE)]);
  const suggestions = await loadRepositorySuggestions(repositories);
  return (
    <div className="mx-auto grid w-full max-w-content-width gap-4">
      <PageHeader title={copy.title} description={copy.description} />
      <SettingsCard
        id="repositories-heading"
        title={messages.repositories.heading}
        description={messages.repositories.description}
        action={<ActionLink href="/scan-status">{messages.scan.settingsLink}</ActionLink>}
      >
        <div className="grid gap-4">
          <AddRepositoryForm copy={messages.repositories} suggestions={suggestions} action={addRepositoryAction} />
          <WatchedRepositoryList
            repositories={repositories}
            copy={messages.repositories}
            formatTime={createTimeFormatter(config.locale, config.timezone)}
            removeAction={removeRepositoryAction}
          />
        </div>
      </SettingsCard>
      {isAdmin ? (
        <SettingsCard
          id="team-heading"
          title={copy.teamHeading}
          description={copy.teamHint}
          action={<ActionLink href={TEAM_PATH}>{copy.teamLink}</ActionLink>}
        />
      ) : null}
      <SettingsCard id="account-heading" title={copy.accountHeading} description={copy.accountHint}>
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
      </SettingsCard>
    </div>
  );
}
