from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase_admin() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_service_role_key)


@lru_cache
def get_supabase_public() -> Client:
    return create_client(str(settings.supabase_url), settings.supabase_anon_key)
