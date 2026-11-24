import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer, request as forwardRequest, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { clientAddressHeaders, expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { MCP_PATH } from "../cli/call-tool.ts";
import { CLI_BIN_FILE, packCli } from "../scripts/pack-cli.ts";
import { E2E_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { READ_AT, scanUntilSettled } from "./scan-until-settled.ts";

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

/** The checkout's bin by default; the packed package's bundled bin when `bin` names it (CMP-18). */
function runCockpit(args: readonly string[], env: Readonly<Record<string, string>>, bin = "cli/bin.ts"): Promise<CliRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, [bin, ...args], { env: { NODE_ENV: "production", PATH: process.env.PATH ?? "", TZ: APP_TIMEZONE, ...env } }, (error, stdout, stderr) => {
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
      // A fresh connection per request (`agent: false`): a pooled keep-alive socket the app has just closed would
      // turn a good request into a 502 now and then.
      const forward = forwardRequest(MCP_URL, { method: "POST", headers: Object.fromEntries(headers), agent: false }, (answer) => {
        response.writeHead(answer.statusCode ?? 502, answer.headers);
        answer.pipe(response);
      });
      forward.on("error", (error) => {
        console.error(`e2e edge: forwarding to ${MCP_URL} failed: ${error.message}`);
        response.writeHead(502).end();
      });
      forward.end(Buffer.concat(chunks));
    });
  });
  return new Promise((resolve) => edge.listen(0, "127.0.0.1", () => resolve(edge)));
}

let edge: Server;
let edgeOrigin: string;
let packageDir: string;

test.beforeAll(async () => {
  edge = await startEdge();
  edgeOrigin = `http://127.0.0.1:${String((edge.address() as AddressInfo).port)}`;
  packageDir = await mkdtemp(path.join(tmpdir(), "cockpit-cli-package-"));
  await packCli({ rootDir: process.cwd(), outDir: packageDir });
});

test.afterAll(async () => {
  await new Promise((resolve) => edge.close(resolve));
  await rm(packageDir, { recursive: true, force: true });
});

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/**
 * The output with every read time replaced: the specs share the database and scan it in parallel, so another spec's
 * scan can read this repository again between two runs and move its read time.
 */
function withoutReadTimes(output: string): string {
  return output.replace(/Read \w{3} \d+, \d{4}, \d{1,2}:\d{2}\s[AP]M/g, "Read <time>").replace(/"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z"/g, '"<time>"');
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
  await scanUntilSettled(page, [PROJECT]);

  await page.goto("/account/mcp");
  await page.getByLabel("Name", { exact: true }).fill("Terminal");
  await page.getByRole("button", { name: "Create token" }).click();
  await expect(page.getByText("This token can only read.")).toBeVisible();
  const token = /sftmcp_[A-Za-z0-9_-]+/.exec(await page.content())?.[0] ?? "";
  expect(token).not.toBe("");
  const env = { COCKPIT_URL: edgeOrigin, COCKPIT_TOKEN: token };

  const overview = await runCockpit(["overview"], env);
  expect({ code: overview.code, stderr: overview.stderr }).toEqual({ code: 0, stderr: "" });
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
    // Another spec's scan can read this repository again and move its read time; the chip says "Read" all the same.
    await expect(screenRow).toContainText(chip.startsWith("Read ") ? READ_AT : chip);
  }

  const inbox = await runCockpit(["inbox"], env);
  expect({ code: inbox.code, stderr: inbox.stderr }).toEqual({ code: 0, stderr: "" });
  const [, text, kind, item, , age, answer] = readRow(inbox.stdout, PROJECT);
  expect([text, kind, item, answer]).toEqual(["Confirm the terminal-app export columns", "Step", "TM-4", "open"]);
  await page.goto("/inbox");
  const entry = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: "Confirm the terminal-app export columns" });
  await expect(entry).toContainText(String(age));

  const detail = await runCockpit(["project", PROJECT, "--json"], env);
  expect({ code: detail.code, stderr: detail.stderr }).toEqual({ code: 0, stderr: "" });
  const projectAnswer = JSON.parse(detail.stdout) as { project: { project: string; status: string }; entries: { id: string }[] };
  expect(projectAnswer.project).toMatchObject({ project: PROJECT, status: "waiting" });
  expect(projectAnswer.entries.map((candidate) => candidate.id)).toEqual(["oq-terminal-1"]);

  // The package published to npm prints exactly what the checkout prints (CMP-18). Other specs scan their own
  // repositories in parallel, so the overview and the inbox are compared on this repository's lines only.
  const packedBin = path.join(packageDir, CLI_BIN_FILE);
  const linesOf = (output: string) =>
    withoutReadTimes(output)
      .split("\n")
      .filter((line) => line.startsWith(PROJECT));
  for (const args of [["overview"], ["inbox"]]) {
    const fromCheckout = await runCockpit(args, env);
    const fromPackage = await runCockpit(args, env, packedBin);
    // Code and stderr together, so a failure names its cause.
    expect({ code: fromCheckout.code, stderr: fromCheckout.stderr }).toEqual({ code: 0, stderr: "" });
    expect({ code: fromPackage.code, stderr: fromPackage.stderr }).toEqual({ code: 0, stderr: "" });
    expect(linesOf(fromPackage.stdout)).toEqual(linesOf(fromCheckout.stdout));
    expect(linesOf(fromPackage.stdout)).not.toHaveLength(0);
  }
  for (const args of [["project", PROJECT], ["project", PROJECT, "--json"]]) {
    const fromCheckout = await runCockpit(args, env);
    const fromPackage = await runCockpit(args, env, packedBin);
    expect({ ...fromPackage, stdout: withoutReadTimes(fromPackage.stdout) }).toEqual({ ...fromCheckout, stdout: withoutReadTimes(fromCheckout.stdout) });
  }
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
