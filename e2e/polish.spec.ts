import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { mailingMessages } from "@softure-ai/mailing";
import { mcpAccessMessages } from "@softure-ai/mcp-access";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { en } from "../messages/en.ts";
import { fillMessage } from "../messages/index.ts";
import { authPl } from "../messages/packages/auth-pl.ts";
import { mailingPl } from "../messages/packages/mailing-pl.ts";
import { mcpAccessPl } from "../messages/packages/mcp-access-pl.ts";
import { pl } from "../messages/pl.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";

// The server of the "polish" project runs the same build with APP_LOCALE=pl on its own database. No English copy of
// COCKPIT or of the modules it configures may show on its screens; text from the repositories is shown as written.
test.describe.configure({ mode: "serial" });

type Tree = { readonly [key: string]: string | Tree | undefined };

/** Every leaf of `english` that the Polish tree words differently, as `[english, polish]` pairs. */
function pairTexts(english: Tree, polish: Tree): [string, string][] {
  return Object.entries(english).flatMap(([key, value]): [string, string][] => {
    const other = polish[key];
    if (typeof value === "string") {
      return typeof other === "string" && other !== value ? [[value, other]] : [];
    }
    return value === undefined || other === undefined || typeof other === "string" ? [] : pairTexts(value, other);
  });
}

/**
 * The English phrases to look for: the parts of each English text between its placeholders that hold at least two
 * words and do not appear in its Polish text too (a file name, a command, a product name).
 */
function toEnglishPhrases(pairs: readonly [string, string][]): string[] {
  const phrases = pairs.flatMap(([english, polish]) =>
    english
      .split(/\{\w+\}/u)
      .map((part) => part.trim().replace(/[.:,;]+$/u, ""))
      .filter((part) => /\p{L}{2,}\s+\p{L}{2,}/u.test(part) && !polish.includes(part)),
  );
  return [...new Set(phrases)];
}

const ENGLISH_PHRASES = toEnglishPhrases([
  ...pairTexts(en, pl),
  ...pairTexts(authMessages.en, authPl),
  ...pairTexts(mailingMessages.en, mailingPl),
  ...pairTexts(mcpAccessMessages.en, mcpAccessPl),
]);

/** The visible text of the page plus every accessible name, title and placeholder written in its markup. */
async function readPageCopy(page: Page): Promise<string> {
  return page.evaluate(() => {
    const attributes = [...document.querySelectorAll("[aria-label], [title], [placeholder], [alt]")].flatMap((element) =>
      ["aria-label", "title", "placeholder", "alt"].map((name) => element.getAttribute(name) ?? ""),
    );
    return [document.title, document.body.innerText, ...attributes].join("\n");
  });
}

async function expectNoEnglishCopy(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
  const copy = await readPageCopy(page);
  const found = ENGLISH_PHRASES.filter((phrase) => copy.includes(phrase));
  expect(found, `English copy on ${route}`).toEqual([]);
}

const WATCHED = ["example-org/xi-app", "example-org/kappa-app", "example-org/omicron-app"];
const ROUTES = [
  "/inbox",
  "/projects",
  "/settings",
  "/settings/team",
  "/scan-status",
  "/broadcast",
  "/projects/example-org/omicron-app",
  "/projects/example-org/omicron-app/history",
  "/projects/example-org/omicron-app/history?tab=merges",
  "/projects/example-org/omicron-app/history?tab=doctor",
  "/broadcast?tab=sent",
  "/settings/team?tab=invite",
  "/projects/example-org/omicron-app/roadmaps/omicron-v1",
  "/projects/example-org/kappa-app",
  "/account/password",
  "/account/mcp",
];
/** Screens whose screenshots prove the item (roadmap baseline): inbox, overview, settings and an inbox project tab. */
const EVIDENCE_SCREENS = [
  { name: "01-inbox", route: "/inbox" },
  { name: "02-overview", route: "/projects" },
  { name: "03-settings", route: "/settings" },
  { name: "04-inbox-project-tab", route: "/inbox?project=example-org/omicron-app" },
];

test("the sign-in page speaks Polish and the html element says so", async ({ page }) => {
  expect(ENGLISH_PHRASES.length).toBeGreaterThan(300);
  await expectNoEnglishCopy(page, "/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("button", { name: authPl.login.submit })).toBeVisible();
});

test("the unsubscribe page speaks Polish", async ({ page }) => {
  await expectNoEnglishCopy(page, "/unsubscribe");
  await expect(page.getByText(mailingPl.unsubscribe.invalidTitle)).toBeVisible();
});

test("every screen speaks Polish after a scan, with Polish dates", async ({ page }) => {
  await page.goto("/settings");
  await submitLogin(page, { copy: authPl, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page.getByRole("heading", { name: pl.settings.title, level: 1 })).toBeVisible();
  for (const name of WATCHED) {
    await submitRepository(page, name, pl.repositories);
    await expect(page.getByRole("status").first()).toContainText(fillMessage(pl.repositories.added, { name }));
  }
  await page.goto("/scan-status");
  await page.getByRole("button", { name: pl.scan.scanNow }).click();
  const scanned = page.getByRole("list", { name: pl.scan.listLabel }).getByRole("listitem");
  for (const name of WATCHED) {
    // A Polish date: "23 lis 2026, 20:05".
    await expect(scanned.filter({ hasText: name })).toContainText(/\d{1,2} \p{L}{3} \d{4}, \d{2}:\d{2}/u, { timeout: 10_000 });
  }
  for (const route of ROUTES) {
    await expectNoEnglishCopy(page, route);
  }
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: pl.inbox.title, level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: pl.inbox.answers.yes }).first()).toBeVisible();

  const evidenceDir = process.env.E2E_EVIDENCE_DIR;
  if (evidenceDir === undefined) {
    return;
  }
  await mkdir(evidenceDir, { recursive: true });
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const screen of EVIDENCE_SCREENS) {
        await page.goto(screen.route);
        await page.waitForLoadState("networkidle");
        await page.screenshot({ path: path.join(evidenceDir, `${screen.name}-after-${String(width)}-${colorScheme}.png`), fullPage: true });
      }
    }
  }
});
