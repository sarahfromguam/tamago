from typing import Any

from fastapi import APIRouter, Request

from services.health_compute import compute_tamago_state
from services.oura import process_oura_webhook
from services.claude_extractor import extract_medication
from services.supabase_client import supabase

router = APIRouter(prefix="/webhook", tags=["webhooks"])


@router.post("/oura")
async def oura_webhook(request: Request):
    """Receive Oura data webhook. Processes sleep/HRV/stress data and updates health snapshot."""
    payload = await request.json()
    raise NotImplementedError


@router.post("/omi")
async def omi_webhook(request: Request):
    """Receive Omi memory webhook. Extracts medication info from voice transcript using Claude."""
    payload = await request.json()
    raise NotImplementedError
