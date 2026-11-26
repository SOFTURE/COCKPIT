import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { holdScanRefresh } from "./hold-scan-refresh.ts";
import { GROUP_OWNER_REPOSITORIES, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// Project groups on Settings (CT-30): add, the duplicate field error, rename and delete from the row menu, the counts
// of the projects that joined through "New projects from", and focus back on the row menu after each dialog. The
// database is shared: every group name and owner here is used by this spec only, and no count of a shared list is
// fixed upfront. The 1280 px flow runs as serial steps that share the two groups, each within the default test budget
// under the CI's four-worker load: as one test it ran past the 30 s budget there (PR #151's run 45839443852).
test.describe.configure({ mode: "serial" });

// The dialogs stay open across server writes: no scan end of another spec may reload the page under them.
test.beforeEach(async ({ page }) => {
  await holdScanRefresh(page);
});

async function openSettings(page: Page) {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
}

function groupsCard(page: Page): Locator {
  return page.getByRole("region", { name: "Project groups" });
}

function groupRow(page: Page, name: string): Locator {
  return groupsCard(page).getByRole("list", { name: "Project groups" }).getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) });
}

async function addGroup(page: Page, name: string, owner = "") {
  const form = groupsCard(page).getByRole("form", { name: "Project groups" });
  const nameField = form.getByRole("textbox", { name: "Name", exact: true });
  await waitForHydration(nameField);
  await nameField.fill(name);
  await form.getByRole("textbox", { name: "New projects from", exact: true }).fill(owner);
  await form.getByRole("button", { name: "Add" }).click();
}

async function openRowMenu(page: Page, name: string): Promise<Locator> {
  const button = groupRow(page, name).getByRole("button", { name: `More actions for ${name}` });
  await waitForHydration(button);
  await button.click();
  return page.getByRole("menu");
}

/** Opens a dialog from a row's menu once the last one has gone (a photograph closes it with Escape). */
async function openDialogFromMenu(page: Page, group: string, item: string, dialog: Locator) {
  await expect(page.getByRole("dialog").or(page.getByRole("alertdialog"))).toHaveCount(0);
  await (await openRowMenu(page, group)).getByRole("menuitem", { name: item }).click();
  await expect(dialog).toBeVisible();
}

async function renameGroup(page: Page, from: string, to: { readonly name: string; readonly owner: string }) {
  await (await openRowMenu(page, from)).getByRole("menuitem", { name: "Rename" }).click();
  const dialog = page.getByRole("dialog", { name: `Rename the group ${from}` });
  await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toHaveValue(from);
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(to.name);
  await dialog.getByRole("textbox", { name: "New projects from", exact: true }).fill(to.owner);
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toHaveCount(0);
}

test("groups take the owner's new projects and refuse a duplicate name, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openSettings(page);

  await addGroup(page, "Atlas clients", "Atlas-Works");
  await expect(groupsCard(page).locator("[data-group-result]")).toContainText("The group Atlas clients was added.");
  await addGroup(page, "Birch studio", "birch-labs");
  await expect(groupRow(page, "Birch studio")).toContainText("0 projects · new from: birch-labs");

  // Repositories added later join the group of their owner, whatever the owner's letter case.
  for (const fullName of [...GROUP_OWNER_REPOSITORIES.atlas, ...GROUP_OWNER_REPOSITORIES.birch]) {
    await submitRepository(page, fullName.startsWith("birch-labs/") ? fullName.replace("birch-labs", "Birch-Labs") : fullName);
    await expect(page.getByRole("region", { name: "Watched repositories" }).getByRole("status").first()).toContainText(`${fullName} is now watched.`);
  }
  await page.reload();
  await expect(groupRow(page, "Atlas clients")).toContainText("2 projects · new from: atlas-works");
  await expect(groupRow(page, "Birch studio")).toContainText("1 project · new from: birch-labs");
  const names = await groupsCard(page).getByRole("list", { name: "Project groups" }).getByRole("listitem").allInnerTexts();
  expect(names.findIndex((text) => text.startsWith("Atlas clients"))).toBeLessThan(names.findIndex((text) => text.startsWith("Birch studio")));
  await captureEvidence(page, { name: "01-list", target: groupsCard });

  // A duplicate name, in another case, is a field error and keeps what was typed.
  await addGroup(page, "atlas CLIENTS");
  const form = groupsCard(page).getByRole("form", { name: "Project groups" });
  await expect(form.locator("[data-group-result]")).toContainText("A group with this name already exists.");
  await expect(form.getByRole("textbox", { name: "Name", exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("atlas CLIENTS");

});

test("a group's row menu offers Rename and Delete, and a rename keeps focus on the row, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openSettings(page);

  // The menu lists Rename, then Delete in the danger tone.
  const menu = await openRowMenu(page, "Birch studio");
  await expect(menu.getByRole("menuitem")).toHaveText(["Rename", "Delete"]);
  await expect(menu.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive");
  await page.keyboard.press("Escape");
  await captureEvidence(page, {
    name: "02-menu",
    // The menu opens over the card's lower edge: the photograph takes the page's main column.
    target: (current) => current.locator("main"),
    prepare: async (current) => {
      await current.getByRole("button", { name: "More actions for Birch studio" }).click();
    },
  });

  // Rename: both fields prefilled; Escape closes it and focus comes back to the row's menu button.
  await (await openRowMenu(page, "Birch studio")).getByRole("menuitem", { name: "Rename" }).click();
  const renameDialog = page.getByRole("dialog", { name: "Rename the group Birch studio" });
  await expect(renameDialog.getByRole("textbox", { name: "New projects from", exact: true })).toHaveValue("birch-labs");
  await page.keyboard.press("Escape");
  await expect(renameDialog).toHaveCount(0);
  await expect(groupRow(page, "Birch studio").getByRole("button", { name: "More actions for Birch studio" })).toBeFocused();
  await captureEvidence(page, {
    name: "03-rename",
    target: () => renameDialog,
    prepare: (current) => openDialogFromMenu(current, "Birch studio", "Rename", renameDialog),
  });
  await renameGroup(page, "Birch studio", { name: "Birch workshop", owner: "birch-labs" });
  await expect(groupRow(page, "Birch workshop")).toContainText("1 project · new from: birch-labs");
  await expect(groupRow(page, "Birch workshop").getByRole("button", { name: "More actions for Birch workshop" })).toBeFocused();

});

test("deleting a group asks first, and its project falls to No group, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openSettings(page);

  // Delete asks first; Cancel keeps it and gives focus back to the menu button.
  const confirm = page.getByRole("alertdialog", { name: "Delete the group Birch workshop?" });
  await captureEvidence(page, {
    name: "04-delete",
    target: () => confirm,
    prepare: (current) => openDialogFromMenu(current, "Birch workshop", "Delete", confirm),
  });
  await openDialogFromMenu(page, "Birch workshop", "Delete", confirm);
  await expect(confirm).toContainText("Its 1 project moves to No group.");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(groupRow(page, "Birch workshop").getByRole("button", { name: "More actions for Birch workshop" })).toBeFocused();

  await (await openRowMenu(page, "Birch workshop")).getByRole("menuitem", { name: "Delete" }).click();
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(groupRow(page, "Birch workshop")).toHaveCount(0);
  // Its project fell to No group; the other group keeps its own.
  await expect(groupRow(page, "Atlas clients")).toContainText("2 projects · new from: atlas-works");
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the add form stacks with 44 px controls, and a group is added, renamed and deleted", async ({ page }) => {
    await openSettings(page);
    const form = groupsCard(page).getByRole("form", { name: "Project groups" });
    for (const control of [
      form.getByRole("textbox", { name: "Name", exact: true }),
      form.getByRole("textbox", { name: "New projects from", exact: true }),
      form.getByRole("button", { name: "Add" }),
    ]) {
      await expectTouchTarget(control);
    }
    const [nameBox, ownerBox, addBox] = await Promise.all(
      ["Name", "New projects from"].map((name) => form.getByRole("textbox", { name, exact: true }).boundingBox()).concat(form.getByRole("button", { name: "Add" }).boundingBox()),
    );
    expect(nameBox && ownerBox && addBox && nameBox.y < ownerBox.y && ownerBox.y < addBox.y).toBe(true);

    await addGroup(page, "Phone side projects");
    await expect(groupRow(page, "Phone side projects")).toContainText("0 projects");
    await expect(groupRow(page, "Phone side projects")).not.toContainText("new from");
    await expectTouchTarget(groupRow(page, "Phone side projects").getByRole("button", { name: "More actions for Phone side projects" }));

    // A malformed owner is the owner field's error.
    await addGroup(page, "Phone other", "not an owner");
    await expect(form.locator("[data-group-result]")).toContainText("letters, digits and hyphens");
    await expect(form.getByRole("textbox", { name: "New projects from", exact: true })).toHaveAttribute("aria-invalid", "true");

    await renameGroup(page, "Phone side projects", { name: "Phone hobby", owner: "" });
    await expect(groupRow(page, "Phone hobby")).toBeVisible();
    await expect(groupRow(page, "Phone hobby").getByRole("button", { name: "More actions for Phone hobby" })).toBeFocused();

    await (await openRowMenu(page, "Phone hobby")).getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog", { name: "Delete the group Phone hobby?" });
    await expect(confirm).toContainText("Its 0 projects move to No group.");
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(groupRow(page, "Phone hobby")).toHaveCount(0);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
