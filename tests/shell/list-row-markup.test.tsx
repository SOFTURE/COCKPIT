// The one list row (CT-18): what the row is on the left, a right column with the state on top and the actions under it,
// and, when the row opens something, its title as a link stretched over the whole row, which lights as one box.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListRow } from "../../src/shell/list-row.tsx";

describe("a list row", () => {
  it("puts the identity left and the state above the actions in the right column", () => {
    const markup = renderToStaticMarkup(
      <ListRow title="example-org/alpha-app" details={<p>checked 13:00</p>} status={<b>Readable</b>} actions={<button type="button">Remove</button>} data={{ "data-repository": "alpha" }} />,
    );
    expect(markup).toMatch(/^<li data-repository="alpha" class="[^"]*" data-list-row="">/);
    expect(markup).toMatch(/data-row-identity=""[^>]*><span[^>]*data-row-title="">example-org\/alpha-app<\/span><p>checked 13:00<\/p><\/div>/);
    expect(markup).toMatch(/data-row-side=""[^>]*><div[^>]*data-row-status=""[^>]*><b>Readable<\/b><\/div><div[^>]*data-row-actions=""[^>]*><button type="button">Remove<\/button><\/div><\/div>/);
    // A row that opens nothing is not lit on hover.
    expect(markup).not.toContain("hover:bg-accent");
  });

  it("leaves out the slots it has nothing for", () => {
    const markup = renderToStaticMarkup(<ListRow title="Alpha" status={null} actions={[null, false]} />);
    expect(markup).not.toContain("data-row-side");
    expect(markup).not.toContain("data-row-status");
    expect(markup).not.toContain("data-row-actions");
  });

  it("stretches the title's link over the row, lights the row on hover, shows the arrow first and keeps the actions above the link", () => {
    const markup = renderToStaticMarkup(<ListRow title="Run the doctor" href="/broadcast/1" actions={<button type="button">Delete</button>} />);
    expect(markup).toMatch(/^<li[^>]*class="[^"]*hover:bg-accent/);
    expect(markup).toMatch(/<a class="[^"]*after:absolute after:inset-0[^"]*" data-row-link="" href="\/broadcast\/1">Run the doctor<\/a>/);
    expect(markup).toMatch(/<div class="relative [^"]*" data-row-side="">/);
    expect(markup).toMatch(/data-row-actions=""[^>]*><svg[^>]*lucide-arrow-right[^>]*>.*<\/svg><button type="button">Delete<\/button>/);
  });

  it("opens an external link in a new tab without a referrer", () => {
    const markup = renderToStaticMarkup(<ListRow title="#77 Test" href="https://github.com/example-org/alpha-app/issues/77" isExternal />);
    expect(markup).toMatch(/<a href="https:\/\/github.com\/example-org\/alpha-app\/issues\/77" rel="noreferrer" target="_blank"/);
  });

  it("gives the right column the row's whole width while a control in it needs room (data-row-wide)", () => {
    const markup = renderToStaticMarkup(<ListRow title="Confirm the import format" actions={<form data-row-wide="" />} />);
    expect(markup).toMatch(/<div class="[^"]*has-\[\[data-row-wide\]\]:basis-full[^"]*" data-row-side="">/);
    expect(markup).toMatch(/<div class="[^"]*has-\[\[data-row-wide\]\]:justify-start[^"]*" data-row-actions="">/);
  });

  it("keeps the arrow beside a state that wraps, never on a line of its own", () => {
    const markup = renderToStaticMarkup(<ListRow title="example-org/xi-app" href="/projects/example-org/xi-app" status={[<b key="a">Waiting for you</b>, <b key="b">Drift</b>]} />);
    expect(markup).toMatch(/data-row-status=""><div class="[^"]*flex-wrap[^"]*"><b>Waiting for you<\/b><b>Drift<\/b><\/div><span class="[^"]*"><svg[^>]*lucide-arrow-right/);
  });
});
