import type { APIRequestContext, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Shares the database with the other specs: it watches a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/omicron-app";
const OPEN_MARKER = "<<<cockpit:untrusted-data>>>";
const CLOSE_MARKER = "<<<cockpit:end-untrusted-data>>>";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

let callId = 0;

/** Calls one tool over HTTP as an assistant does and returns the parsed answer between the markers. */
async function callTool(request: APIRequestContext, token: string, name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  callId += 1;
  const response = await request.post("/api/mcp", {
    headers: { authorization: `Bearer ${token}`, accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18" },
    data: { jsonrpc: "2.0", id: callId, method: "tools/call", params: { name, arguments: args } },
  });
  expect(response.status()).toBe(200);
  const body = await response.text();
  const json = body.startsWith("{") ? body : (body.split("\n").find((line) => line.startsWith("data:")) ?? "").slice(5);
  const message = JSON.parse(json) as { result: { content: { text: string }[]; isError?: boolean } };
  expect(message.result.isError ?? false).toBe(false);
  const text = message.result.content[0]?.text ?? "";
  return JSON.parse(text.slice(text.indexOf(OPEN_MARKER) + OPEN_MARKER.length, text.lastIndexOf(CLOSE_MARKER)));
}

interface EntryAnswer {
  readonly project: string;
  readonly id: string;
  readonly text: string;
  readonly ageDays: number | null;
}

test("an assistant with a read token reads the same inbox, overview and project as the screens", async ({ page, request }) => {
  await signIn(page, "/settings");
  await page.getByLabel("Repository").fill(PROJECT);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await page.goto("/scan-status");
  await page.getByRole("button", { name: "Scan now" }).click();
  await expect(page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: PROJECT })).toContainText("Read", {
    timeout: 10_000,
  });

  await page.goto("/settings");
  await page.getByRole("link", { name: "Assistant access (MCP)" }).click();
  await expect(page).toHaveURL(/\/account\/mcp$/);
  await expect(page.getByText("get_overview").first()).toBeVisible();
  await expect(page.getByLabel("Allow changes")).toHaveCount(0);
  await page.getByLabel("Name", { exact: true }).fill("Phone assistant");
  await page.getByRole("button", { name: "Create token" }).click();
  await expect(page.getByText("This token can only read.")).toBeVisible();
  const token = /sftmcp_[A-Za-z0-9_-]+/.exec(await page.content())?.[0];
  expect(token).toBeDefined();
  if (token === undefined) return;

  const inbox = (await callTool(request, token, "get_inbox")) as { unansweredCount: number; entries: EntryAnswer[] };
  const entries = inbox.entries.filter((entry) => entry.project === PROJECT);
  expect(entries.map((entry) => entry.text)).toEqual(["Choose the omicron-app storage plan", "Release omicron-app after OM-3"]);

  await page.goto("/inbox");
  const rows = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: PROJECT });
  await expect(rows).toHaveCount(2);
  for (const [index, entry] of entries.entries()) {
    await expect(rows.nth(index)).toContainText(entry.text);
    await expect(rows.nth(index)).toContainText(`${String(entry.ageDays)} days`);
  }
  const inboxItem = page.getByRole("list", { name: "Main" }).getByRole("listitem").filter({ hasText: "Inbox" });
  await expect(inboxItem).toContainText(String(inbox.unansweredCount));

  const overview = (await callTool(request, token, "get_overview")) as {
    groups: { status: string; projects: { project: string; numbers: { waiting: number; unanswered: number; activeRoadmap: { slug: string; done: number; total: number } } | null }[] }[];
  };
  const group = overview.groups.find((candidate) => candidate.projects.some((project) => project.project === PROJECT));
  const numbers = group?.projects.find((project) => project.project === PROJECT)?.numbers;
  expect(group?.status).toBe("waiting");
  expect(numbers?.unanswered).toBe(2);

  await page.goto("/projects");
  const overviewRow = page.locator(`[data-project="${PROJECT}"]`);
  await expect(overviewRow).toHaveCount(1);
  await expect(overviewRow).toContainText(`Waiting ${String(numbers?.waiting)}`);
  await expect(overviewRow).toContainText(`${String(numbers?.activeRoadmap.slug)} ${String(numbers?.activeRoadmap.done)}/${String(numbers?.activeRoadmap.total)}`);
  await expect(page.getByRole("list", { name: "Projects: Waiting for you", exact: true }).locator(`[data-project="${PROJECT}"]`)).toHaveCount(1);

  const detail = (await callTool(request, token, "get_project", { project: PROJECT })) as { project: { status: string }; entries: EntryAnswer[] };
  expect(detail.project.status).toBe("waiting");
  expect(detail.entries.map((entry) => entry.id)).toEqual(["oq-omicron-1", "oq-omicron-2"]);
});

test("the MCP endpoint refuses a request without a token, and assistants find the OAuth server", async ({ request }) => {
  const anonymous = await request.post("/api/mcp", {
    headers: { accept: "application/json, text/event-stream" },
    data: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_inbox", arguments: {} } },
    maxRedirects: 0,
  });
  expect(anonymous.status()).toBe(401);
  const challenge = anonymous.headers()["www-authenticate"] ?? "";
  expect(challenge).toContain("resource_metadata=");
  // Writes are off: the challenge asks an OAuth client for read access only.
  expect(challenge).toContain("mcp:read");
  expect(challenge).not.toContain("mcp:write");
  expect(await anonymous.text()).not.toContain("omicron");

  const resource = await request.get("/.well-known/oauth-protected-resource/api/mcp");
  expect(resource.status()).toBe(200);
  const resourceDocument = (await resource.json()) as { authorization_servers: string[]; scopes_supported: string[] };
  expect(resourceDocument.scopes_supported).toContain("mcp:read");
  expect(resourceDocument.authorization_servers).toHaveLength(1);
  const server = await request.get("/.well-known/oauth-authorization-server");
  expect(server.status()).toBe(200);
  expect(await server.json()).toMatchObject({ code_challenge_methods_supported: ["S256"] });
});
