// CT-24: a merge and a release say their state once, as the badge; the line under the title gives only the time (and
// the author of a merge).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { MergesSection, ReleasesSection } from "../../src/project-page/history/history-sections.tsx";
import { countText, getRowPart } from "../support/row-markup.ts";

const COPY = getMessages("en").projectHistory;
const formatTime = () => "Nov 23, 2026, 11:00 AM";

describe("a merge row", () => {
  const markup = renderToStaticMarkup(
    <MergesSection
      block={{ status: "ok", value: [{ number: 80, title: "Row change", url: "https://forge.example.test/pull/80", mergedAt: "2026-11-23T10:00:00Z", author: "example-dev", headSha: null }] }}
      copy={COPY}
      formatTime={formatTime}
    />,
  );

  it("says merged once, as its badge on the right", () => {
    expect(countText(markup, "merged")).toBe(1);
    expect(countText(getRowPart(markup, "side"), "Merged")).toBe(1);
  });

  it("gives its time and author once, on the left", () => {
    const identity = getRowPart(markup, "identity");
    expect(countText(identity, "Nov 23, 2026, 11:00 AM")).toBe(1);
    expect(countText(identity, "by example-dev")).toBe(1);
  });
});

describe("a release row", () => {
  const markup = renderToStaticMarkup(
    <ReleasesSection
      block={{
        status: "ok",
        value: [
          { version: "v1.0.0", title: null, url: "https://forge.example.test/releases/v1.0.0", publishedAt: "2026-11-20T12:00:00Z", isPrerelease: false },
          { version: "v1.1.0-rc.1", title: null, url: "https://forge.example.test/releases/v1.1.0-rc.1", publishedAt: "2026-11-23T12:00:00Z", isPrerelease: true },
        ],
      }}
      copy={COPY}
      formatTime={formatTime}
    />,
  );

  it("says published once, as the badge of the published release", () => {
    expect(countText(markup, "published")).toBe(1);
    expect(countText(markup, COPY.prerelease)).toBe(1);
  });

  it("gives each release's time once, on the left", () => {
    expect(countText(markup, "Nov 23, 2026, 11:00 AM")).toBe(2);
  });
});
