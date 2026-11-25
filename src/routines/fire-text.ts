// The texts COCKPIT fires a routine with, whatever its provider, exactly as `routines/cockpit-command.md` of
// @softure-ai/skills expects.

/** A cockpit issue's fire: one line linking the issue, nothing more. The routine's own prompt says how to act on it. */
export function formatIssueFireText(issue: { readonly fullName: string; readonly number: number }): string {
  return `COCKPIT command: https://github.com/${issue.fullName}/issues/${String(issue.number)}`;
}

/** The text of a routine's Test button (`COCKPIT test: <short text>`). */
export const TEST_FIRE_TEXT = "COCKPIT test: reply in this chat that the test arrived; change nothing.";
