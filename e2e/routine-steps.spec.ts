import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// CT-4: the owner work the package-update routine records reaches the inbox, and a step is settled with "Done".
// Shares the database with the other specs: it watches a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

const STEP = "@example/mail 0.3.0: set the production secret MAIL_KEY_SECRET (#42)";
const HOLD = "hold @example/billing: choose how existing invoices are treated (#41)";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/** With E2E_EVIDENCE_DIR set, the inbox at 1280 and 390 px in light and dark, as the item's evidence. */
async function captureInbox(page: Page, name: string) {
  const evidenceDir = process.env.E2E_EVIDENCE_DIR;
  if (evidenceDir === undefined) {
    return;
  }
  await mkdir(evidenceDir, { recursive: true });
  const viewport = page.viewportSize();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("/inbox");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: path.join(evidenceDir, `${name}-after-${String(width)}-${colorScheme}.png`), fullPage: true });
    }
  }
  if (viewport !== null) {
    await page.setViewportSize(viewport);
  }
  await page.emulateMedia({ colorScheme: "light" });
}

function entryRow(page: Page, text: string) {
  return page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: text });
}

test("a routine owner step shows in the inbox and Done sends one cockpit issue that confirms it", async ({ page, request }) => {
  await signIn(page, "/settings");
  await submitRepository(page, "example-org/routine-app");
  await expect(page.getByRole("status").first()).toContainText("example-org/routine-app is now watched.");
  await scanUntilSettled(page, ["example-org/routine-app"]);

  await captureInbox(page, "01-routine-entries");
  await page.goto("/inbox");
  const hold = entryRow(page, HOLD);
  await expect(hold.getByRole("group", { name: "Your answer" }).getByRole("button")).toHaveText(["Yes", "No", "Later"]);
  const step = entryRow(page, STEP);
  await expect(step).toContainText("from workflow.json");
  await expect(step.getByRole("group", { name: "Your answer" }).getByRole("button")).toHaveText(["Done", "No", "Later"]);

  await step.getByRole("button", { name: "Done" }).click();
  await expect(step).toContainText("Send Done to example-org/routine-app?");
  await step.getByRole("button", { name: "Send answer" }).click();
  await expect(step.getByRole("link", { name: "Done · issue #1" })).toBeVisible();
  await page.reload();
  await expect(entryRow(page, STEP).getByRole("link", { name: "Done · issue #1" })).toBeVisible();
  await captureInbox(page, "02-step-done");

  const created = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/example-org/routine-app`);
  const issues = (await created.json()) as { title: string; body: string; labels: string[] }[];
  expect(issues).toHaveLength(1);
  expect(issues[0]?.labels).toEqual(["cockpit"]);
  expect(issues[0]?.title).toBe(`Owner word: Done, ${STEP}`);
  expect(issues[0]?.body).toContain('set `"confirmed": "#<this issue>"` on that `ownerSteps` entry');
  expect(issues[0]?.body).toContain('<!-- cockpit: {"entry":"oq-routine-1","answer":"yes"} -->');
});
