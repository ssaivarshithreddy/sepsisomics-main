from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Sepsisomics API"
    app_version: str = "1.0.0"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    ml_model_path: str | None = None
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 60
    notification_retry_attempts: int = 3
    sensitive_data_key: str | None = Field(default=None, repr=False)

    supabase_url: AnyHttpUrl
    supabase_anon_key: str
    supabase_service_role_key: str = Field(repr=False)
    supabase_jwt_secret: str = Field(repr=False)

    cors_origins_raw: str = Field(default="http://localhost:8080,http://127.0.0.1:8080", alias="CORS_ORIGINS")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
