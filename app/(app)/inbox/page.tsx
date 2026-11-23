import { PageHeader } from "@softure-ai/theme-notion";
import { Inbox } from "lucide-react";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";

export default function InboxPage() {
  const copy = getMessages(config.locale).inbox;
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <EmptyState icon={Inbox} title={copy.emptyTitle} description={copy.emptyDescription} />
    </>
  );
}
