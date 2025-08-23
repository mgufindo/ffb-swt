# Architecture

This document describes the system structure, data flow, and design trade-offs for the FFB Fleet Management app.

## Goals

- Clean separation between UI and data access to keep components testable.
- Single place to adapt data sources (local DB now, possible remote API later).
- Predictable data shapes for UI, e.g. `{ data, total }` for list APIs.
- Simple but robust testing story (mockable, independent of DB).

## Layers

1. Presentation (React components)

- Atoms: small stateless UI pieces (e.g., Badge)
- Molecules: composite components (e.g., DataTable, TripForm)
- Pages: route-level containers (e.g., Login)

2. Hooks

- `useAuth`: provides user session state and auth actions to components.
- Additional hooks can encapsulate cross-cutting concerns (permissions, feature flags).

3. API Adapters (`src/services/api/*`)

- Thin wrappers that expose domain-oriented functions, returning UI-friendly shapes.
- Examples: `fetchVehicles`, `fetchMills`, `getAllClient`, `login`.
- Internally call the CRUD layer, map/shape records, handle pagination counts.

4. Data Access (CRUD) (`src/services/database/*`)

- `config.ts`: DB initialization, connection getter.
- `crud/*`: per-entity modules (vehicles, mills, auth/clients).
- Implementation is local and synchronous/asynchronous depending on backing store.
- Unit tests mock these modules to avoid touching real DB.

## Data flow example (TripForm)

- TripForm mounts:

  - calls `fetchVehicles()`, `fetchMills()`, and `getAllClient()` (API layer)
  - API layer queries CRUD modules, returns lists `{ data, total }`
  - TripForm renders:
    - vehicle select options (vehicle id as value, formatted label)
    - mill checkbox grid
    - client select options

- On user input:

  - updates local state (vehicleId, clientId, selectedMills, date, duration, status)

- On submit:
  - triggers `onSubmit` callback passed by parent with aggregated payload
  - (If a `createTrip` API exists in the future, call it here instead of passing up)

## Key decisions and trade-offs

- Local DB + API wrapper vs calling external HTTP APIs:

  - Pros: dev velocity, offline/local-first, fast tests
  - Cons: need to design a migration path if/when moving to server APIs
  - Mitigation: UI code depends only on `services/api/*`, so we can swap the implementation later.

- API returns `{ data, total }` for lists:

  - Pros: consistent rendering, supports pagination in UI
  - Cons: slightly more boilerplate for simple lists
  - Mitigation: helpers can encapsulate common response types

- Testing with full mocks:

  - Pros: deterministic tests, no brittle DB state
  - Cons: may diverge from real integration behavior if mocks drift
  - Mitigation: a small set of integration/e2e tests can be added later.

- DataTable simplicity vs virtualization:
  - We test 10k rows to guard performance, but there is no virtualization yet.
  - Pros: simpler component, fewer moving parts
  - Cons: extremely large datasets would benefit from virtualization
  - Mitigation: introduce react-virtualized/react-window if real-world datasets exceed current budget.

## Directory layout

```
src/
  components/
    atoms/        # presentational widgets
    molecules/    # composable units (DataTable, TripForm)
    pages/        # route-level containers (Login)
  hooks/          # app-level hooks (useAuth)
  services/
    api/          # API adapters (UI-facing)
    database/     # DB config + CRUD (internal)
  types/          # shared TypeScript types
```

## Error handling

- API layer should catch and rethrow domain-specific errors where appropriate (e.g., `Failed to fetch mills`).
- UI components can show error messages or fallbacks and keep the rest of the form interactive (e.g., TripForm still usable if mills fail to load).

## Security

- `useAuth` manages in-memory session state for UI purposes. If persistent auth is introduced, avoid storing raw tokens in insecure places.
- Never commit secrets. Use `.env` with Vite’s `VITE_` prefix for client-configurable values.

## Extensibility

- Add `services/api/trips.ts` with `createTrip`, `getTrips`, etc., and a corresponding `crud/trips.ts` module.
- Introduce pagination/sorting/filtering to DataTable by expanding API response contracts and UI controls.
- Consider adding a global query/cache layer (e.g., TanStack Query) if live remote APIs are added.
