import json
from contextlib import suppress
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def cache_get(key: str) -> Any | None:
    with suppress(Exception):
        raw = await get_redis().get(key)
        return json.loads(raw) if raw else None
    return None


async def cache_set(key: str, value: Any, ttl_seconds: int | None = None) -> None:
    with suppress(Exception):
        await get_redis().set(key, json.dumps(value, default=str), ex=ttl_seconds or settings.cache_ttl_seconds)


async def cache_delete(key: str) -> None:
    with suppress(Exception):
        await get_redis().delete(key)


async def queue_push(queue_name: str, value: Any) -> None:
    with suppress(Exception):
        await get_redis().lpush(queue_name, json.dumps(value, default=str))
