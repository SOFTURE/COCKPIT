// The local PageLayout renders the theme's PageLayout (@softure-ai/theme-notion 0.31): one wrapper for every screen.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageLayout } from "../../src/shell/page-layout.tsx";

describe("the page layout", () => {
  it("renders the theme's full-width page layout with the header and the sections", () => {
    const markup = renderToStaticMarkup(
      <PageLayout title="Fictional screen" description="A fictional description">
        <section>First section</section>
      </PageLayout>,
    );
    expect(markup).toMatch(/^<div data-slot="page-layout" data-width="full"/);
    expect(markup).toContain("Fictional screen");
    expect(markup).toContain("A fictional description");
    expect(markup).toContain("<section>First section</section>");
  });
});
