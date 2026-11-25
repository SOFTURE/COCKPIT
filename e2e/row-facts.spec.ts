import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectSideHoldsStateAndControls } from "./expect-side-holds-state-and-controls.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { CHECKED_AT, scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// CT-24: every list row says each fact once, and the right column holds only state (badges) and controls. One
// fictional project carries every moved fact: an answered entry, a put-off one, an answer whose entry left the queue,
// held packages with and without an issue, merges and releases. Shares the database with the other specs: it watches
// a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/row-facts-app";
const ANSWERED = "Approve the row-facts pricing page";
const PUT_OFF = "Decide the row-facts import format";
const SETTLED = "Start the row-facts launch roadmap";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function region(page: Page, name: string) {
  return page.getByRole("region", { name, exact: true });
}

async function answer(page: Page, text: string, button: string) {
  const row = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: text });
  await row.getByRole("group", { name: "Your answer" }).getByRole("button", { name: button }).click();
  await row.getByRole("button", { name: "Send answer" }).click();
  await expect(row.locator("[data-answer-state]")).toBeVisible();
}

test("answered, put-off and settled entries say who answered and their issue once, on the left", async ({ page }) => {
  await signIn(page, "/settings");
  await submitRepository(page, PROJECT);
  await expect(page.getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await scanUntilSettled(page, [PROJECT]);

  await page.goto(`/inbox?project=${PROJECT}`);
  await answer(page, ANSWERED, "Yes");
  await answer(page, PUT_OFF, "Later");
  await answer(page, SETTLED, "Yes");
  // The third answer settles the launch word in the project: the next read drops it from the queue.
  await scanUntilSettled(page, [PROJECT]);

  await page.goto(`/inbox?project=${PROJECT}`);
  const answered = page.locator(`[data-entry="${PROJECT}:oq-rf-1"]`);
  const putOff = page.locator(`[data-entry="${PROJECT}:oq-rf-2"]`);
  const settled = page.locator(`[data-answered="${PROJECT}#3"]`);
  await expect(answered).toBeVisible();
  await expect(putOff).toBeVisible();
  await expect(settled).toBeVisible();
  await captureEvidence(page, { name: "01-inbox", target: (current) => current.locator("main") });

  // Answered: the answer badge on top of the right column; the issue and who answered on the muted line on the left.
  await expect(answered.locator("[data-row-status] [data-answer-state]")).toHaveText("Sent");
  await expect(answered.locator("[data-row-identity]").getByRole("link", { name: "Yes · issue #1" })).toBeVisible();
  await expect(answered.locator("[data-row-side]").getByRole("link")).toHaveCount(0);
  await expectSideHoldsStateAndControls(page, answered);
  // Put off: the badge alone says "Put off"; the issue is named on the left, without saying "Later" again.
  await expect(putOff.locator("[data-row-status]")).toHaveText("Put off");
  await expect(putOff.locator("[data-row-identity]").getByRole("link", { name: "Issue #2" })).toBeVisible();
  await expect(putOff).not.toContainText("Later · issue");
  await expectSideHoldsStateAndControls(page, putOff);
  // Answered earlier: the state badge alone on the right; the issue on the left.
  await expect(settled.locator("[data-row-status] [data-answer-state]")).toHaveText("Sent");
  await expect(settled.locator("[data-row-identity]").getByRole("link", { name: "Yes · issue #3" })).toBeVisible();
  await expectSideHoldsStateAndControls(page, settled);

  // The project page's entries are the same rows.
  await page.goto(`/projects/${PROJECT}`);
  const entries = region(page, "Waiting for you");
  await expect(entries.locator(`[data-entry="${PROJECT}:oq-rf-1"]`)).toBeVisible();
  await captureEvidence(page, { name: "02-project-entries", target: () => entries });
  await expect(entries.locator(`[data-entry="${PROJECT}:oq-rf-1"] [data-row-identity]`).getByRole("link", { name: "Yes · issue #1" })).toBeVisible();
  await expectSideHoldsStateAndControls(page, entries.locator(`[data-entry="${PROJECT}:oq-rf-1"]`));
  await expect(entries.locator(`[data-entry="${PROJECT}:oq-rf-2"] [data-row-identity]`).getByRole("link", { name: "Issue #2" })).toBeVisible();
  await expectSideHoldsStateAndControls(page, entries.locator(`[data-entry="${PROJECT}:oq-rf-2"]`));
});

test("merges and releases say their state once, the time under the title", async ({ page }) => {
  await signIn(page, `/projects/${PROJECT}/history?tab=merges`);
  const merge = page.locator('[data-merge="80"]');
  await expect(merge).toBeVisible();
  await captureEvidence(page, { name: "03-history-merges", target: () => region(page, "Recent merges") });
  await expect(merge.locator("[data-row-status]")).toHaveText("Merged");
  await expect(merge.locator("[data-row-identity]")).toContainText("Nov 23, 2026");
  await expect(merge.locator("[data-row-identity]")).toContainText("by example-dev");
  await expect(merge).not.toContainText(/merged/);
  await expectSideHoldsStateAndControls(page, merge);

  await page.goto(`/projects/${PROJECT}/history?tab=releases`);
  const release = page.locator('[data-release="v1.0.0"]');
  await expect(release).toBeVisible();
  await captureEvidence(page, { name: "04-history-releases", target: () => region(page, "Releases") });
  await expect(release.locator("[data-row-status]")).toHaveText("Published");
  await expect(release.locator("[data-row-identity]")).toContainText("Nov 20, 2026");
  await expect(release).not.toContainText(/published/);
  await expectSideHoldsStateAndControls(page, release);
  await expect(page.locator('[data-release="v1.1.0-rc.1"] [data-row-status]')).toHaveText("Prerelease");
  await expectSideHoldsStateAndControls(page, page.locator('[data-release="v1.1.0-rc.1"]'));
});

test("held packages name their issue on the left and the last update says merged once", async ({ page }) => {
  await signIn(page, "/packages");
  const card = region(page, PROJECT);
  const withIssue = card.locator('[data-held-package="@softure-ai/ui"]');
  const withoutIssue = card.locator('[data-held-package="@softure-ai/auth"]');
  await expect(withIssue).toBeVisible();
  await captureEvidence(page, { name: "05-packages", target: () => card });
  await expect(withIssue.locator("[data-row-identity]").getByRole("link", { name: "SOFTURE/AI#123" })).toBeVisible();
  await expect(withIssue.locator("[data-row-identity]")).toContainText("since 2026-11-20");
  await expect(withIssue.locator("[data-row-side]")).toHaveCount(0);
  await expect(withoutIssue.locator("[data-row-identity]")).toContainText("no issue named");
  await expect(withoutIssue.locator("[data-row-side]")).toHaveCount(0);
  const update = card.locator('[data-package-update="merged"]');
  await expect(update).toHaveText("Merged");
  await expect(card.getByRole("region", { name: "Last package update" })).not.toContainText(/merged/);
  await expect(card.getByRole("region", { name: "Last package update" })).toContainText("Nov 24, 2026");
});

test("Scan status says a project was read once, with the time it was checked", async ({ page }) => {
  await signIn(page, "/scan-status");
  const row = page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: PROJECT });
  await expect(row).toContainText(CHECKED_AT);
  await captureEvidence(page, { name: "06-scan-status", target: () => row });
  await expect(row.locator("[data-row-status]")).toHaveText("Read");
  await expect(row.locator("[data-row-identity]")).not.toContainText(/\bRead\b/);
  await expectSideHoldsStateAndControls(page, row);
});
