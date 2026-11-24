import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/pr-checks-app";
const PULL_URL = "https://forge.example.test/example-org/pr-checks-app/pull/12";
const OPEN_MARKER = "<<<cockpit:untrusted-data>>>";
const CLOSE_MARKER = "<<<cockpit:end-untrusted-data>>>";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("a project whose checks run on pull requests only shows its last merged pull request's CI, labelled", async ({ page, request }) => {
  await signIn(page, "/settings");
  await submitRepository(page, PROJECT);
  await expect(page.getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await scanUntilSettled(page, [PROJECT]);

  // The overview: the CI chip says the result, links the run and names the pull request it comes from.
  await page.goto("/projects");
  const row = page.locator(`[data-project="${PROJECT}"]`);
  await expect(row).toContainText("CI failed");
  await expect(row.getByRole("link", { name: "from PR #12" })).toHaveAttribute("href", PULL_URL);
  await expect(row.getByRole("link", { name: /^CI failed/ })).toHaveAttribute("href", "https://forge.example.test/runs/pr-checks-1201");
  await expect(row).toContainText("The CI of its last merged pull request, PR #12, failed (its main branch has no CI run).");

  // The history tab: the CI list holds the pull request's head runs, headed by the pull request.
  await page.goto(`/projects/${PROJECT}/history`);
  await expect(page.getByRole("link", { name: /its last merged pull request, PR #12/ })).toHaveAttribute("href", PULL_URL);
  const ciRuns = page.getByRole("list", { name: "Latest CI runs" }).getByRole("listitem");
  await expect(ciRuns).toHaveCount(2);

  // Over MCP the overview's CI carries the same source.
  await page.goto("/account/mcp");
  await page.getByLabel("Name", { exact: true }).fill("CI reader");
  await page.getByRole("button", { name: "Create token" }).click();
  await expect(page.getByText("This token can only read.")).toBeVisible();
  const token = /sftmcp_[A-Za-z0-9_-]+/.exec(await page.content())?.[0];
  expect(token).toBeDefined();
  const response = await request.post("/api/mcp", {
    headers: { authorization: `Bearer ${token ?? ""}`, accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18" },
    data: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_overview", arguments: {} } },
  });
  expect(response.status()).toBe(200);
  const body = await response.text();
  const json = body.startsWith("{") ? body : (body.split("\n").find((line) => line.startsWith("data:")) ?? "").slice(5);
  const text = (JSON.parse(json) as { result: { content: { text: string }[] } }).result.content[0]?.text ?? "";
  const overview = JSON.parse(text.slice(text.indexOf(OPEN_MARKER) + OPEN_MARKER.length, text.lastIndexOf(CLOSE_MARKER))) as {
    groups: { projects: { project: string; ci: unknown }[] }[];
  };
  const project = overview.groups.flatMap((group) => group.projects).find((candidate) => candidate.project === PROJECT);
  expect(project?.ci).toEqual({
    kind: "run",
    result: "failed",
    url: "https://forge.example.test/runs/pr-checks-1201",
    at: "2026-11-05T08:20:00Z",
    pullRequest: { number: 12, url: PULL_URL },
  });
});
