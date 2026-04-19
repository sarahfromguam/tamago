#!/usr/bin/env python3
"""Replay a dummy conversation from data/ into the local webhook to test medication extraction."""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
filename = sys.argv[1] if len(sys.argv) > 1 else "dummy_postpartum_conversation.json"
DUMMY_FILE = DATA_DIR / filename
PORT = os.environ.get("BACKEND_PORT", "8002")
LOCAL_WEBHOOK = f"http://localhost:{PORT}/webhook/omi"
UID = os.environ.get("OMI_UID", "user_mia")


async def main():
    conversations = json.loads(DUMMY_FILE.read_text())
    conversation = conversations[0]

    print(f"Replaying: {conversation['id']}")
    print(f"Transcript:")
    for seg in conversation["transcript_segments"]:
        print(f"  [{seg['speaker_name']}] {seg['text']}")

    print(f"\nPOST {LOCAL_WEBHOOK}?uid={UID}")
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(LOCAL_WEBHOOK, params={"uid": UID}, json=conversation)
        print(f"Status: {r.status_code}")
        print(json.dumps(r.json(), indent=2))


if __name__ == "__main__":
    asyncio.run(main())
