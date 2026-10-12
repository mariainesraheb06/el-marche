"""PostgreSQL connection using psycopg (Supabase)."""
from contextlib import contextmanager
from collections.abc import Iterator

import psycopg
from psycopg.rows import dict_row

from app.config import settings


@contextmanager
def get_connection() -> Iterator[psycopg.Connection]:
    """Context manager that yields a Postgres connection and closes it after use."""
    conn = psycopg.connect(
        settings.database_url,
        row_factory=dict_row,
        connect_timeout=5,  # ← fail fast instead of hanging
    )
    try:
        yield conn
    finally:
        conn.close()


def fetch_user_events(user_id: str, limit: int = 50) -> list[dict]:
    """
    Fetch the user's recent interactions (views + favorites).
    Returns a list of { product_id, event_type } ordered by recency.
    """
    query = """
        SELECT product_id, event_type
        FROM product_views
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """
    with get_connection() as conn, conn.cursor() as cur:
        with conn.cursor() as cur:
            cur.execute(query, (user_id, limit))
            return cur.fetchall()


def fetch_user_searches(user_id: str, limit: int = 20) -> list[dict]:
    """Fetch the user's recent search queries."""
    query = """
        SELECT query
        FROM searches
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT %s
    """
    with get_connection() as conn, conn.cursor() as cur:
        with conn.cursor() as cur:
            cur.execute(query, (user_id, limit))
            return cur.fetchall()


def fetch_candidate_products(exclude_ids: list[str] | None = None) -> list[dict]:
    """
    Fetch all approved products with the fields we need for similarity.
    Excludes products the user already interacted with.
    """
    exclude_clause = ""
    params: tuple = ()
    if exclude_ids:
        exclude_clause = "AND id != ALL(%s)"
        params = (exclude_ids,)

    query = f"""
        SELECT id, category_id, price_dzd, tags, view_count
        FROM products
        WHERE status = 'approved'
        {exclude_clause}
    """
    with get_connection() as conn, conn.cursor() as cur:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return cur.fetchall()


def fetch_products_by_ids(product_ids: list[str]) -> list[dict]:
    """Fetch full product rows by their IDs."""
    if not product_ids:
        return []
    query = """
        SELECT id, category_id, price_dzd, tags, view_count
        FROM products
        WHERE id = ANY(%s)
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (product_ids,))
            return cur.fetchall()


def fetch_popular_by_categories(category_ids: list[int], limit: int = 10) -> list[str]:
    """Fallback: most-viewed products in the user's most-viewed categories."""
    if not category_ids:
        # absolute fallback: globally most viewed
        query = """
            SELECT id FROM products
            WHERE status = 'approved'
            ORDER BY view_count DESC
            LIMIT %s
        """
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (limit,))
                return [row["id"] for row in cur.fetchall()]

    query = """
        SELECT id FROM products
        WHERE status = 'approved' AND category_id = ANY(%s)
        ORDER BY view_count DESC
        LIMIT %s
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (category_ids, limit))
            return [row["id"] for row in cur.fetchall()]


def get_category_of_products(product_ids: list[str]) -> list[int]:
    """Return the distinct category_ids of the given products."""
    if not product_ids:
        return []
    query = """
        SELECT DISTINCT category_id
        FROM products
        WHERE id = ANY(%s)
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (product_ids,))
            return [row["category_id"] for row in cur.fetchall()]


def upsert_recommendations(user_id: str, product_ids: list[str], strategy: str) -> None:
    """Write the result to recommendations_cache."""
    query = """
        INSERT INTO recommendations_cache (user_id, product_ids, strategy, computed_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
            product_ids = EXCLUDED.product_ids,
            strategy = EXCLUDED.strategy,
            computed_at = EXCLUDED.computed_at
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id, product_ids, strategy))
        conn.commit()