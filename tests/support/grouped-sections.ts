// Reads the group sections of `ProjectGroupSections` markup (CT-32, CT-35): each section's label, its heading's text,
// its list's label (undefined for stacked cards) and the rows it holds, named by `data-project`, `data-row` or a
// card's heading (`title`: the row's ListEntry title or the card's h2).

export interface GroupedSection {
  readonly label: string | undefined;
  readonly heading: string | undefined;
  readonly list: string | undefined;
  readonly rows: string[];
}

function toText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function groupedSections(html: string, rowsBy: "data-project" | "title" | "card"): GroupedSection[] {
  return [...html.matchAll(/<section aria-label="([^"]*)"[^>]*data-group="[^"]*">(.*?)<\/section>(?=<section aria-label="Group|<\/div>$)/g)].map((match) => {
    const body = match[2] ?? "";
    let rows: string[];
    if (rowsBy === "data-project") {
      rows = [...body.matchAll(/<div[^>]*data-project="([^"]*)"/g)].map((row) => row[1] ?? "");
    } else if (rowsBy === "card") {
      rows = [...body.matchAll(/<h2 id="[^"]*"[^>]*>(.*?)<\/h2>/g)].map((row) => toText(row[1] ?? ""));
    } else {
      rows = [...body.matchAll(/data-slot="list-entry-title"[^>]*>(.*?)<\//g)].map((row) => toText(row[1] ?? ""));
    }
    return {
      label: match[1],
      heading: toText(/<h2 class="flex items-baseline[^"]*"[^>]*>(.*?)<\/h2>/.exec(body)?.[1] ?? ""),
      list: /<ul[^>]*aria-label="([^"]*)"/.exec(body)?.[1],
      rows,
    };
  });
}
