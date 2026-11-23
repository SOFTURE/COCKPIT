import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { clientAddressHeaders, expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { MCP_PATH } from "../cli/call-tool.ts";
import { E2E_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Runs the real binary against the running app. Shares the database with the other specs: it watches a repository
// no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/terminal-app";
const MCP_URL = `http://localhost:${String(E2E_PORT)}${MCP_PATH}`;
/** The app's time zone (softure.config.ts default), so the CLI formats times as the screens do. */
const APP_TIMEZONE = "Europe/Warsaw";

interface CliRun {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

function runCockpit(args: readonly string[], env: Readonly<Record<string, string>>): Promise<CliRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, ["cli/bin.ts", ...args], { env: { NODE_ENV: "production", PATH: process.env.PATH ?? "", TZ: APP_TIMEZONE, ...env } }, (error, stdout, stderr) => {
      resolve({ code: typeof error?.code === "number" ? error.code : error === null ? 0 : 1, stdout, stderr });
    });
  });
}

/**
 * The edge in front of the app: it adds the client address the app's rate limits require (Cloudflare does in
 * production), and forwards the CLI's POST to the MCP endpoint unchanged otherwise. Every other request is refused,
 * so the edge reaches one fixed URL and nothing a request names.
 */
function startEdge(): Promise<Server> {
  const edge = createServer((request, response) => {
    if (request.method !== "POST" || request.url !== MCP_PATH) {
      response.writeHead(404).end();
      return;
    }
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers)) {
        if (typeof value === "string" && name !== "host" && name !== "connection") headers.set(name, value);
      }
      for (const [name, value] of Object.entries(clientAddressHeaders())) headers.set(name, value);
      void fetch(MCP_URL, { method: "POST", headers, body: Buffer.concat(chunks) }).then(
        async (answer) => {
          const forwarded = Object.fromEntries([...answer.headers].filter(([name]) => name !== "content-encoding" && name !== "content-length"));
          response.writeHead(answer.status, forwarded);
          response.end(Buffer.from(await answer.arrayBuffer()));
        },
        () => {
          response.writeHead(502).end();
        },
      );
    });
  });
  return new Promise((resolve) => edge.listen(0, "127.0.0.1", () => resolve(edge)));
}

let edge: Server;
let edgeOrigin: string;

test.beforeAll(async () => {
  edge = await startEdge();
  edgeOrigin = `http://127.0.0.1:${String((edge.address() as AddressInfo).port)}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => edge.close(resolve));
});

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/** The cells of the table line that starts with `first`, split on the two-space column gap. */
function readRow(output: string, first: string): string[] {
  const line = output.split("\n").find((candidate) => candidate.startsWith(first)) ?? "";
  return line.split(/ {2,}/);
}

test("the terminal prints the same overview, inbox and project as the screens", async ({ page }) => {
  await signIn(page, "/settings");
  await page.getByLabel("Repository").fill(PROJECT);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await page.goto("/scan-status");
  await page.getByRole("button", { name: "Scan now" }).click();
  await expect(page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: PROJECT })).toContainText("Read", {
    timeout: 10_000,
  });

  await page.goto("/account/mcp");
  await page.getByLabel("Name", { exact: true }).fill("Terminal");
  await page.getByRole("button", { name: "Create token" }).click();
  await expect(page.getByText("This token can only read.")).toBeVisible();
  const token = /sftmcp_[A-Za-z0-9_-]+/.exec(await page.content())?.[0] ?? "";
  expect(token).not.toBe("");
  const env = { COCKPIT_URL: edgeOrigin, COCKPIT_TOKEN: token };

  const overview = await runCockpit(["overview"], env);
  expect(overview.stderr).toBe("");
  expect(overview.code).toBe(0);
  const [, roadmap, queued, changes, waiting, ...chips] = readRow(overview.stdout, PROJECT);
  expect(roadmap).toBe("terminal-v1 2/5");
  await page.goto("/projects");
  const screenRow = page.locator(`[data-project="${PROJECT}"]`);
  await expect(screenRow).toContainText(`${String(roadmap)} · Terminal v1`);
  await expect(screenRow).toContainText(`Queued ${String(queued)}`);
  await expect(screenRow).toContainText(`Changes ${String(changes)}`);
  await expect(screenRow).toContainText(`Waiting ${String(waiting)}`);
  expect(chips).toHaveLength(5);
  for (const chip of chips) {
    await expect(screenRow).toContainText(chip);
  }

  const inbox = await runCockpit(["inbox"], env);
  expect(inbox.code).toBe(0);
  const [, text, kind, item, , age, answer] = readRow(inbox.stdout, PROJECT);
  expect([text, kind, item, answer]).toEqual(["Confirm the terminal-app export columns", "Step", "TM-4", "open"]);
  await page.goto("/inbox");
  const entry = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: "Confirm the terminal-app export columns" });
  await expect(entry).toContainText(String(age));

  const detail = await runCockpit(["project", PROJECT, "--json"], env);
  expect(detail.code).toBe(0);
  const projectAnswer = JSON.parse(detail.stdout) as { project: { project: string; status: string }; entries: { id: string }[] };
  expect(projectAnswer.project).toMatchObject({ project: PROJECT, status: "waiting" });
  expect(projectAnswer.entries.map((candidate) => candidate.id)).toEqual(["oq-terminal-1"]);
});

test("the terminal names the cause when the token is missing or COCKPIT does not answer, with no stack", async () => {
  const noToken = await runCockpit(["overview"], { COCKPIT_URL: edgeOrigin });
  expect(noToken).toEqual({
    code: 2,
    stdout: "",
    stderr: "No read token: set COCKPIT_TOKEN to a token from COCKPIT's token page (Settings, Assistant access).\n",
  });

  const unreachable = await runCockpit(["inbox"], { COCKPIT_URL: "http://127.0.0.1:1", COCKPIT_TOKEN: "sftmcp_unknown" });
  expect(unreachable.code).toBe(1);
  expect(unreachable.stdout).toBe("");
  expect(unreachable.stderr).toMatch(/^COCKPIT at http:\/\/127\.0\.0\.1:1 did not answer \(.+\)\. Check the address and that COCKPIT is running\.\n$/);

  const refused = await runCockpit(["inbox"], { COCKPIT_URL: edgeOrigin, COCKPIT_TOKEN: "sftmcp_unknown" });
  expect(refused.code).toBe(1);
  expect(refused.stderr).toContain("refused the token");
});
