import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";

// Shares the database with the other specs: it watches repositories no other spec uses, and sends only to them.
test.describe.configure({ mode: "serial" });

const OWN_PROJECTS = ["example-org/herald-app", "example-org/herald-web", "example-org/herald-docs"] as const;
const TITLE = "Bump the skills package";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function watch(page: Page, names: readonly string[]) {
  await page.goto("/settings");
  for (const name of names) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
}

/** Unpicks every watched project that is not this spec's own. */
async function pickOwnProjects(page: Page) {
  const boxes = page.getByRole("group", { name: "Projects" }).getByRole("checkbox");
  for (const box of await boxes.all()) {
    const label = await page.locator(`label[for="${(await box.getAttribute("id")) ?? ""}"]`).innerText();
    if (!OWN_PROJECTS.some((name) => name === label.trim())) {
      await box.click();
      await expect(box).not.toBeChecked();
    } else {
      await expect(box).toBeChecked();
    }
  }
}

async function createdIssues(request: import("@playwright/test").APIRequestContext, fullName: string) {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/${fullName}`);
  return (await answer.json()) as { title: string; body: string; labels: string[] }[];
}

function projectRow(page: Page, fullName: string) {
  return page.getByRole("list", { name: "Projects this broadcast went to" }).getByRole("listitem").filter({ hasText: fullName });
}

test("a broadcast becomes one issue per labelled project, cockpit or the older owner-word, and a project without either fails with a retry", async ({ page, request }) => {
  await signIn(page, "/settings");
  await watch(page, OWN_PROJECTS);

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Broadcast" }).click();
  await expect(page).toHaveURL(/\/broadcast$/);
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill("Bump `@softure-ai/skills` and run the doctor with `--fix`.");
  await pickOwnProjects(page);
  await page.getByRole("button", { name: "Send broadcast" }).click();

  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE);
  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    await expect(projectRow(page, name)).toContainText("Sent");
    await expect(projectRow(page, name).getByRole("link", { name: "Issue #1" })).toBeVisible();
  }
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("The project has no cockpit label (nor the older owner-word).");

  // A retry of the failed project fails again with the same reason and creates nothing.
  await projectRow(page, "example-org/herald-docs").getByRole("button", { name: "Retry example-org/herald-docs" }).click();
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");

  for (const [name, label] of [["example-org/herald-app", "cockpit"], ["example-org/herald-web", "owner-word"]] as const) {
    const issues = await createdIssues(request, name);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.labels).toEqual([label]);
    expect(issues[0]?.title).toBe(`Owner word: ${TITLE}`);
    expect(issues[0]?.body).toMatch(/<!-- cockpit-broadcast: \{"id":"[0-9a-f-]{36}"\} -->$/);
  }
  expect(await createdIssues(request, "example-org/herald-docs")).toEqual([]);

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Broadcast" }).click();
  await expect(page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("listitem").filter({ hasText: TITLE })).toContainText(
    "2 sent · 0 done · 1 failed",
  );
});

test("sending the same form twice creates no second issue", async ({ page, request }) => {
  await signIn(page, "/broadcast");
  await page.getByLabel("Title").fill("Run the doctor");
  await page.getByLabel("Message").fill("Run the doctor and fix what it finds.");
  await pickOwnProjects(page);
  // The second submit of the same form arrives while the first one is still sending.
  await page.evaluate(() => {
    const form = document.querySelector("input[name=broadcastId]")?.closest("form");
    form?.requestSubmit();
    form?.requestSubmit();
  });
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  await expect(projectRow(page, "example-org/herald-app")).toContainText("Sent");

  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    const issues = await createdIssues(request, name);
    expect(issues.filter((issue) => issue.title === "Owner word: Run the doctor")).toHaveLength(1);
  }
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("every broadcast control is at least 44 px high and nothing scrolls sideways", async ({ page }) => {
    await signIn(page, "/broadcast");
    const rows = page.getByRole("group", { name: "Projects" }).getByRole("listitem");
    for (const box of await Promise.all((await rows.all()).map((row) => row.boundingBox()))) {
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    for (const control of [page.getByLabel("Title"), page.getByRole("button", { name: "Send broadcast" })]) {
      expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);

    await page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("link").filter({ hasText: TITLE }).click();
    const retry = page.getByRole("button", { name: "Retry example-org/herald-docs" });
    expect((await retry.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect((await page.getByRole("link", { name: "Issue #1" }).first().boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
