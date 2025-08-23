# Data Layer Documentation

This document describes the UI-facing API adapters in `src/services/api/*` and the underlying CRUD modules in `src/services/database/*`.

The API adapters return UI-friendly payloads and encapsulate DB specifics. All list calls use the shape:

```ts
type Paginated<T> = {
  data: T[];
  total: number;
};
```

## Types

```ts
export type Driver = {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  userId: string;
};

export type Vehicle = {
  id: string;
  plateNumber: string;
  type: "TRUCK" | "PICKUP" | "OTHER";
  capacity: number; // in tons
  users: string;
  userId: string;
  driver: Driver;
  status: "AVAILABLE" | "IN_SERVICE" | "INACTIVE";
};

export type Mill = {
  id: string;
  name: string;
  location?: string;
  userId: string;
};

export type Client = {
  id: string;
  name: string;
};

export type Trip = {
  id: string;
  vehicleId: string;
  clientId: string;
  millIds: string[];
  scheduledAt: string; // ISO datetime
  estimatedDuration: number; // minutes
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string;
};
```

## API Adapters

All functions below live in `src/services/api/*`. They are designed to be easy to mock in tests.

### Vehicles (`services/api/vehicles.ts`)

```ts
export type FetchVehiclesParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "plateNumber" | "type" | "capacity" | "status";
  sortDir?: "asc" | "desc";
};

export async function fetchVehicles(
  params?: FetchVehiclesParams
): Promise<Paginated<Vehicle>>;
```

- Returns a list of vehicles with the `driver` included where available.
- `total` returns the total count for pagination.
- Errors: throws `Error("Failed to fetch vehicles")` on failure (recommended).

Example:

```ts
const { data, total } = await fetchVehicles({ page: 1, pageSize: 20 });
```

### Mills (`services/api/mills.ts`)

```ts
export type FetchMillsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export async function fetchMills(
  params?: FetchMillsParams
): Promise<Paginated<Mill>>;
```

- Returns list of mills with `total` count.
- Errors: throws on DB not initialized or query failure.

Example:

```ts
const { data } = await fetchMills();
```

### Auth + Clients (`services/api/auth.ts`)

```ts
export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  token: string;
  user?: { id: string; name: string; email: string; role: string };
};

export async function login(payload: LoginPayload): Promise<LoginResponse>;

export type FetchClientsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export async function getAllClient(
  params?: FetchClientsParams
): Promise<Paginated<Client>>;
```

- `login` returns a token (mocked in tests). In this app, token may be stored in memory via `useAuth`.
- `getAllClient` returns clients list.

Example:

```ts
const { token } = await login({ email, password });
const { data: clients } = await getAllClient();
```

### (Optional) Trips (`services/api/trips.ts`)

If/when you persist trips:

```ts
export async function createTrip(input: Omit<Trip, "id">): Promise<Trip>;
export async function getTrips(params?: {
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Trip>>;
export async function getTripById(id: string): Promise<Trip | null>;
export async function updateTrip(
  id: string,
  patch: Partial<Trip>
): Promise<Trip>;
export async function deleteTrip(id: string): Promise<void>;
```

## CRUD Modules

CRUD modules live under `src/services/database/crud/*` and are internal to the API adapters. Typical functions:

### Vehicles (`crud/vehicles.ts`)

```ts
export function getVehicles(params?: FetchVehiclesParams): Vehicle[]; // or Promise<Vehicle[]>
export function getVehiclesCount(params?: FetchVehiclesParams): number;
export function getVehicleById(id: string): Vehicle | null;
export function createVehicle(input: Omit<Vehicle, "id">): Vehicle;
export function updateVehicle(id: string, patch: Partial<Vehicle>): Vehicle;
export function deleteVehicle(id: string): void;
```

### Mills (`crud/mills.ts`)

```ts
export function getMills(params?: FetchMillsParams): Mill[];
export function getMillsCount(params?: FetchMillsParams): number;
```

### Auth/Clients (`crud/auth.ts`)

```ts
export function getAllClients(params?: FetchClientsParams): Client[];
// plus any user CRUD if needed
```

## Error model

- CRUD should throw explicit errors if the database is not initialized (e.g., `"Database not initialized. Call initializeDatabase first."`).
- API adapters should catch and wrap these with user-friendly messages where needed, or allow components to handle fallback UI.

## Conventions

- List endpoints return `{ data, total }`.
- Entity IDs are strings in UI layer.
- Keep API adapters pure and deterministic for testing.
- Prefer passing `userId` context from `useAuth` to scope data if applicable.

## Mocking (tests)

- Mock API adapters in component tests (preferred).
- Alternatively, globally mock CRUD modules in `vitest.setup.ts` to guarantee no DB calls.
- Ensure mock module path exactly matches the import used in components.
