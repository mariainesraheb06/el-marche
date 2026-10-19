# El Marché

AI-powered marketplace for Algerian businesses. Buyers search, filter and contact sellers on WhatsApp. Sellers publish products. Recommendations are personalised.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS 3 + shadcn/ui · Supabase (Postgres, Auth, Storage) · FastAPI recommender (Python)

## Quick start (web app)

1. Install Node 22: `nvm install 22 && nvm use 22`
2. `git clone https://github.com/mariainesraheb06/el-marche.git`, then `cd el-marche && git checkout dev`
3. `cd elmarche && npm ci`
4. `cp .env.example .env.local`, then fill in the values you were given
5. `npm run dev` and open http://localhost:3000

Before every pull request:
`npm run lint && npm run typecheck && npm test && npm run build`

## Rules

- Read `AGENTS.md` first. It is the rulebook for humans and AI agents.
- Branch from `dev` (`feat/...` or `fix/...`), open a pull request into `dev`. Never push directly to `dev` or `main`.
- CI must be green and one teammate must review before merging.
- Never commit secrets or `.env*` files.
- Commits in English, Conventional Commits (`feat(search): ...`). UI text in French, code in English.
- Do not upgrade Next.js, React, Tailwind or ESLint. Never run `npm audit fix --force`.

## Map

- `elmarche/`: web app. `recommender/`: FastAPI service (see its README).
- `supabase/migrations/`: database. `docs/api-contract.md`: API contract. `docs/design/`: mockups.
