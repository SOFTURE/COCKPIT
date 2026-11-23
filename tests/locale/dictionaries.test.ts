import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "../../messages/en.ts";
import { getMessages } from "../../messages/index.ts";
import { pl } from "../../messages/pl.ts";

type Tree = { readonly [key: string]: string | Tree };

/** Every leaf as `dotted.path → text`. */
function flatten(tree: Tree, prefix = ""): Map<string, string> {
  const leaves = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const keyPath = prefix === "" ? key : `${prefix}.${key}`;
    if (typeof value === "string") {
      leaves.set(keyPath, value);
    } else {
      for (const [leafPath, text] of flatten(value, keyPath)) {
        leaves.set(leafPath, text);
      }
    }
  }
  return leaves;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/gu)].map((match) => match[1] ?? "").sort();
}

/** Texts that read the same in both languages: a product name and a status of a tool named in English. */
const SAME_IN_BOTH = new Set(["overview.doctorOk"]);

const english = flatten(en);
const polish = flatten(pl);

describe("the Polish dictionary", () => {
  it("has every key of the English one and no other", () => {
    expect([...polish.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("keeps the placeholders of every English text", () => {
    const mismatched = [...english].filter(([key, text]) => JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(polish.get(key) ?? "")));
    expect(mismatched.map(([key]) => key)).toEqual([]);
  });

  it("translates every text that is not a name, a placeholder pattern or a protocol marker", () => {
    const sameAsEnglish = [...english]
      .filter(([key, text]) => polish.get(key) === text && !SAME_IN_BOTH.has(key) && /\p{L}{2,}\s+\p{L}/u.test(text.replace(/\{\w+\}/gu, "")))
      .map(([key]) => key);
    expect(sameAsEnglish).toEqual([]);
  });

  it("keeps the MCP untrusted-data markers byte for byte", () => {
    expect(pl.mcp.untrustedOpen).toBe(en.mcp.untrustedOpen);
    expect(pl.mcp.untrustedClose).toBe(en.mcp.untrustedClose);
  });

  it("is what getMessages returns for pl, and English stays the fallback", () => {
    expect(getMessages("pl")).toBe(pl);
    expect(getMessages("en")).toBe(en);
    expect(getMessages("de")).toBe(en);
  });
});

const SOURCE_ROOTS = ["app", "src"];
/** JSX text with a word in it, or a literal accessible name, title, placeholder or alt text. */
const INLINE_COPY = [/>\s*[^<>{}=\s][^<>{}]*\p{L}{2,}[^<>{}]*</u, /\b(?:aria-label|title|placeholder|alt)="[^"]*\p{L}[^"]*"/u];

async function listTsx(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".tsx")).map((entry) => path.join(entry.parentPath, entry.name));
}

describe("user-visible text", () => {
  it("lives in the message dictionaries, never inline in a component", async () => {
    const files = (await Promise.all(SOURCE_ROOTS.map((root) => listTsx(root)))).flat();
    const hits: string[] = [];
    for (const file of files) {
      const lines = (await readFile(file, "utf8")).split("\n");
      lines.forEach((line, index) => {
        const code = line.trimStart();
        if (code.startsWith("//") || code.startsWith("*") || code.startsWith("/*") || code.startsWith("readonly ") || code.startsWith("import ")) {
          return;
        }
        if (INLINE_COPY.some((pattern) => pattern.test(line))) {
          hits.push(`${file}:${String(index + 1)}: ${code}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });
});
