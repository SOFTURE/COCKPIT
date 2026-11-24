// Every link inside the app. No prefetch: each screen renders the whole app layout on the server, and prefetching
// every visible link (the sidebar's screens and projects, list rows) rendered it dozens of times behind each page view.
import Link from "next/link";
import type { ComponentProps } from "react";

export type AppLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

export function AppLink(props: AppLinkProps) {
  return <Link {...props} prefetch={false} />;
}
