# El Marché

**Tout l'Algérie, en un seul endroit.**

El Marché is a mobile-first marketplace that gathers Algerian small sellers, who today live on Instagram, TikTok and Facebook, in one searchable place. Buyers search, filter, save favorites and contact sellers directly on WhatsApp. A Python recommender learns from each buyer's views and favorites, so two buyers see different products.

- **Live demo:** https://el-marche.vercel.app
- **Recommender health check:** https://el-marche.onrender.com/health
- **Demo video:** [paste the unlisted YouTube link]
- **Language:** French, built mobile-first

## What it does

**For buyers**

- Search by keyword and filter by category, price and wilaya
- Product pages with photos, price, location and a WhatsApp button to contact the seller
- A store page for every seller, linked from each product
- Favorites, saved per account
- "Recommandé pour vous": personalized suggestions based on views and favorites
- Sign up, log in, password reset, and a profile page with editable details and a profile picture

**For sellers**

- A dashboard to add, edit and delete products with photos, price, wilaya and tags
- A public shop page

**Data**

- 175 demo products across 10 categories, 8 shops and 2 demo buyers

## How the recommendations work

1. The site records each buyer's product views and favorites in Supabase.
2. For a logged-in buyer, the Next.js server asks the Python recommender service (`GET /recommend/{user_id}`), authenticated with a shared internal key.
3. The service builds a content-based profile from the buyer's history (category and price) using scikit-learn and pandas, and returns ranked product ids.
4. If the service is slow or unavailable, the site falls back to the buyer's most-viewed category, then to popular products for anonymous visitors. The fallback is logged so a silent failure is always visible.

The recommender connects to the database with a restricted `recommender` role.

## Tech stack

| Area             | Tools                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Frontend         | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Radix UI, lucide-react, Zod                       |
| Backend and data | Next.js API routes and server actions, Supabase (PostgreSQL, Auth, Storage, row-level security, SQL migrations) |
| AI               | Python, FastAPI, Uvicorn, scikit-learn, pandas, psycopg                                                         |
| Hosting          | Vercel (site, function region Dublin), Render (recommender)                                                     |
| Tools            | GitHub, Claude (AI coding assistant, debugging)                                                                 |

## Repository structure

```
elmarche/     Next.js app (pages, components, API routes, server code)
recommender/  FastAPI recommendation service and its tests
supabase/     SQL migrations (schema, security rules, roles, avatars)
scripts/      Seed and photo tooling
docs/         Documentation
```

## Run it locally

You need Node 22, Python 3.13 and a Supabase project.

### 1. Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor.

### 2. Website

```bash
cd elmarche
npm install
```

Create `elmarche/.env.local` with these variables (use your own values and never commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RECOMMENDER_URL=http://localhost:8000
RECOMMENDER_API_KEY=
SEED_DEMO_PASSWORD=
SEED_DEMO_WHATSAPP=
```

```bash
npm run dev
```

The site runs on http://localhost:3000.

### 3. Recommender

```bash
cd recommender
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set these environment variables (`INTERNAL_API_KEY` must equal `RECOMMENDER_API_KEY` above):

```
DATABASE_URL=
INTERNAL_API_KEY=
```

```bash
uvicorn app.main:app --port 8000
```

Check http://localhost:8000/health. The site works without the recommender, because it falls back to a SQL-based version.

### 4. Demo data (optional)

```bash
cd elmarche
npm run seed          # dry run, writes nothing
npm run seed:apply    # writes the demo data
```

### 5. Tests

```bash
cd recommender
pip install -r requirements-dev.txt
pytest
```

## Deployment

- **Site:** Vercel, root directory `elmarche`. `dev` builds previews, and `main` is the production branch.
- **Recommender:** Render web service, root directory `recommender`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Release flow:** work on a branch, open a pull request into `dev`, then merge `dev` into `main` to release.

## Security

- No secrets are committed. All keys live in environment variables on Vercel, Render and local `.env.local`.
- Supabase row-level security limits each user to their own favorites, events and profile, and each user can only upload to their own folder of the `avatars` bucket.
- The recommender connects with a restricted database role and requires an internal key on every request.

## Team

| Member              | Contribution                                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Maria Ines RAHEB    |  |Coordinated team activities and managed the technical deployment and integration of the platform using Vercel, Render, and Supabase. Set up the seed pipeline and demo data, developed the seller store page, password reset functionality, profile editing, and avatar upload features. Led UI/UX redesign improvements, debugged the recommendation system, implemented personalized fallback recommendations, and prepared the final project submission materials.
| Ilyes Khelaifia     |  Architecture Owner & AI/Data. Designed the database schema and restricted role. Built the Python recommendation engine (logic and Next.js API integration) and core API routes. Engineered complex frontend fixes (custom avatar cropper, product page layout, favorites sync). Managed Git/PRs, performed the full mobile QA sweep, set up the UptimeRobot monitor, and recorded the demo video.                                                                                                                                                     |
| Djihane Ben Djeddou | Mobile responsive fixes, testing at phone width [confirm]                                                                                                                                                                                                                     |
| Kassouar Fatima     | UI/UX design of the web pages                                                                                                                                                                                                                                                                     |

## Next steps

1. Move the recommender to an EU server, add automated tests and run a pilot with real sellers
2. Reviews and ratings, delivery information, a natural-language shopping assistant and image-based similar-product search
3. Seller analytics, price insights from comparable listings, and product import from social media

## Limitations

- The recommender runs on a free server that sleeps after inactivity, so the first request can be slow.
- Demo accounts and products are seeded data.
