// The CLI's result type: `@softure-ai/core`'s Result takes coded errors only, the CLI's failures carry data.
export type Outcome<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function succeed<T>(value: T): Outcome<T, never> {
  return { ok: true, value };
}

export function fail<E>(error: E): Outcome<never, E> {
  return { ok: false, error };
}
