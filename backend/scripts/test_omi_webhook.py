#!/usr/bin/env python3
"""Fetch last hour of Omi conversations, save to data/, and replay into the local webhook."""

import asyncio
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

LOCAL_WEBHOOK = "http://localhost:8080/webhook/omi"
OMI_BASE = "https://api.omi.me"
DATA_DIR = Path(__file__).resolve().parents[2] / "data"


def omi_headers() -> dict:
    key = os.environ.get("OMI_DEV_KEY", "")
    if not key:
        print("Error: OMI_DEV_KEY not set in .env", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {key}"}


async def get_recent_conversations() -> list[dict]:
    since = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{OMI_BASE}/v1/dev/user/conversations",
            headers=omi_headers(),
            params={"limit": 10, "start_date": since, "include_transcript": True},
        )
        print(f"GET /v1/dev/user/conversations  →  {r.status_code}")
        print(json.dumps(r.json(), indent=2))
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else data.get("conversations", [])


async def replay_to_webhook(conversation: dict) -> None:
    uid = os.environ.get("OMI_UID") or conversation.get("uid") or conversation.get("user_id") or "unknown"
    async with httpx.AsyncClient() as client:
        r = await client.post(
            LOCAL_WEBHOOK,
            params={"uid": uid},
            json=conversation,
        )
        print(f"\nPOST /webhook/omi?uid={uid}  →  {r.status_code}")
        print(json.dumps(r.json(), indent=2))


def save_to_data_dir(conversations: list[dict]) -> Path:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = DATA_DIR / f"omi_conversations_{timestamp}.json"
    path.write_text(json.dumps(conversations, indent=2))
    print(f"\nSaved {len(conversations)} conversation(s) → {path}")
    return path


async def main():
    print("=== Fetching Omi conversations from last hour ===\n")
    try:
        conversations = await get_recent_conversations()
    except httpx.HTTPStatusError as e:
        print(f"\nAPI error: {e}")
        sys.exit(1)

    print(f"\nFound {len(conversations)} conversation(s)")

    if not conversations:
        print("No conversations in the last hour.")
        return

    save_to_data_dir(conversations)

    last = conversations[-1]
    print(f"\n=== Replaying last conversation: {last['id']} ===")
    await replay_to_webhook(last)


if __name__ == "__main__":
    asyncio.run(main())
