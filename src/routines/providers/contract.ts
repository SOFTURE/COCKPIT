// The provider adapter contract (CT-20): everything about how a routine is called lives behind one adapter per
// provider (its settings, how they are checked and read, and the call itself). The fire queue, the limits, the fire
// records and Retry stay provider-neutral and see only a `FireResult`. An adapter never logs or returns the token.

/** Why a call failed, as one word the fire records keep and the page names. */
export type FireFailureReason =
  | "rate_limited"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rejected"
  | "server_error"
  | "unreachable"
  | "timeout";

export type FireResult =
  | { readonly ok: true; readonly status: number }
  | {
      readonly ok: false;
      /** Null when no answer arrived (unreachable, timeout). */
      readonly status: number | null;
      readonly reason: FireFailureReason;
      /** From a 429's `retry-after`, in seconds. */
      readonly retryAfterSeconds: number | null;
    };

/** A provider's settings: its declared fields, each a non-empty string once checked. */
export type ProviderSettings = Readonly<Record<string, string>>;

export interface ProviderFireRequest {
  readonly settings: ProviderSettings;
  /** The routine's opened token; never logged, never returned. */
  readonly token: string;
  readonly text: string;
}

export interface RoutineProvider {
  /** Stored in `routines.provider`; lower case words joined by hyphens. */
  readonly id: string;
  /** The setting fields the form shows, in order. */
  readonly fields: readonly string[];
  /** The settings to store from the form's raw values; null when they do not read. */
  parseSettings(input: Readonly<Record<string, string>>): ProviderSettings | null;
  /** The settings as stored, narrowed; null when they do not read (the routine cannot be called). */
  readSettings(stored: unknown): ProviderSettings | null;
  /** The routine's target in one short line for its row (never a secret). */
  describe(settings: ProviderSettings): string;
  fire(request: ProviderFireRequest): Promise<FireResult>;
}

/** The registered providers by id. */
export type RoutineProviders = ReadonlyMap<string, RoutineProvider>;

export function createRoutineProviders(providers: readonly RoutineProvider[]): RoutineProviders {
  return new Map(providers.map((provider) => [provider.id, provider]));
}
