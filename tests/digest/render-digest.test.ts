import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { getProjectUrl, renderDigest } from "../../src/digest/render-digest.ts";

const ORIGIN = "https://cockpit.example.test";
const ALPHA = "example-org/alpha-app";
const messages = getMessages("en");

describe("the digest mail", () => {
  it("lists shipped, waiting and broken lines under their sections, each with a link", () => {
    const mail = renderDigest({
      appOrigin: ORIGIN,
      messages,
      changes: {
        shipped: [
          { kind: "item", projectKey: ALPHA, projectName: ALPHA, itemId: "AL-2", outcome: "the second screen" },
          { kind: "item", projectKey: ALPHA, projectName: ALPHA, itemId: "AL-3", outcome: null },
          { kind: "release", projectKey: ALPHA, projectName: ALPHA, version: "1.1.0" },
        ],
        waiting: [{ projectKey: ALPHA, projectName: ALPHA, entryId: "oq-2", text: "Release 1.1.0?" }],
        broke: [{ projectKey: ALPHA, projectName: ALPHA, reasons: ["ci_failed", "doctor_failing"] }],
      },
    });
    expect(mail.subject).toBe("COCKPIT: 5 changes since the last digest");
    expect(mail.text).toBe(
      [
        "What changed in your watched projects since the last digest.",
        "",
        "Shipped",
        "- example-org/alpha-app: AL-2, the second screen\n  https://cockpit.example.test/projects/example-org/alpha-app",
        "- example-org/alpha-app: AL-3 is done\n  https://cockpit.example.test/projects/example-org/alpha-app",
        "- example-org/alpha-app: released 1.1.0\n  https://cockpit.example.test/projects/example-org/alpha-app",
        "",
        "Waits for you",
        "- example-org/alpha-app: Release 1.1.0?\n  https://cockpit.example.test/inbox",
        "",
        "Broke",
        "- example-org/alpha-app: the last CI run on its main branch failed; its context doctor fails on the main branch\n  https://cockpit.example.test/projects/example-org/alpha-app",
      ].join("\n"),
    );
    expect(mail.html).toContain("<h2>Shipped</h2>");
    expect(mail.html).toContain("<h2>Waits for you</h2>");
    expect(mail.html).toContain("<h2>Broke</h2>");
    expect(mail.html).toContain('<a href="https://cockpit.example.test/inbox">Answer in the inbox</a>');
  });

  it("leaves out empty sections and counts one change in the singular", () => {
    const mail = renderDigest({
      appOrigin: ORIGIN,
      messages,
      changes: { shipped: [], waiting: [{ projectKey: ALPHA, projectName: ALPHA, entryId: "oq-2", text: "Go?" }], broke: [] },
    });
    expect(mail.subject).toBe("COCKPIT: 1 change since the last digest");
    expect(mail.text).not.toContain("Shipped");
    expect(mail.html).not.toContain("Broke");
  });

  it("escapes repository text in the HTML body and keeps it out of the subject", () => {
    const text = '<script>alert("x")</script> & more';
    const mail = renderDigest({ appOrigin: ORIGIN, messages, changes: { shipped: [], waiting: [{ projectKey: ALPHA, projectName: ALPHA, entryId: "oq-9", text }], broke: [] } });
    expect(mail.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more");
    expect(mail.html).not.toContain("<script>");
    expect(mail.subject).not.toContain("script");
  });

  it("encodes each part of the project page link", () => {
    expect(getProjectUrl(ORIGIN, "example-org/alpha app")).toBe("https://cockpit.example.test/projects/example-org/alpha%20app");
  });
});
