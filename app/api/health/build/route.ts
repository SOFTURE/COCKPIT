// The build info route of @softure-ai/ops: which release, commit and process answer. The deploy's smoke check
// compares it with the tag it just sent (`build-info-path` in .github/workflows/deploy.yml). Public; no user data.
import { createBuildInfoRoute } from "@softure-ai/ops/next";

export const GET = createBuildInfoRoute();
