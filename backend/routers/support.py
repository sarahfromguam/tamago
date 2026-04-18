from fastapi import APIRouter, HTTPException

from models.support_action import SupportActionCreate, SupportActionOut
from services.supabase_client import supabase

router = APIRouter(prefix="/api/users/{slug}/support", tags=["support"])


@router.post("", response_model=SupportActionOut)
async def log_support_action(slug: str, body: SupportActionCreate):
    """Log a support action (text, call, coffee, food, etc). Adds flower decoration to the egg."""
    raise NotImplementedError


@router.get("", response_model=list[SupportActionOut])
async def get_todays_support(slug: str):
    """Get all support actions for this tamago from today."""
    raise NotImplementedError
