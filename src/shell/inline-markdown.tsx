// Inline markdown from a project's own files (roadmap fields, owner entries) as React nodes: `code`, **bold** and
// [links](https://...). Never HTML: anything else stays plain text, so untrusted text cannot inject markup.
import { Fragment, type ReactNode } from "react";

const TOKEN_RE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const index = match.index;
    if (index > last) {
      nodes.push(text.slice(last, index));
    }
    const key = String(index);
    if (match[1] !== undefined) {
      nodes.push(
        <code key={key} className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em] break-all">
          {match[1]}
        </code>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else {
      nodes.push(
        <a key={key} href={match[4]} className="underline underline-offset-2" rel="noreferrer" target="_blank">
          {match[3]}
        </a>,
      );
    }
    last = index + match[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes;
}

export function InlineMarkdown({ text }: { readonly text: string }) {
  return <Fragment>{renderInlineMarkdown(text)}</Fragment>;
}
