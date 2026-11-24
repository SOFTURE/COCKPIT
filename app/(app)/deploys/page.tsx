// Deploys (CT-2, FR-17): what waits for each app's next deploy, so a deploy that would stop at the secret check shows
// before anyone runs it. Apps without a deploy workflow are not listed.
import { Rocket } from "lucide-react";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { DeploysList } from "../../../src/adapters/deploy/deploys-list.tsx";
import { loadDeploys } from "../../../src/adapters/deploy/load-deploys.ts";
import { createTimeFormatter } from "../../../src/projects/format-time.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";
import { PageLayout } from "../../../src/shell/page-layout.tsx";

export default async function DeploysPage() {
  const messages = getMessages(config.locale);
  const copy = messages.deploys;
  const rows = await loadDeploys();
  const formatTime = createTimeFormatter(config.locale, config.timezone);
  return (
    <PageLayout title={copy.title} description={copy.description}>
      {rows.length === 0 ? (
        <EmptyState icon={Rocket} title={copy.emptyTitle} description={copy.emptyDescription} />
      ) : (
        <DeploysList rows={rows} copy={{ deploys: copy, deploy: messages.deploy }} formatTime={formatTime} />
      )}
    </PageLayout>
  );
}
