// CT-28: every result badge is theme-notion's ResultBadge. Each caller keeps its tone, its icon, its word, its hover
// title and its own `data-*` attribute; the theme names the tone in `data-tone` and the colour in `data-color`.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { HealthChip } from "../../src/adapters/observability/health-chip.tsx";
import { SendStatus } from "../../src/broadcast/send-status.tsx";
import { DriftChips } from "../../src/drift/drift-flags.tsx";
import { AnswerStateBadge } from "../../src/inbox/answer-state-badge.tsx";
import { MergesSection, ReleasesSection } from "../../src/project-page/history/history-sections.tsx";
import { RepositoryStatus } from "../../src/projects/repository-status.tsx";
import { WakeChip } from "../../src/routines/wake-chip.tsx";
import { ReadStatus } from "../../src/scan/read-status.tsx";
import type { RunResult } from "../../src/scheduled/build-scheduled-rows.ts";
import { ScheduledRunRow } from "../../src/scheduled/scheduled-run-row.tsx";
import { getResultBadge, getResultBadges } from "../support/result-badge-markup.ts";

const MESSAGES = getMessages("en");

describe("the access badge of a watched repository", () => {
  it("reads green with a check when the repository is readable", () => {
    const badge = getResultBadge(renderToStaticMarkup(<RepositoryStatus status="readable" copy={MESSAGES.repositories} />), "data-access-status", "readable");
    expect(badge.attributes["data-tone"]).toBe("success");
    expect(badge.attributes["data-color"]).toBe("green");
    expect(badge.icon).toBe("circle-check");
    expect(badge.word).toBe(MESSAGES.repositories.statusReadable);
    expect(badge.attributes.title).toBe(MESSAGES.repositories.statusReadable);
  });

  it("reads orange with its own icon when permissions are missing", () => {
    const badge = getResultBadge(renderToStaticMarkup(<RepositoryStatus status="missing_permissions" copy={MESSAGES.repositories} />), "data-access-status", "missing_permissions");
    expect(badge.attributes["data-tone"]).toBe("warning");
    expect(badge.attributes["data-color"]).toBe("orange");
    expect(badge.icon).toBe("triangle-exclamation-point");
  });
});

describe("the read status badge", () => {
  it("reads red for an invalid state and grey with a dot for a project never read", () => {
    const invalid = getResultBadge(renderToStaticMarkup(<ReadStatus status="state_invalid" copy={MESSAGES.scan} />), "data-read-status", "state_invalid");
    expect(invalid.attributes["data-tone"]).toBe("danger");
    expect(invalid.attributes["data-color"]).toBe("red");
    expect(invalid.word).toBe(MESSAGES.scan.status.state_invalid);
    const never = getResultBadge(renderToStaticMarkup(<ReadStatus status="never" copy={MESSAGES.scan} />), "data-read-status", "never");
    expect(never.attributes["data-tone"]).toBe("muted");
    expect(never.attributes["data-color"]).toBe("gray");
    expect(never.icon).toBe("circle-dot");
  });
});

describe("the send badge of a broadcast", () => {
  it("reads green when done, red when failed and grey with a send icon when sent", () => {
    const render = (state: "done" | "failed" | "sent") => getResultBadge(renderToStaticMarkup(<SendStatus state={state} copy={MESSAGES.broadcast} />), "data-send-state", state);
    expect(render("done").attributes["data-color"]).toBe("green");
    expect(render("failed").attributes["data-color"]).toBe("red");
    expect(render("sent").icon).toBe("send");
    expect(render("sent").word).toBe(MESSAGES.broadcast.states.sent);
  });
});

describe("the waking chip", () => {
  it("reads green when the project wakes on its own, with the hint on hover", () => {
    const badge = getResultBadge(renderToStaticMarkup(<WakeChip wake="on_its_own" copy={MESSAGES.wake} />), "data-wake", "on_its_own");
    expect(badge.attributes["data-tone"]).toBe("success");
    expect(badge.attributes.title).toBe(MESSAGES.wake.hints.on_its_own);
    expect(badge.word).toBe(MESSAGES.wake.states.on_its_own);
  });

  it("reads grey with the theme's muted icon when the project has no waking", () => {
    const badge = getResultBadge(renderToStaticMarkup(<WakeChip wake="none" copy={MESSAGES.wake} />), "data-wake", "none");
    expect(badge.attributes["data-tone"]).toBe("muted");
    expect(badge.icon).toBe("circle-minus");
  });
});

describe("a drift chip", () => {
  it("reads orange with the compare icon, the drift's title as its word and the settle step on hover", () => {
    const markup = renderToStaticMarkup(<DriftChips drift={[{ kind: "finished_roadmap_live", slug: "alpha", total: 3 }]} copy={MESSAGES.drift} />);
    const badge = getResultBadge(markup, "data-drift", "finished_roadmap_live");
    expect(badge.attributes["data-tone"]).toBe("warning");
    expect(badge.icon).toBe("git-compare-arrows");
    expect(badge.attributes.title).toContain(MESSAGES.drift.settleLabel);
  });
});

describe("the health chip", () => {
  it("reads green when healthy, red with the firing alerts on hover when not", () => {
    const healthy = getResultBadge(renderToStaticMarkup(<HealthChip health={{ kind: "healthy", rules: 3 }} copy={MESSAGES.health} />), "data-health", "healthy");
    expect(healthy.attributes["data-color"]).toBe("green");
    expect(healthy.word).toBe(MESSAGES.health.healthy);
    const unhealthy = getResultBadge(
      renderToStaticMarkup(<HealthChip health={{ kind: "unhealthy", firing: ["Disk full"] }} copy={MESSAGES.health} />),
      "data-health",
      "unhealthy",
    );
    expect(unhealthy.attributes["data-tone"]).toBe("danger");
    expect(unhealthy.attributes.title).toBe("Disk full");
  });
});

describe("an answer state badge", () => {
  it("spins while the answer is sending, and stands still once done", () => {
    const sending = getResultBadge(renderToStaticMarkup(<AnswerStateBadge state="sending" copy={MESSAGES.inbox} />), "data-answer-state", "sending");
    expect(sending.isSpinning).toBe(true);
    expect(sending.attributes["data-spinning"]).toBe("true");
    const done = getResultBadge(renderToStaticMarkup(<AnswerStateBadge state="done" copy={MESSAGES.inbox} />), "data-answer-state", "done");
    expect(done.isSpinning).toBe(false);
    expect(done.attributes["data-spinning"]).toBeUndefined();
  });
});

describe("the history badges", () => {
  const formatTime = () => "Nov 23, 2026, 11:00 AM";

  it("marks a merge green with the merge icon", () => {
    const markup = renderToStaticMarkup(
      <MergesSection
        block={{ status: "ok", value: [{ number: 80, title: "Row change", url: "https://forge.example.test/pull/80", mergedAt: "2026-11-23T10:00:00Z", author: "example-dev", headSha: null }] }}
        copy={MESSAGES.projectHistory}
        formatTime={formatTime}
      />,
    );
    const merge = getResultBadge(markup, "data-merge-state", "merged");
    expect(merge.attributes["data-tone"]).toBe("success");
    expect(merge.icon).toBe("git-merge");
  });

  it("marks a prerelease grey and a published release green, both with the tag icon", () => {
    const markup = renderToStaticMarkup(
      <ReleasesSection
        block={{
          status: "ok",
          value: [
            { version: "v1.0.0", title: null, url: "https://forge.example.test/releases/v1.0.0", publishedAt: "2026-11-20T12:00:00Z", isPrerelease: false },
            { version: "v1.1.0-rc.1", title: null, url: "https://forge.example.test/releases/v1.1.0-rc.1", publishedAt: "2026-11-23T12:00:00Z", isPrerelease: true },
          ],
        }}
        copy={MESSAGES.projectHistory}
        formatTime={formatTime}
      />,
    );
    const tones = getResultBadges(markup).map((badge) => [badge.attributes["data-release-state"], badge.attributes["data-tone"], badge.icon]);
    expect(tones).toEqual([
      ["published", "success", "tag"],
      ["prerelease", "muted", "tag"],
    ]);
  });
});

describe("the result badge of a scheduled task's run (CT-37)", () => {
  const COPY = MESSAGES.scheduledPage;
  const render = (result: RunResult) =>
    getResultBadge(
      renderToStaticMarkup(
        <ScheduledRunRow
          copy={COPY}
          failures={MESSAGES.scheduled.failures}
          row={{ id: "00000000-0000-4000-8000-000000000001", title: "Weekly check", details: "2 projects", sentAt: "sent today", result, href: null }}
        />,
      ),
      "data-run-result",
      result.kind,
    );

  it("reads green with every send made, red when any failed and grey while sending", () => {
    const sent = render({ kind: "sent", sent: 5, total: 5 });
    expect(sent.attributes["data-color"]).toBe("green");
    expect(sent.word).toBe("Sent 5 of 5");
    const failed = render({ kind: "failed", failed: 2, total: 5 });
    expect(failed.attributes["data-color"]).toBe("red");
    expect(failed.word).toBe("Failed in 2 of 5");
    const sending = render({ kind: "sending" });
    expect(sending.attributes["data-tone"]).toBe("muted");
    expect(sending.word).toBe("Sending");
  });

  it("reads red for a run that sent nothing, with the reason on hover", () => {
    const notSent = render({ kind: "not_sent", failure: "no_projects" });
    expect(notSent.attributes["data-color"]).toBe("red");
    expect(notSent.word).toBe("Not sent");
    expect(notSent.attributes.title).toBe(MESSAGES.scheduled.failures.no_projects);
  });
});
