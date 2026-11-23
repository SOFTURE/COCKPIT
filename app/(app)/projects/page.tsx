import { PageHeader } from "@softure-ai/theme-notion";
import { FolderKanban } from "lucide-react";
import { getMessages } from "../../../messages/index.ts";
import config from "../../../softure.config.ts";
import { EmptyState } from "../../../src/shell/empty-page.tsx";

export default function ProjectsPage() {
  const copy = getMessages(config.locale).projects;
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <EmptyState icon={FolderKanban} title={copy.emptyTitle} description={copy.emptyDescription} />
    </>
  );
}
