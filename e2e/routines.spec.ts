import type { APIRequestContext, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { E2E_FLAKY_TRIGGER, E2E_ROUTINE_TOKEN, FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// CT-10: COCKPIT fires a project's routines right after it opens a cockpit issue there, against the fake routines API.
// Shares the database with the other specs: it watches repositories no other spec uses, and sends only to them.
test.describe.configure({ mode: "serial" });

const APP = "example-org/signal-app";
const WEB = "example-org/signal-web";
const APP_TRIGGER = "trig_e2e_signal_app";
const TITLE = "Wake the coordinators";

interface ReceivedFire {
  readonly text: string;
  readonly status: number;
  readonly hasHeaders: boolean;
}

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function receivedFires(request: APIRequestContext, triggerId: string): Promise<ReceivedFire[]> {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__fires/${triggerId}`);
  return (await answer.json()) as ReceivedFire[];
}

async function addRoutine(page: Page, fullName: string, trigger: string) {
  await page.goto(`/projects/${fullName}?tab=routines`);
  const form = page.getByRole("form", { name: "Add a routine" });
  await waitForHydration(form.getByLabel("Name"));
  await form.getByLabel("Name").fill("Coordinator");
  await form.getByLabel("Trigger id or fire URL").fill(trigger);
  await form.getByLabel("Token").fill(E2E_ROUTINE_TOKEN);
  await form.getByRole("button", { name: "Add routine" }).click();
  await expect(form.getByRole("status")).toHaveText("Saved.");
  await expect(page.locator("[data-routines]").getByRole("listitem")).toHaveCount(1);
}

function projectRow(page: Page, fullName: string) {
  return page.getByRole("list", { name: "Projects this broadcast went to" }).getByRole("listitem").filter({ hasText: fullName });
}

test("a routine is added, tested, fired once per project by a broadcast, and Retry recovers a failed fire", async ({ page, request }) => {
  await signIn(page, "/settings");
  for (const name of [APP, WEB]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  // The fire URL is accepted and its trigger id kept; the token shows only by its last four characters.
  await addRoutine(page, APP, `https://api.anthropic.com/v1/claude_code/routines/${APP_TRIGGER}/fire`);
  const routine = page.locator("[data-routines]").getByRole("listitem");
  await expect(routine).toContainText(APP_TRIGGER);
  await expect(routine).toContainText(`token ••••${E2E_ROUTINE_TOKEN.slice(-4)}`);
  await expect(routine).toContainText("never called");
  expect(await page.content()).not.toContain(E2E_ROUTINE_TOKEN);

  // Test fires the test text and shows the HTTP result.
  await routine.getByRole("button", { name: "Test routine Coordinator" }).click();
  await expect(routine.getByRole("status").filter({ hasText: "Test fired" })).toHaveText("Test fired: HTTP 200");
  const tested = await receivedFires(request, APP_TRIGGER);
  expect(tested).toEqual([{ text: "COCKPIT test: reply in this chat that the test arrived; change nothing.", status: 200, hasHeaders: true }]);

  await addRoutine(page, WEB, E2E_FLAKY_TRIGGER);

  // A broadcast to both projects opens one issue each and fires each project's routine once.
  // The form's fields are controlled: text typed before the page hydrates is reset by it, and the empty required
  // Title then blocks the submit. "Clear all" changes the count only once the page is interactive.
  await page.goto("/broadcast");
  const group = page.getByRole("group", { name: "Projects" });
  await group.getByRole("button", { name: "Clear all" }).click();
  await expect(group.getByText(/^\d+ of \d+ picked$/)).toHaveText(/^0 of \d+ picked$/);
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill("Run the doctor and report what it finds.");
  for (const name of [APP, WEB]) {
    await group.getByRole("checkbox", { name, exact: true }).click();
  }
  await expect(group.getByText(/^\d+ of \d+ picked$/)).toHaveText(/^2 of \d+ picked$/);
  await expect(page.getByLabel("Title")).toHaveValue(TITLE);
  await page.getByRole("button", { name: "Send broadcast" }).click();
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);

  await expect(projectRow(page, APP).locator("[data-fire]")).toHaveAttribute("data-fire", "sent");
  await expect(projectRow(page, APP)).toContainText("Coordinator: Routine fired");
  await expect(projectRow(page, WEB).locator("[data-fire]")).toHaveAttribute("data-fire", "failed");
  await expect(projectRow(page, WEB)).toContainText("Coordinator: Fire failed · HTTP 503 · API error");

  const appFires = await receivedFires(request, APP_TRIGGER);
  expect(appFires).toHaveLength(2);
  expect(appFires[1]).toEqual({
    text: `COCKPIT command: https://github.com/${APP}/issues/1`,
    status: 200,
    hasHeaders: true,
  });
  expect((await receivedFires(request, E2E_FLAKY_TRIGGER)).map((fire) => fire.status)).toEqual([503]);

  // Retry fires the failed one again for the same issue; the sent one is left alone.
  await projectRow(page, WEB).getByRole("button", { name: `Retry waking ${WEB} for issue #1` }).click();
  await expect(projectRow(page, WEB).locator("[data-fire]")).toHaveAttribute("data-fire", "sent");
  await expect(projectRow(page, WEB).getByRole("button", { name: /^Retry waking/ })).toHaveCount(0);
  const webFires = await receivedFires(request, E2E_FLAKY_TRIGGER);
  expect(webFires.map((fire) => fire.status)).toEqual([503, 200]);
  expect(webFires[1]?.text).toBe(`COCKPIT command: https://github.com/${WEB}/issues/1`);
  expect(await receivedFires(request, APP_TRIGGER)).toHaveLength(2);

  // The project's Routines tab shows the last call and the issue's fire.
  await page.goto(`/projects/${WEB}?tab=routines`);
  await expect(page.locator("[data-routines]").getByRole("listitem")).toContainText("last call HTTP 200");
  await expect(page.locator("[data-fired-issues]")).toContainText(`#1 COCKPIT command: ${TITLE}`);
});
