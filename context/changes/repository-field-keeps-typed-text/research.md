# Research: repository-field-keeps-typed-text

## How it works today
- `app/(app)/settings/page.tsx`: `<Suspense fallback={<AddRepositoryForm suggestions={{ kind: "loading" }} />}>`
  around the async server component `AddRepositoryField`, which awaits `loadRepositorySuggestions(repositories)` and
  renders a new `AddRepositoryForm` plus the "list read at … / Refresh list" form.
- `src/projects/add-repository-form.tsx` (client) owns `useActionState`; `RepositoryPicker` owns the typed value in
  `useState(defaultValue)`. Replacing the fallback unmounts both, so the value and any pending action state are lost.
- `src/projects/repository-list-cache.ts`: one cache per server process; `read()` waits for the forge only when no
  read has succeeded yet, otherwise it answers at once (stale lists refresh in the background).

## Options
1. Pass the unresolved promise from the server page to the client form (React 19 streams promises to client
   components) and let the form adopt the suggestions when it resolves, without suspending the field. Chosen.
2. Lift the value into the form and keep Suspense around the picker: the picker instance is still replaced, so focus
   and the open menu are lost mid-typing. Rejected.

## Testing
- No DOM test environment in vitest (no jsdom or testing library); the behaviour is proven in the e2e.
- Because the cache answers instantly after the first read, a slow listing only shows on a server's first Settings
  visit. A dedicated e2e server (like the Polish one) whose forge listing is slow, used by one spec only, makes that
  first visit deterministic: the fake forge serves the same fixtures under a `/slow-list` prefix and delays
  `/user/repos` there.

## Risks
- A rejected promise on the client: `loadRepositorySuggestions` does not throw (the cache turns failures into
  `null`), but the form treats a rejection as `unavailable` anyway.
- Revalidation after Add passes a new promise: the form keeps the previous suggestions until the new ones arrive.
