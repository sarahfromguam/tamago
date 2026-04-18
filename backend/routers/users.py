from fastapi import APIRouter, HTTPException

from models.user import UserCreate, UserOut, UserUpdate
from models.egg_state import EggState
from services.supabase_client import supabase
from services.health_compute import compute_tamago_state

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserOut)
async def create_user(body: UserCreate):
    """Create a new tamago user (protagonist). Generates a slug from the name."""
    raise NotImplementedError


@router.get("/{slug}", response_model=EggState)
async def get_tamago_state(slug: str):
    """Get the current tamago state for a user by slug. Returns egg state, dimensions, and recommended actions."""
    raise NotImplementedError


@router.put("/{slug}", response_model=UserOut)
async def update_user(slug: str, body: UserUpdate):
    """Update user settings. Protagonist identified by phone (passed as query param for MVP)."""
    raise NotImplementedError


@router.post("/{slug}/refresh", response_model=EggState)
async def refresh_health_data(slug: str):
    """Force refresh from Oura API and return updated tamago state. Called on page load."""
    raise NotImplementedError
