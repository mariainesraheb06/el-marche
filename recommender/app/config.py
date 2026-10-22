"""Configuration loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All settings read from the .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Required
    database_url: str
    internal_api_key: str

    # Optional with defaults
    default_limit: int = 10
    max_limit: int = 50
    min_events_for_content: int = 3  # below this, use fallback
    price_bucket_count: int = 5       # low / medium-low / medium / medium-high / high


settings = Settings()