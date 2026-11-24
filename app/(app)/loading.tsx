// What a screen shows inside the app shell while the server renders it: links do not prefetch (AppLink), so a click
// shows this at once instead of waiting with the old screen.
import { Skeleton } from "@softure-ai/theme-notion";
import { getMessages } from "../../messages/index.ts";
import config from "../../softure.config.ts";
import { PageLayout } from "../../src/shell/page-layout.tsx";

export default function AppLoading() {
  const copy = getMessages(config.locale).shell;
  return (
    <PageLayout title={copy.loading}>
      <div role="status" aria-label={copy.loading} className="grid gap-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </PageLayout>
  );
}
