# El Marché — API contract (v1)

Source of truth for every route. Change it in the same pull request as the code, and tell the Architecture Owner.

## Conventions

- JSON in, JSON out. Field names are camelCase. Prices are integers in DZD. Dates are ISO 8601 UTC strings. IDs are UUIDs (categories use numeric IDs).
- Auth: the Supabase session cookie. "Auth" below means a logged-in user is required.
- Pagination: `page` (default 1) and `pageSize` (default 20, max 50). Lists return `{ items, page, pageSize, total }`.
- Errors: `{ "error": { "code": string, "message": string } }` with these codes: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `internal_error` (500).
- All input is validated with zod on the server. User-visible messages are in French.

## Shared shapes

- **Category**: `{ id, slug, name }`
- **ProductSummary**: `{ id, title, priceDzd, wilayaCode, categorySlug, imageUrl, shopName, createdAt }`
- **Product**: `{ id, title, description, priceDzd, wilayaCode, category: Category, tags: string[], images: { id, url, position }[], seller: { id, fullName, shopName, whatsappNumber }, viewCount, createdAt }`
- **SellerProduct**: ProductSummary plus `status` (`pending` | `approved` | `rejected`)
- **Profile**: `{ id, fullName, role, shopName, wilayaCode, whatsappNumber }`

## Public routes

| Route                      | Description                                                                                                                                                                                                                                                              | Response                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `GET /api/categories`      | The 10 categories, ordered                                                                                                                                                                                                                                               | `{ items: Category[] }`                                          |
| `GET /api/products`        | Search and browse. Query: `q`, `category` (slug), `minPrice`, `maxPrice`, `wilaya` (code), `sort` (`newest` default, `price_asc`, `price_desc`, `popular`), `page`, `pageSize`. Only `approved` products. If the user is logged in and `q` is set, the search is logged. | paginated `ProductSummary[]`                                     |
| `GET /api/products/{id}`   | Product detail (approved only)                                                                                                                                                                                                                                           | `Product`                                                        |
| `GET /api/recommendations` | "Recommended for you": always up to 10 products. Anonymous users get the popularity fallback.                                                                                                                                                                            | `{ items: ProductSummary[], strategy: "content" \| "fallback" }` |

## Auth routes (logged-in user)

| Route                               | Description                                                                 | Response                      |
| ----------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| `POST /api/events`                  | Log a product view. Body: `{ productId, eventType: "view" }`                | 204                           |
| `GET /api/favorites`                | My wishlist                                                                 | `{ items: ProductSummary[] }` |
| `PUT /api/favorites/{productId}`    | Add to wishlist (idempotent). Also logs a `favorite` event.                 | 204                           |
| `DELETE /api/favorites/{productId}` | Remove from wishlist                                                        | 204                           |
| `GET /api/profile`                  | My profile                                                                  | `Profile`                     |
| `PATCH /api/profile`                | Body: `{ fullName?, whatsappNumber? }`. The role can never be changed here. | `Profile`                     |

## Seller routes (role `seller` or `admin`)

Images are uploaded straight from the browser to the Supabase Storage bucket `product-images`, at the path `{userId}/{uuid}.{jpg|png|webp}`. The product routes then receive the stored paths.

| Route                              | Description                                                                        | Response                     |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------- |
| `GET /api/seller/products`         | My listings, all statuses                                                          | `{ items: SellerProduct[] }` |
| `POST /api/seller/products`        | Body: `{ title, description, priceDzd, categoryId, wilayaCode, tags, imagePaths }` | 201 `{ id }`                |
| `PATCH /api/seller/products/{id}`  | Same fields, all optional. Only my own products.                                   | `{ id }`                    |
| `DELETE /api/seller/products/{id}` | Deletes the product and its stored images. Only my own.                            | 204                          |

Validation: title 3–120 characters, description 10–4000, `priceDzd` an integer > 0, `wilayaCode` a valid code, `tags` at most 10 strings of up to 30 characters, `imagePaths` 3 to 5 items belonging to my folder. A seller must have a `whatsappNumber` in their profile (8–15 digits, optional leading `+`, international format such as `+213…`) before publishing.

## Admin routes (P1, role `admin`)

| Route                                                                                                 | Description                                  | Response                    |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------- |
| `GET /api/admin/products?status=pending`                                                              | Listings by status                           | paginated `SellerProduct[]` |
| `PATCH /api/admin/products/{id}/status`                                                               | Body: `{ status: "approved" \| "rejected" }` | `SellerProduct`             |
| `POST /api/admin/categories`, `PATCH /api/admin/categories/{id}`, `DELETE /api/admin/categories/{id}` | Manage categories                            | `Category` / 204            |

## P2 (later)

- `GET /api/products/{id}/similar` returns up to 8 `ProductSummary` ("You may also like").
- `GET /api/seller/products/{id}/stats` returns view counts per day.

## Internal: Next.js to the recommender (never called from the browser)

- `GET {RECOMMENDER_URL}/recommend/{userId}?limit=10` with header `X-Internal-Key`. Response: `{ productIds: string[], strategy: "content" | "fallback" }`.
- `GET {RECOMMENDER_URL}/health` returns `{ status: "ok" }`.
- If the recommender is unreachable or slow (more than 3 seconds), `/api/recommendations` falls back to a SQL query on popularity in the user's most-viewed categories.
