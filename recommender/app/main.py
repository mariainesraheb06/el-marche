"""FastAPI entry point — El Marché recommender."""
from fastapi import FastAPI, Header, HTTPException, Query

from app.config import settings
from app.db import upsert_recommendations
from app.recommender import recommend
from app.schemas import HealthResponse, RecommendationResponse

app = FastAPI(title="El Marché recommender")


def _check_internal_key(x_internal_key: str | None) -> None:
    """Verify the internal API key sent by the Next.js server."""
    if not x_internal_key or x_internal_key != settings.internal_api_key:
        raise HTTPException(status_code=401, detail="Invalid internal key")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/recommend/{user_id}", response_model=RecommendationResponse)
def get_recommendations(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
) -> RecommendationResponse:
    """
    Return up to `limit` product IDs for the given user.
    Called only by the Next.js server (protected by X-Internal-Key).
    """
    _check_internal_key(x_internal_key)

    product_ids, strategy = recommend(user_id, limit)

        # Cache the result (best effort; don't fail the request if it errors)
    try:
        upsert_recommendations(user_id, product_ids, strategy)
    except Exception:  # noqa: BLE001 — cache write must never break the response
        pass

    return RecommendationResponse(productIds=product_ids, strategy=strategy)