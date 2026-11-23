import { requireUser } from "@softure-ai/auth/next";
import type { ReactNode } from "react";
import { getMessages } from "../../messages/index.ts";
import config from "../../softure.config.ts";
import { AppShell } from "../../src/shell/app-shell.tsx";

/** Every screen of the app: a signed-in owner only (requireUser redirects anyone else to the login page). */
export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const user = await requireUser();
  const messages = getMessages(config.locale);
  return (
    <AppShell copy={messages.shell} email={user.email} inboxCount={0} projects={[]}>
      {children}
    </AppShell>
  );
}
