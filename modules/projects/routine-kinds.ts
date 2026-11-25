// The kinds a routine can be, with no server imports, so the add form can offer them as a list.

/** A routine COCKPIT fires right after it opens a cockpit issue in the project. */
export const COCKPIT_ISSUES_KIND = "cockpit-issues";

/** The kinds a routine can be; the form offers only these and the server accepts only these. */
export const ROUTINE_KINDS = [COCKPIT_ISSUES_KIND] as const;

export type RoutineKind = (typeof ROUTINE_KINDS)[number];
