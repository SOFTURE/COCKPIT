// The providers a routine can be called through and the setting fields each declares, with no server imports, so the
// add form can offer them as a list. The adapters that call a provider live in src/routines/providers/.

/** Claude Code routines, fired over the Claude Code routines API. */
export const CLAUDE_CODE_PROVIDER = "claude-code";

/** The providers the form offers; the server accepts a provider only when its adapter is registered. */
export const ROUTINE_PROVIDERS = [CLAUDE_CODE_PROVIDER] as const;

export type RoutineProviderId = (typeof ROUTINE_PROVIDERS)[number];

/** The non-secret settings each provider asks for, in form order; every provider also takes one sealed token. */
export const PROVIDER_FIELDS: Readonly<Record<RoutineProviderId, readonly string[]>> = {
  [CLAUDE_CODE_PROVIDER]: ["triggerId"],
};
