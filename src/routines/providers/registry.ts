// The providers COCKPIT calls routines through (CT-20): Claude Code today, at ROUTINES_API_URL (the Anthropic API
// unless the e2e points it at a fake). A new provider is one more adapter here.
import { createClaudeCodeProvider } from "./claude-code/provider.ts";
import { createRoutinesApi, getRoutinesApiUrl } from "./claude-code/routines-api.ts";
import { createRoutineProviders, type RoutineProviders } from "./contract.ts";

export function getRoutineProviders(env: Readonly<Record<string, string | undefined>>): RoutineProviders {
  return createRoutineProviders([createClaudeCodeProvider(createRoutinesApi({ baseUrl: getRoutinesApiUrl(env) }))]);
}
