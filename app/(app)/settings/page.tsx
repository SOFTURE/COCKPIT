import { LogoutButton } from "@softure-ai/auth/next";
import { Button, PageHeader } from "@softure-ai/theme-notion";
import Link from "next/link";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";

export default function SettingsPage() {
  const copy = getMessages(config.locale).settings;
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <section aria-labelledby="account-heading" className="grid gap-3 py-4">
        <h2 id="account-heading" className="text-heading-3">
          {copy.accountHeading}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="touch" className="md:h-7 md:px-2.5">
            <Link href="/account/password">{copy.changePassword}</Link>
          </Button>
          <LogoutButton variant="ghost" />
        </div>
      </section>
    </>
  );
}
