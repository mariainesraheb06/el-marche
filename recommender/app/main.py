"""FastAPI entry point — El Marché recommender."""
import hmac
import logging
from uuid import UUID

from fastapi import FastAPI, Header, HTTPException, Query

from app.config import settings
from app.db import upsert_recommendations
from app.recommender import recommend
from app.schemas import HealthResponse, RecommendationResponse

logger = logging.getLogger(__name__)

app = FastAPI(title="El Marché recommender")


def _check_internal_key(x_internal_key: str | None) -> None:
    """Verify the internal API key sent by the Next.js server (constant-time)."""
    if not x_internal_key or not hmac.compare_digest(
        x_internal_key, settings.internal_api_key
    ):
        raise HTTPException(status_code=401, detail="Invalid internal key")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendations(
    user_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
) -> RecommendationResponse:
    """
    Return up to `limit` product IDs for the given user.
    Called only by the Next.js server (protected by X-Internal-Key).
    """
    _check_internal_key(x_internal_key)

    user_id_str = str(user_id)
    product_ids, strategy = recommend(user_id_str, limit)

    # Cache the result (best effort; don't fail the request if it errors)
    try:
        upsert_recommendations(user_id_str, product_ids, strategy)
    except Exception:
        # Cache writes are best-effort: a failure here must never break the
        # API response, so we log it and move on.
        logger.exception("Failed to cache recommendations for user %s", user_id_str)

    return RecommendationResponse(productIds=product_ids, strategy=strategy)