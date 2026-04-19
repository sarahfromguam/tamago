from fastapi import APIRouter, Query

from models.egg_state import EggState
from services.supabase_client import supabase
from services.health_compute import compute_tamago_state

router = APIRouter(prefix="/api/feed", tags=["feed"])


class FeedItem(EggState):
    slug: str
    name: str


@router.get("", response_model=list[FeedItem])
async def get_feed(phone: str = Query(..., description="Supporter's phone number")):
    """Get all tamagos this phone number is subscribed to, with current egg states."""
    raise NotImplementedError
