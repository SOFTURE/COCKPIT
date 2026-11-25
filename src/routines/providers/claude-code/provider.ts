// The Claude Code provider (CT-20): a routine's trigger id (pasted as the id or the fire URL) and its token, fired
// over the Claude Code routines API.
import { z } from "zod";
import { CLAUDE_CODE_PROVIDER, PROVIDER_FIELDS } from "../../../../modules/projects/routine-providers.ts";
import type { RoutineProvider } from "../contract.ts";
import type { RoutinesApi } from "./routines-api.ts";
import { parseTriggerId } from "./trigger-id.ts";

const storedSchema = z.object({ triggerId: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/) });

export function createClaudeCodeProvider(api: RoutinesApi): RoutineProvider {
  return {
    id: CLAUDE_CODE_PROVIDER,
    fields: PROVIDER_FIELDS[CLAUDE_CODE_PROVIDER],
    parseSettings: (input) => {
      const triggerId = parseTriggerId(input.triggerId ?? "");
      return triggerId === null ? null : { triggerId };
    },
    readSettings: (stored) => {
      const parsed = storedSchema.safeParse(stored);
      return parsed.success ? { triggerId: parsed.data.triggerId } : null;
    },
    describe: (settings) => settings.triggerId ?? "",
    fire: ({ settings, token, text }) => api.fire({ triggerId: settings.triggerId ?? "", token, text }),
  };
}
