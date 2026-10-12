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