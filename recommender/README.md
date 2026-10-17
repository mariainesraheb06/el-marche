# El Marché — Recommender Service

Content-based recommendation engine for El Marché. Returns personalized product recommendations for a given user, based on their interaction history (views and favorites).

The service is **optional** for the app to work: if it is unreachable or slow, the Next.js backend falls back to a SQL popularity query.

---

## Stack

- **Python 3.12**
- **FastAPI** — HTTP API
- **psycopg 3** — PostgreSQL driver
- **scikit-learn**, **pandas**, **numpy** — vector math and similarity
- **pydantic-settings** — typed configuration

---

## How it works

1. Load the user's recent interactions (`product_views` where `event_type` is `view` or `favorite`).
2. If the user has fewer than `MIN_EVENTS_FOR_CONTENT` interactions, return a **popularity fallback**: most-viewed approved products in the user's most-viewed categories (or global top if no history).
3. Otherwise, build a feature vector per product: one-hot `category_id`, one-hot price bucket, multi-hot `tags`.
4. Build the user vector as the average of the vectors of products they interacted with.
5. Compute **cosine similarity** between the user vector and every approved candidate product (excluding products the user already saw).
6. Return the top `limit` product IDs, ordered by similarity.
7. Cache the result in `recommendations_cache` (best-effort; failures never break the response).

Anonymous users, unknown users, or empty results → **fallback strategy** (`strategy: "fallback"`).

---

## API

### `GET /health`

Liveness probe.

```json
{ "status": "ok" }
```

### `GET /recommend/{user_id}?limit=10`

Returns up to `limit` recommended product IDs for the given user.

**Headers**
- `X-Internal-Key: <INTERNAL_API_KEY>` — required.

**Query**
- `limit` — integer, default `10`, between `1` and `50`.

**Response**

```json
{
  "productIds": ["uuid1", "uuid2", "..."],
  "strategy": "content"
}
```

- `strategy` is `"content"` when cosine similarity was used, or `"fallback"` when popularity was used.

**Errors**
- `401` — missing or invalid `X-Internal-Key`
- `422` — invalid `user_id` or invalid `limit`

---

## Environment variables

Create `recommender/.env` from `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host:port/database
INTERNAL_API_KEY=shared-secret-between-app-and-recommender
```

The same `INTERNAL_API_KEY` value must be set as `RECOMMENDER_API_KEY` in `elmarche/.env.local`, and the app must know the service URL via `RECOMMENDER_URL`.

Other optional variables:

| Variable | Default | Purpose |
|---|---|---|
| `DEFAULT_LIMIT` | `10` | Default recommendations returned |
| `MAX_LIMIT` | `50` | Maximum allowed `limit` |
| `MIN_EVENTS_FOR_CONTENT` | `3` | Below this number of interactions, use fallback |
| `PRICE_BUCKET_COUNT` | `5` | Number of price buckets |

---

## Run locally

```bash
cd recommender
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
# then edit .env with DATABASE_URL and INTERNAL_API_KEY

uvicorn app.main:app --reload --port 8000
```

Open:
- Health: http://127.0.0.1:8000/health
- Interactive docs: http://127.0.0.1:8000/docs

---

## Tests and lint

```bash
cd recommender
ruff check .
pytest
```

The test suite does **not** hit the database. It covers the feature matrix builder, cosine similarity, and the `401` behavior of the protected endpoint.

---

## How the Next.js app calls it

The Next.js route `GET /api/recommendations` calls:

```
GET {RECOMMENDER_URL}/recommend/{userId}?limit=10
Header: X-Internal-Key: {RECOMMENDER_API_KEY}
```

Behavior:
- **3-second timeout** via `AbortController`.
- On timeout, `5xx`, network error, or empty response → **SQL popularity fallback** in Next.js. The homepage never breaks if the service is down.

---

## Database requirements

The service only **reads** from `products` and `product_views`, and **writes** to `recommendations_cache`.

It runs with a **restricted Postgres role** that only has access to these tables — not the master database password.

---

## Folder structure

```
recommender/
├── app/
│   ├── __init__.py
│   ├── config.py         # Settings (env vars)
│   ├── db.py             # Postgres connection + queries
│   ├── main.py           # FastAPI app + routes
│   ├── recommender.py    # Algorithm
│   └── schemas.py        # Pydantic models
├── tests/
│   ├── test_health.py
│   └── test_recommender.py
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
└── .env.example
```