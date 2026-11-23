import { ADMIN_ROLE } from "@softure-ai/auth";
import { hasRole, LogoutButton } from "@softure-ai/auth/next";
import { Button, PageHeader } from "@softure-ai/theme-notion";
import Link from "next/link";
import { getMessages } from "../../../messages/index.ts";
import config, { TEAM_PATH } from "../../../softure.config.ts";
import { AddRepositoryForm } from "../../../src/projects/add-repository-form.tsx";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { loadWatchedRepositories } from "../../../src/projects/load-repositories.ts";
import { WatchedRepositoryList } from "../../../src/projects/watched-repository-list.tsx";
import { addRepositoryAction, removeRepositoryAction } from "./actions.ts";

export default async function SettingsPage() {
  const messages = getMessages(config.locale);
  const copy = messages.settings;
  const [repositories, isAdmin] = await Promise.all([loadWatchedRepositories(), hasRole(ADMIN_ROLE)]);
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <section aria-labelledby="repositories-heading" className="grid gap-3 py-4">
        <div className="grid gap-1">
          <h2 id="repositories-heading" className="text-heading-3">
            {messages.repositories.heading}
          </h2>
          <p className="text-small text-muted-foreground">{messages.repositories.description}</p>
        </div>
        <p className="text-small">
          <Link href="/scan-status" className="underline underline-offset-2">
            {messages.scan.settingsLink}
          </Link>
          <span className="text-muted-foreground"> · {messages.scan.settingsHint}</span>
        </p>
        <AddRepositoryForm copy={messages.repositories} action={addRepositoryAction} />
        <WatchedRepositoryList
          repositories={repositories}
          copy={messages.repositories}
          formatTime={createTimeFormatter(config.locale, config.timezone)}
          removeAction={removeRepositoryAction}
        />
      </section>
      {isAdmin ? (
        <section aria-labelledby="team-heading" className="grid gap-3 py-4">
          <h2 id="team-heading" className="text-heading-3">
            {copy.teamHeading}
          </h2>
          <p className="text-small">
            <Link href={TEAM_PATH} className="underline underline-offset-2">
              {copy.teamLink}
            </Link>
            <span className="text-muted-foreground"> · {copy.teamHint}</span>
          </p>
        </section>
      ) : null}
      <section aria-labelledby="account-heading" className="grid gap-3 py-4">
        <h2 id="account-heading" className="text-heading-3">
          {copy.accountHeading}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="touch" className="md:h-7 md:px-2.5">
            <Link href="/account/password">{copy.changePassword}</Link>
          </Button>
          <Button asChild variant="outline" size="touch" className="md:h-7 md:px-2.5">
            <Link href="/account/mcp">{copy.assistantAccess}</Link>
          </Button>
          <LogoutButton variant="ghost" />
        </div>
      </section>
    </>
  );
}
