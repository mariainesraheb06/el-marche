"""Pydantic models for request and response."""
from typing import Literal

from pydantic import BaseModel


class RecommendationResponse(BaseModel):
    productIds: list[str]
    strategy: Literal["content", "fallback"]


class HealthResponse(BaseModel):
    status: str