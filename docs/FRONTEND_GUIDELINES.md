# Admin Panel — Frontend Guidelines

Conventions for `admin-panel`. **New code must follow these rules; touch legacy code only when
you are already editing that file.** Verified with `npm run build` + `npm run lint`.

---

## 1. Folder & Layering Rules

```
src/
├── app/                  # Bootstrap: App, Providers, Router (route table is the ONLY place that knows all pages)
├── components/
│   ├── guards/           # ProtectedRoute, RoleRoute (auth/role outlet guards)
│   ├── layout/           # DashboardLayout, Sidebar, Header
│   └── ui/               # App-wide reusable primitives (Modal, StatCard, PageHeader, ...)
├── config/
│   ├── env.ts             # Zod-validated env — the only file that reads import.meta.env
│   └── navigation.ts      # Route & nav registry — single source of truth (see §9b)
├── features/<domain>/    # Feature slices; NEVER import across features except via components/ui or lib/
│   ├── api/              # React Query hooks + types for this domain (useXxx hooks live HERE)
│   ├── components/       # Feature-local components (modals, cards, dropdowns)
│   ├── pages/            # Route pages — orchestrators, ideally < ~300 lines
│   └── schemas/          # Zod schemas for forms in this feature
├── hooks/                # Generic reusable hooks (useDebouncedValue, useMediaQuery)
├── lib/                  # api/client + api/endpoints, permissions, queryKeys
├── stores/               # Zustand stores (auth.store)
├── styles/globals.css    # Design tokens (@theme) + global CSS
└── types/                # Shared types: api.ts (transport), auth.ts (identity)
```

**Import direction:** `pages → components → hooks/lib/types`. Feature-to-feature imports are a
code smell — move the shared thing to `components/ui`, `lib/`, or `types/`.

## 2. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Components / types | `PascalCase` | `UserDetailModal`, `PaginatedResponse` |
| Hooks / functions / variables | `camelCase`, boolean = `is/has/can` prefix | `useDebouncedValue`, `isSidebarOpen`, `canMutatePlans` |
| Constants | `SCREAMING_SNAKE_CASE` | `SEARCH_DEBOUNCE_MS`, `ROLE_PERMISSIONS` |
| Files | Component files = component name; hooks = `useXxx.ts` | `PageHeader.tsx`, `useMediaQuery.ts` |
| Query hooks | `use<Entity>` / `use<EntityAction>` | `useUsers`, `useSoftDeleteUser` |
| Query keys | **Only** via `lib/queryKeys.ts` factories | `queryKeys.users.list(params)` |
| Event handlers | `handleXxx` prop / `onXxx` callback | `handleSubmit`, `onClose` |

## 3. Design Tokens (globals.css `@theme`)

Brand palette lives once in `styles/globals.css`. **Never hard-code brand hex values** —
use semantic utilities: `text-primary`, `bg-primary-100`, `border-primary-200`,
`ring-primary/30`, `bg-primary-soft`, `bg-surface`, `bg-background`.
Scale: `50 #fff8f5 · 100 #fff0eb · 200 #ffe0d1 · 300 #ffb48b · 400 #f89c6d · **500 #ff8a5c (brand)** ·
600 #f77947 · 700 #d95d2c · 800 #d65e2b` (+ `tint`, `tint-border`, `250`).
Status colors (emerald/amber/rose/blue/purple) use the Tailwind palette directly.

## 4. Data Fetching

- Server state = React Query (hooks colocated in `features/<domain>/api/`).
- **Query keys must come from `lib/queryKeys.ts`** — add a factory block per domain; keys are
  hierarchical so `invalidateQueries({ queryKey: queryKeys.users.all })` clears the domain.
- Mutations: invalidate via factories, toast success/error there — pages stay dumb.
- Transport types come from `types/api.ts` (`PaginatedResponse<T>`, `ApiEnvelope<T>`,
  `ApiSuccessEnvelope<T>`); identity types from `types/auth.ts` (`UserRole`, `UserStatus`).
  No `any` in new code (`api.get<any, any>` is legacy — type it when you touch it).
- **Endpoint URLs come from `lib/api/endpoints.ts`** — never inline `/v1/...` strings in calls.
- Errors thrown by the client are `ApiError` (`status`, `code`, user-safe `message`) —
  catch as `ApiError`/`Error`, never `any`.
- SUPER_ADMIN-only endpoints: pass an `enabled` flag so other roles never fire guaranteed 403s
  (pattern: `useReleaseStats(isSuperAdmin)`).

## 5. Shared Hooks (`src/hooks/`)

- `useDebouncedValue(value, delay)` — search inputs (`SEARCH_DEBOUNCE_MS`) & slug checks
  (`SLUG_CHECK_DEBOUNCE_MS`). Pair with a `useEffect(() => setPage(1), [debouncedX])`.
- `useMediaQuery(query)` + `MEDIA_QUERY.SM/MD/LG` — replaces `window.innerWidth` resize listeners.

## 6. Modals & Confirmation

Always build dialogs on `components/ui/Modal` (portal, Escape, scroll lock, a11y, focus) or
`ConfirmDialog` (danger/primary variants, plus `confirmPhrase` for typed confirmation of
destructive actions). Do **not** hand-roll
`fixed inset-0 z-50 bg-black/40 ...` shells — legacy modals migrate to `<Modal>` as they are touched.
Reference implementations: `features/audit/components/AuditCleanupModal.tsx` and
`features/sync/components/SyncCleanupModal.tsx` (Modal + `footer` + form id — zero manual
Escape/overlay/scroll-lock code).

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Edit User" icon={<UserIcon size={20} />}
  accentClassName="bg-blue-50 text-blue-600 border-blue-100" footer={<>…actions…</>}>
  …body…
</Modal>
```

## 7. Forms

Target pattern: **react-hook-form + zodResolver** with a schema in `features/<domain>/schemas/`
(see `LoginPage` + `login.schema.ts`). Manual `useState` forms are legacy; convert when touching.

## 8. Exports & Style

- Components: **named export** (`export const PageHeader`) + `export default` for file-name parity.
- Pages: default export (router imports). API modules: named exports only.
- Formatting: Prettier (`.prettierrc.json`) via `npm run format`; ESLint via `npm run lint:fix`.

## 9. Security & UX Invariants

- **RBAC is fail-closed**: missing/unknown role ⇒ no permission (`lib/permissions`, `RoleRoute`).
- Gate mutations with `usePermissions()` / `<ProtectedAction>` — never disable silently.
- Role gates read `usePermissions()` capability flags — never inline `user.role === 'X'`.
- Errors surface via standardized messages from `lib/api/client.ts` (`ApiError`); 401 clears the auth store.

## 9b. Navigation & Access Registry (`config/navigation.ts`)

Single source of truth per route: `roles` (who may open it — mirrors API `requireRole`), sidebar
`section`/`labels`, mobile `dock`. Consumers derive, never re-declare: `app/router.tsx`
(`guardedRoute`), `Sidebar` (`getNavSectionsForRole`), `DashboardLayout` (`getMobileDockForRole`),
`canAccessRoute()`. **Adding a page = one registry entry.** Guarded by
`tests/navigation.spec.ts` (per-role snapshots + fail-closed assertions).

## 10. Roadmap (deliberate, incremental)

1. Decompress mega-pages (Activations ~1.6k lines) into `<Feature>Stats / Table / Card / Filters`
   co-located components + a `useListFilters` hook.
2. Convert remaining feature modals to `<Modal>`/`ConfirmDialog` and forms to RHF+Zod as each
   file is touched.
3. Type the legacy `api.get<any, any>` calls (institutions, activations, licenses, plans,
   subscriptions, content, modules, auth-tracking — sync/audit/releases/users are done).
4. Route-level `React.lazy` code splitting + global `ErrorBoundary` + 403/404 pages.
5. More Vitest unit tests (hooks, `ApiError` mapping) and a Playwright smoke pass.