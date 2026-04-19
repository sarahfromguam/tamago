import os
from functools import lru_cache
from supabase import create_client, Client


@lru_cache(maxsize=1)
def _get_client() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


def _client() -> Client:
    return _get_client()


def put_medication_log(log: dict) -> dict:
    result = _client().table("medication_logs").insert(log).execute()
    return result.data[0]


def get_logs(uid: str, date: str | None = None) -> list[dict]:
    query = _client().table("medication_logs").select("*").eq("uid", uid)
    if date:
        query = query.eq("date", date)
    return query.order("taken_at", desc=True).execute().data


def get_log(log_id: str) -> dict | None:
    result = _client().table("medication_logs").select("*").eq("id", log_id).maybe_single().execute()
    return result.data


def get_schedule(uid: str) -> list[dict]:
    return _client().table("medication_schedule").select("*").eq("uid", uid).execute().data


def create_schedule_item(item: dict) -> dict:
    result = _client().table("medication_schedule").insert(item).execute()
    return result.data[0]


def update_schedule_item(med_id: str, updates: dict) -> dict:
    result = _client().table("medication_schedule").update(updates).eq("id", med_id).execute()
    return result.data[0]


def delete_schedule_item(med_id: str) -> None:
    _client().table("medication_schedule").delete().eq("id", med_id).execute()


def get_user(uid: str) -> dict | None:
    result = _client().table("users").select("*").eq("id", uid).maybe_single().execute()
    return result.data


def upsert_user(user: dict) -> dict:
    result = _client().table("users").upsert(user).execute()
    return result.data[0]


def put_health_snapshot(snapshot: dict) -> dict:
    result = _client().table("health_snapshots").insert(snapshot).execute()
    return result.data[0]


def get_health_snapshots(user_id: str, limit: int = 20) -> list[dict]:
    return (
        _client().table("health_snapshots")
        .select("*")
        .eq("user_id", user_id)
        .order("timestamp", desc=True)
        .limit(limit)
        .execute()
        .data
    )
