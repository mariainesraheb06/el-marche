# AGENTS.md — rules for every contributor, human or AI agent

El Marché is an AI-powered marketplace for Algerian businesses (MVP: discovery, not transactions).
Read this file before changing anything.

## Stack (do not deviate)

- Web app in `elmarche/`: Next.js 14 (App Router), React 18, TypeScript strict, Tailwind CSS v3, shadcn/ui.
- Backend: Next.js route handlers + server actions. Database, auth and storage: Supabase.
- Recommendation service in `recommender/`: Python, FastAPI, scikit-learn, pandas.
- Node 22 (see `.nvmrc`). Python 3.12.
- NEVER upgrade Next.js, React, Tailwind or ESLint major versions. NEVER run `npm audit fix --force` or `npm update`.
- Add shadcn components with `npx shadcn@2.3.0 add <name>`. No new dependency without approval from the Architecture Owner.

## Scope

Anything not on the "Features IN" list of the technical specification is OUT.
Out: payments/cart/checkout, Google OAuth, in-app chat, visual search, seller price insights, reviews/ratings, order tracking, native app, languages other than French.

## Language

- The user interface is in French only. All UI strings live in `elmarche/src/lib/constants/fr.ts` or in the component that uses them.
- Code, comments, documentation and commit messages are in English.
- Commits follow Conventional Commits: `feat(search): …`, `fix(auth): …`, `chore: …`.

## Architecture

- Layers: page / route handler / server action → `src/server/services` → `src/server/repositories` (Supabase queries). Never query Supabase directly from React components.
- Validate every input with zod (`src/lib/validators`), on the server, even if the form also validates.
- Supabase clients: `lib/supabase/server.ts` in server code, `lib/supabase/client.ts` in the browser. The secret key (`SUPABASE_SERVICE_ROLE_KEY`) is used only in server code that needs to bypass RLS, never in client code, never in a `NEXT_PUBLIC_` variable.
- The API contract in `docs/api-contract.md` is the source of truth. Do not change a route's shape without updating it and telling the Architecture Owner.

## Database

- Schema changes only through new files in `supabase/migrations/` (`npx supabase@latest migration new <name>`). Never edit an applied migration. Never change the schema in the dashboard.
- Every table has Row Level Security. Never disable it.
- After a schema change, regenerate types: `npx supabase@latest gen types typescript --linked > elmarche/src/types/database.ts`. Never edit that file by hand.

## UI

- Mobile-first: write base classes for phones, then `sm:`, `md:`, `lg:`. Check every screen at phone width.
- Use the design tokens (`bg-background`, `text-primary`, `bg-accent`, …), never raw hex colours. Brand: green #1A4D2E, sand #F9F6F0, terracotta #D96B43, charcoal #2C2C2C.
- Generous whitespace, rounded cards, outlined lucide icons. Tone: warm, trustworthy, local.

## Security

- Never read, print, edit or commit `.env*` files. Never put a secret in code, logs, tests or documentation.
- Never disable a security rule or a lint rule to make something pass.

## Workflow

- Work on a branch (`feat/…`, `fix/…`), open a pull request into `dev`. Never push directly to `dev` or `main`.
- Before saying a task is finished, run from `elmarche/`: `npm run lint && npm run typecheck && npm test && npm run build`. For the recommender: `ruff check . && python -m pytest`.
- Keep changes small and focused: one feature per pull request.
- A human must read every line of AI-generated code before it is merged.
