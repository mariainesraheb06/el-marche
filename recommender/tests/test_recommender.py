"""Basic tests for the recommender service (no DB required)."""
import numpy as np

from app.recommender import _build_feature_matrix, _cosine_similarity


def test_build_feature_matrix_shapes():
    products = [
        {"id": "a", "category_id": 1, "price_dzd": 1000, "tags": ["red", "cotton"]},
        {"id": "b", "category_id": 1, "price_dzd": 5000, "tags": ["blue"]},
        {"id": "c", "category_id": 2, "price_dzd": 3000, "tags": []},
    ]
    matrix = _build_feature_matrix(products)
    assert matrix.shape[0] == 3
    assert matrix.shape[1] > 0


def test_cosine_similarity_identical_vectors():
    v = np.array([1.0, 0.0, 0.0])
    m = np.array([[1.0, 0.0, 0.0], [0.0, 1.0, 0.0]])
    sims = _cosine_similarity(v, m)
    assert sims[0] == 1.0
    assert sims[1] == 0.0


def test_cosine_similarity_zero_vector():
    v = np.array([0.0, 0.0, 0.0])
    m = np.array([[1.0, 0.0, 0.0]])
    sims = _cosine_similarity(v, m)
    assert sims[0] == 0.0


def test_recommend_without_key_returns_401():
    """Missing X-Internal-Key header returns 401."""
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.get("/recommend/00000000-0000-0000-0000-000000000000?limit=5")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid internal key"}


def test_recommend_with_wrong_key_returns_401():
    """Wrong X-Internal-Key header returns 401."""
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.get(
        "/recommend/00000000-0000-0000-0000-000000000000?limit=5",
        headers={"X-Internal-Key": "wrong-key"},
    )

    assert response.status_code == 401


