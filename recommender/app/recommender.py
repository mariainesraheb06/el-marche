"""
Content-based recommender using cosine similarity.

Inputs (from DB):
  - user's views + favorites (product_views)
  - user's searches (searches)
  - candidate products (approved, excluding already-seen)

Algorithm:
  1. Build a feature vector per product:
       - one-hot category
       - price bucket (1..5)
       - tag vector (multi-hot)
  2. Build the user vector = average of the vectors of products they interacted with.
  3. Compute cosine similarity between user vector and every candidate.
  4. Return top N product IDs.

Fallback:
  If the user has fewer than N interactions, return the most-viewed products
  in their most-viewed categories. If they have no categories, return globally
  most-viewed products.
"""
from __future__ import annotations

import numpy as np

from app.config import settings
from app.db import (
    fetch_candidate_products,
    fetch_popular_by_categories,
    fetch_products_by_ids,
    fetch_user_events,
    get_category_of_products,
)


# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------

def _price_bucket(price: int, all_prices: list[int]) -> int:
    """Return a bucket index (0..n-1) for a price based on quantiles."""
    if not all_prices:
        return 0
    quantiles = np.quantile(all_prices, np.linspace(0, 1, settings.price_bucket_count + 1))
    for i in range(settings.price_bucket_count):
        if price <= quantiles[i + 1]:
            return i
    return settings.price_bucket_count - 1


def _build_feature_matrix(products: list[dict]) -> np.ndarray:
    """
    Build a (num_products, num_features) matrix.
    Features: one-hot category + one-hot price bucket + multi-hot tags.
    """
    if not products:
        return np.zeros((0, 0))

    # Collect all categories and tags
    categories = sorted({p["category_id"] for p in products})
    category_index = {c: i for i, c in enumerate(categories)}

    all_tags: set[str] = set()
    for p in products:
        all_tags.update(p.get("tags") or [])
    tags = sorted(all_tags)
    tag_index = {t: i for i, t in enumerate(tags)}

    all_prices = [p["price_dzd"] for p in products]

    num_features = len(categories) + settings.price_bucket_count + len(tags)
    matrix = np.zeros((len(products), num_features))

    for row, p in enumerate(products):
        # category one-hot
        matrix[row, category_index[p["category_id"]]] = 1.0
        # price bucket one-hot
        pb = _price_bucket(p["price_dzd"], all_prices)
        matrix[row, len(categories) + pb] = 1.0
        # tags multi-hot
        for tag in (p.get("tags") or []):
            matrix[row, len(categories) + settings.price_bucket_count + tag_index[tag]] = 1.0

    return matrix


def _cosine_similarity(vector: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Cosine similarity between a single vector and every row of the matrix."""
    if matrix.shape[0] == 0:
        return np.array([])
    v_norm = np.linalg.norm(vector)
    if v_norm == 0:
        return np.zeros(matrix.shape[0])
    m_norms = np.linalg.norm(matrix, axis=1)
    m_norms[m_norms == 0] = 1.0
    return (matrix @ vector) / (m_norms * v_norm)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def recommend(user_id: str, limit: int) -> tuple[list[str], str]:
    """
    Return (productIds, strategy).
    strategy = "content" if we used cosine similarity, "fallback" otherwise.
    """
    # 1. Fetch user history
    events = fetch_user_events(user_id)
    interacted_ids = list({e["product_id"] for e in events})

    # 2. If too few interactions, use fallback
    if len(interacted_ids) < settings.min_events_for_content:
        return _fallback(user_id, limit, interacted_ids)

    # 3. Fetch the products the user interacted with
    interacted_products = fetch_products_by_ids(interacted_ids)
    if not interacted_products:
        return _fallback(user_id, limit, interacted_ids)

    # 4. Fetch candidates (approved, excluding already-seen)
    candidates = fetch_candidate_products(exclude_ids=interacted_ids)
    if not candidates:
        return _fallback(user_id, limit, interacted_ids)

    # 5. Build feature matrix on the union of interacted + candidates
    #    (so categories and tags align)
    all_products = interacted_products + candidates
    matrix = _build_feature_matrix(all_products)

    # 6. Build user vector = average of interacted products' vectors
    interacted_vectors = matrix[: len(interacted_products)]
    user_vector = interacted_vectors.mean(axis=0)

    # 7. Compute similarity vs candidates only
    candidate_vectors = matrix[len(interacted_products):]
    similarities = _cosine_similarity(user_vector, candidate_vectors)

    # 8. Top N
    if len(similarities) == 0:
        return _fallback(user_id, limit, interacted_ids)

    top_indices = np.argsort(similarities)[::-1][:limit]
    top_ids = [candidates[i]["id"] for i in top_indices if similarities[i] > 0]

    if not top_ids:
        return _fallback(user_id, limit, interacted_ids)

    return top_ids, "content"


def _fallback(user_id: str, limit: int, interacted_ids: list[str]) -> tuple[list[str], str]:
    """Popularity fallback: most-viewed products in the user's most-viewed categories."""
    category_ids = get_category_of_products(interacted_ids) if interacted_ids else []
    product_ids = fetch_popular_by_categories(category_ids, limit)
    # Don't recommend what they already saw
    product_ids = [pid for pid in product_ids if pid not in interacted_ids][:limit]
    return product_ids, "fallback"