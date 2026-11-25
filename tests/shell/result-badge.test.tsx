// One colour language for results: green done or fired, red failed, orange needs attention, grey none or pending,
// always an icon plus a word (CT-18).
import { CircleCheck } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getResultColor, ResultBadge, type ResultTone } from "../../src/shell/result-badge.tsx";

describe("the result colour map", () => {
  it("gives each result tone exactly one colour", () => {
    const tones: readonly ResultTone[] = ["success", "danger", "warning", "muted"];
    expect(Object.fromEntries(tones.map((tone) => [tone, getResultColor(tone)]))).toEqual({
      success: "green",
      danger: "red",
      warning: "orange",
      muted: "gray",
    });
  });
});

describe("a result badge", () => {
  it("is a filled tag in its tone's colour with an icon, the word, its tooltip and data attributes", () => {
    const markup = renderToStaticMarkup(
      <ResultBadge tone="danger" title="Fire failed · HTTP 503" data={{ "data-fired-badge": "failed" }}>
        Failed
      </ResultBadge>,
    );
    expect(markup).toMatch(/^<span[^>]*class="[^"]*bg-red-tag[^"]*"[^>]*title="Fire failed · HTTP 503"[^>]*data-fired-badge="failed"[^>]*data-result="danger"[^>]*><svg[^>]*aria-hidden="true"[^>]*>.*<\/svg>Failed<\/span>$/);
  });

  it("takes the tone's own icon unless the state brings its own", () => {
    const own = renderToStaticMarkup(<ResultBadge tone="muted">Pending</ResultBadge>);
    const given = renderToStaticMarkup(<ResultBadge tone="muted" icon={CircleCheck}>Pending</ResultBadge>);
    expect(own).toContain("lucide-circle-dashed");
    expect(given).toContain("lucide-circle-check");
    expect(given).toContain("bg-gray-tag");
  });

  it("names its colour in data-tone, so a check reads what the eye sees", () => {
    expect(renderToStaticMarkup(<ResultBadge tone="warning">Behind</ResultBadge>)).toContain('data-result="warning" data-tone="orange"');
  });

  it("turns its icon only while the result is still running", () => {
    expect(renderToStaticMarkup(<ResultBadge tone="muted" isSpinning>Running</ResultBadge>)).toContain("motion-safe:animate-spin");
    expect(renderToStaticMarkup(<ResultBadge tone="muted">Cancelled</ResultBadge>)).not.toContain("animate-spin");
  });
});
