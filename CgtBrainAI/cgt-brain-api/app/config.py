"""Configuration management for CGT Brain API."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API Keys
    anthropic_api_key: str = ""

    # Claude Model Settings
    claude_model: str = "claude-sonnet-4-20250514"
    claude_max_tokens: int = 4096
    claude_timeout_seconds: float = 120.0

    # Concurrency Settings
    max_concurrent_requests: int = 100  # Max concurrent requests to the API
    max_concurrent_claude_calls: int = 20  # Max concurrent calls to Claude API
    request_timeout_seconds: float = 180.0  # Total request timeout

    # Retry Settings
    max_retries: int = 3
    retry_base_delay: float = 1.0  # Base delay for exponential backoff
    retry_max_delay: float = 30.0  # Maximum delay between retries

    # Connection Pool Settings
    http_pool_connections: int = 100
    http_pool_maxsize: int = 100
    http_keepalive_connections: int = 20

    # CORS Settings
    cors_origins: list[str] = [
        "https://ai.cgtbrain.com.au",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
