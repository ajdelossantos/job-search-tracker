# Job Search Tracker Frontend

A Next.js 15 application that surfaces your job search data from the FastAPI backend. The app is built with the App Router, TypeScript, Tailwind CSS 4, and a generated OpenAPI client so the UI stays fully typed from network to component.

## Architecture overview

| Area | What lives here |
| --- | --- |
| **App shell** | [`src/app/layout.tsx`](src/app/layout.tsx) wires the Roboto font, shared header/footer, and wraps all routes with `Providers`, which mounts the React Query client, toast system, and timezone context. [`src/app/page.tsx`](src/app/page.tsx) redirects straight to the applications index. |
| **Route groups** | Feature routes are organised under `src/app/(app)` (`applications`, `contacts`, `interviews`). Each page is a Server Component that prefetches its primary query with `HydrationBoundary`/`dehydrate` before handing off to a Client Component table or list. |
| **Generated API client** | [`src/client/`](src/client) is produced by `@hey-api/openapi-ts` and exposes both fetch helpers and TanStack Query factories tailored to the FastAPI schema. |
| **Domain hooks** | Thin wrappers in [`src/lib/api`](src/lib/api) compose the generated operations into ergonomic hooks (`useCreateApplication`, `useUpdateContact`, `useDeleteInterview`, etc.) and centralise cache invalidation rules. |
| **Stateful UI** | Most interactive components live in [`src/components`](src/components). They share primitives such as the shadcn-inspired controls in `components/ui`, form elements in `components/forms`, and table helpers in `components/table`. |
| **Utilities & validation** | [`src/lib/utils`](src/lib/utils) hosts date/number formatting, Tailwind helpers, phone parsing, and the `getQueryClient` factory used by both the server and client runtimes. [`src/lib/forms/validators.ts`](src/lib/forms/validators.ts) provides lightweight TanStack Form validators. |
| **Testing utilities** | [`src/test`](src/test) contains the Vitest + Testing Library setup that powers the unit tests under `src/**/*.test.{ts,tsx}`. |

### Data fetching flow

1. Server components load a per-request React Query client with [`getQueryClient`](src/lib/utils/get-query-client.ts) and prefetch the initial dataset (e.g. [`applications/page.tsx`](src/app/%28app%29/applications/page.tsx)).
2. The prefetched cache is dehydrated into the HTML payload (`<HydrationBoundary>`), eliminating duplicate network calls once the client hydrates.
3. Client components (tables, cards, forms) re-use the same query keys when they call `useQuery`/`useMutation`, so cache updates and invalidation from the `lib/api` hooks keep views in sync.
4. Toasts (`components/toast/Toaster`) and confirmation dialogs (`components/confirm/useConfirm`) provide user feedback around mutations.

## Feature highlights

- **Applications dashboard** – Paginated table with create dialog, status badges, and server-prefetched data so the first render is instant. Detail pages render an `ApplicationHero` with edit/delete actions, salary & follow-up metadata, and tabs that join related contacts, interviews, and pipeline history in one place. [`ApplicationsTable`](src/components/applications/ApplicationsTable.tsx) · [`ApplicationHero`](src/components/applications/ApplicationHero/ApplicationHero.tsx)
- **Contacts workspace** – Responsive card grid with inline TanStack Form editing, total counters, and hooks that update the cache after mutations. [`ContactsIndex`](src/components/contacts/ContactsIndex.tsx) · [`ContactForm`](src/components/contacts/ContactForm.tsx)
- **Interview tracker** – Interview cards show type badges, formatted times, and provide inline edit/delete with confirmation flows. The index cross-links back to the owning application. [`InterviewsIndex`](src/components/interviews/InterviewsIndex.tsx) · [`InterviewCard`](src/components/interviews/InterviewCard.tsx)
- **Pipeline history** – Timeline-style list with inline date/note editing backed by TanStack Form validators and toast feedback. [`PipelineHistoriesShow`](src/components/pipeline-histories/PipelineHistoriesShow.tsx) · [`PipelineHistoryRow`](src/components/pipeline-histories/PipelineHistoryRow.tsx)
- **Global UX niceties** – Sticky header with timezone picker, shared footer, Sonner toaster, shadcn UI primitives, and a timezone context that persists the user’s preferred display zone. [`Header`](src/components/layout/Header.tsx) · [`TimezoneProvider`](src/components/timezone/TimezoneProvider.tsx)

## Styling system

- Tailwind CSS 4 powers utility classes, with global design tokens defined in [`globals.css`](src/app/globals.css).
- `components/ui` contains shadcn-inspired primitives (buttons, tables, dialogs, etc.) with `class-variance-authority` and `tailwind-merge` handling variants.
- `components/forms` supplies re-usable label, error, and enum select patterns used across forms.

## Getting started

### Prerequisites

- Node.js 20+
- npm (ships with Node). The project also works with pnpm/bun/yarn if you prefer.

### Installation

```bash
cd frontend
npm install
```

### Environment configuration

Create a `.env.local` in `frontend/` and point the client at the running FastAPI instance:

```ini
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

The value is consumed by the generated client via [`src/lib/utils/hey-api.ts`](src/lib/utils/hey-api.ts).

### Running the app

```bash
npm run dev         # start Next.js with Turbopack on http://localhost:3000
npm run build       # build production output
npm run start       # serve the production build
```

## Code generation & API types

- The OpenAPI spec drives both runtime clients and TypeScript types. Regenerate them after backend changes with:

  ```bash
  npm run openapi-ts
  ```

  The command hits `http://127.0.0.1:8000/openapi.json` (configurable in [`openapi-ts.config.ts`](openapi-ts.config.ts)) and writes to [`src/client`](src/client).
- Query helpers emitted under `src/client/@tanstack/react-query.gen.ts` are consumed directly in the feature hooks so that query keys stay consistent.

## Testing & quality

- Unit tests use Vitest + Testing Library. Run the suite with:

  ```bash
  npm run test
  ```

- Linting (`npm run lint`) and formatting (`npm run format`) ensure consistent code style.

## Conventions & tips

- Import aliases are configured in [`tsconfig.json`](tsconfig.json) (`@/` → `src/`).
- Use `@tanstack/react-form` for new forms to stay consistent with existing patterns (`ContactForm`, `PipelineHistoryRow`).
- When adding a new data surface, follow the existing query pattern: server-prefetch inside the route, wrap the client component with `<HydrationBoundary>`, and manage mutations inside `src/lib/api` so cache updates stay centralised.
