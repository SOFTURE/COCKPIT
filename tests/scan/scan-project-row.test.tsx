// CT-24: a project on Scan status says it was read once (its badge) with the time it was checked, and a project never
// read says "Not read yet" once.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { ScanProjectRow } from "../../src/scan/scan-project-row.tsx";
import type { ProjectScanRow } from "../../src/scan/scan-status.ts";
import { countText, getRowPart } from "../support/row-markup.ts";

const COPY = getMessages("en").scan;
const formatTime = () => "Nov 25, 2026, 11:21 PM";

function render(project: Partial<ProjectScanRow>): string {
  return renderToStaticMarkup(
    <ul>
      <ScanProjectRow
        project={{ key: "example-org/alpha-app", fullName: "example-org/alpha-app", status: "ok", hasIssuesProblem: false, readAt: new Date("2026-11-25T22:21:00Z"), lastGoodAt: null, ...project }}
        copy={COPY}
        formatTime={formatTime}
      />
    </ul>,
  );
}

describe("a project row on Scan status", () => {
  it("says read once, as its badge, and when it was checked on the left", () => {
    const markup = render({});
    expect(countText(markup, "read")).toBe(1);
    expect(countText(getRowPart(markup, "data-row-side"), "Read")).toBe(1);
    expect(countText(getRowPart(markup, "data-row-identity"), "Checked Nov 25, 2026, 11:21 PM")).toBe(1);
  });

  it("says not read yet once, as its badge, for a project never read", () => {
    const markup = render({ status: "never", readAt: null });
    expect(countText(markup, "Not read yet")).toBe(1);
    expect(countText(getRowPart(markup, "data-row-side"), "Not read yet")).toBe(1);
  });

  it("keeps the last good read beside the check of a failing project", () => {
    const markup = render({ status: "not_readable", lastGoodAt: new Date("2026-11-24T10:00:00Z") });
    expect(countText(markup, "Checked Nov 25, 2026, 11:21 PM · Last good read Nov 25, 2026, 11:21 PM")).toBe(1);
    expect(countText(markup, "Not readable")).toBe(1);
  });
});
