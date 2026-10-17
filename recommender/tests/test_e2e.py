"""
End-to-end tests for the recommender service.

These tests exercise the full HTTP stack (FastAPI routing, auth, validation,
response serialization) without hitting a real database. Database calls are
mocked so the tests are deterministic and CI-safe.
"""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"X-Internal-Key": settings.internal_api_key}


def test_health_endpoint_returns_ok(client):
    """GET /health returns {status: ok} with no auth."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_recommend_requires_internal_key(client):
    """Missing X-Internal-Key → 401."""
    response = client.get("/recommend/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid internal key"}


def test_recommend_rejects_wrong_key(client):
    """Wrong X-Internal-Key → 401."""
    response = client.get(
        "/recommend/00000000-0000-0000-0000-000000000000",
        headers={"X-Internal-Key": "wrong-key"},
    )
    assert response.status_code == 401


def test_recommend_rejects_bad_uuid(client, auth_headers):
    """Non-UUID user_id → 422."""
    response = client.get(
        "/recommend/not-a-uuid",
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_recommend_rejects_out_of_range_limit(client, auth_headers):
    """limit > 50 → 422."""
    response = client.get(
        "/recommend/00000000-0000-0000-0000-000000000000?limit=999",
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_recommend_returns_fallback_when_no_history(client, auth_headers):
    """
    Full HTTP flow with mocked DB:
    - no user history → fallback strategy
    - returns correct response shape
    - caches nothing (mocked upsert)
    """
    with (
        patch("app.main.recommend", return_value=(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"], "fallback")),
        patch("app.main.upsert_recommendations"),
    ):
        response = client.get(
            "/recommend/00000000-0000-0000-0000-000000000000?limit=10",
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data == {
        "productIds": ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        "strategy": "fallback",
    }


def test_recommend_returns_content_strategy(client, auth_headers):
    """Full HTTP flow with mocked recommender returning content strategy."""
    with (
        patch(
            "app.main.recommend",
            return_value=(
                [
                    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                ],
                "content",
            ),
        ),
        patch("app.main.upsert_recommendations"),
    ):
        response = client.get(
            "/recommend/00000000-0000-0000-0000-000000000000?limit=2",
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["strategy"] == "content"
    assert len(data["productIds"]) == 2


def test_recommend_survives_cache_write_failure(client, auth_headers):
    """
    If upsert_recommendations raises (e.g., FK violation), the response
    should still be 200. Cache writes are best-effort.
    """
    with (
        patch("app.main.recommend", return_value=([], "fallback")),
        patch(
            "app.main.upsert_recommendations",
            side_effect=Exception("simulated cache failure"),
        ),
    ):
        response = client.get(
            "/recommend/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )

    assert response.status_code == 200
    assert response.json() == {"productIds": [], "strategy": "fallback"}