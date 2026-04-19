"""Direct Oura API v2 integration.

Uses personal access tokens (PAT) stored per-user, or OAuth tokens issued
via Oura's OAuth2 flow (client_id / client_secret from env).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from models.health_snapshot import DimensionState, Dimensions

OURA_BASE = "https://api.ouraring.com"
OURA_CLIENT_ID = os.environ.get("OURA_CLIENT_ID", "")
OURA_CLIENT_SECRET = os.environ.get("OURA_CLIENT_SECRET", "")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:5173")


# ---------------------------------------------------------------------------
# OAuth helpers
# ---------------------------------------------------------------------------

def get_oura_oauth_url(state: str) -> str:
    """Return the Oura OAuth2 authorization URL. Redirect the user here."""
    return (
        f"https://cloud.ouraring.com/oauth/authorize"
        f"?response_type=code"
        f"&client_id={OURA_CLIENT_ID}"
        f"&redirect_uri={APP_BASE_URL}/oura/callback"
        f"&scope=personal+daily+heartrate+workout+session"
        f"&state={state}"
    )


async def exchange_code_for_token(code: str) -> dict[str, Any]:
    """Exchange an authorization code for an access + refresh token pair."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.ouraring.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": f"{APP_BASE_URL}/oura/callback",
                "client_id": OURA_CLIENT_ID,
                "client_secret": OURA_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------

async def _get(token: str, path: str, params: dict | None = None) -> Any:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{OURA_BASE}{path}",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


async def get_daily_sleep(token: str, days: int = 7) -> list[dict]:
    """Fetch daily sleep scores for the past N days (most recent first)."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    data = await _get(token, "/v2/usercollection/daily_sleep", {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    records = data.get("data", [])
    return sorted(records, key=lambda r: r.get("day", ""), reverse=True)


async def get_daily_readiness(token: str, days: int = 7) -> list[dict]:
    """Fetch daily readiness scores (HRV, recovery) for the past N days."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    data = await _get(token, "/v2/usercollection/daily_readiness", {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    records = data.get("data", [])
    return sorted(records, key=lambda r: r.get("day", ""), reverse=True)


async def get_daily_activity(token: str, days: int = 7) -> list[dict]:
    """Fetch daily activity (steps, calories, score) for the past N days."""
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=days)
    data = await _get(token, "/v2/usercollection/daily_activity", {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    records = data.get("data", [])
    return sorted(records, key=lambda r: r.get("day", ""), reverse=True)


async def get_sleep_sessions(token: str) -> list[dict]:
    """Recent sleep sessions — used to detect if user is currently sleeping."""
    now = datetime.now(timezone.utc)
    start = (now - timedelta(hours=12)).date()
    end = (now + timedelta(days=1)).date()
    data = await _get(token, "/v2/usercollection/sleep", {
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    })
    return data.get("data", [])


# ---------------------------------------------------------------------------
# Business logic
# ---------------------------------------------------------------------------

def is_currently_sleeping(sessions: list[dict]) -> bool:
    now = datetime.now(timezone.utc)
    for session in sessions:
        end_str = session.get("bedtime_end")
        if end_str is None:
            return True
        try:
            end_time = datetime.fromisoformat(end_str.replace("Z", "+00:00"))
            if end_time > now:
                return True
        except ValueError:
            pass
    return False


def _sleep_hours(sleep_record: dict, sessions: list[dict]) -> str:
    """Get actual sleep duration from session data (daily_sleep contributors are scores, not hours)."""
    # Find the most recent long_sleep session for this day
    day = sleep_record.get("day", "")
    for s in sorted(sessions, key=lambda x: x.get("total_sleep_duration", 0), reverse=True):
        if s.get("day") == day and s.get("total_sleep_duration"):
            h = s["total_sleep_duration"] / 3600
            return f"{h:.1f}h"
    # Fallback: estimate from total_sleep contributor score (0-100 → ~4-9h range)
    score = sleep_record.get("contributors", {}).get("total_sleep", None)
    if score is not None:
        h = 4 + (score / 100) * 5
        return f"~{h:.1f}h"
    return "—"


def _hrv_label(readiness_record: dict, sessions: list[dict]) -> str:
    """Get HRV from sleep session average_hrv (most reliable), fallback to hrv_balance contributor."""
    for s in sorted(sessions, key=lambda x: x.get("average_hrv") or 0, reverse=True):
        if s.get("average_hrv"):
            return f"HRV {int(s['average_hrv'])}ms"
    hrv_balance = readiness_record.get("contributors", {}).get("hrv_balance", None)
    if hrv_balance is not None:
        return f"HRV balance {hrv_balance}"
    return "—"


def compute_dimensions_from_oura(
    sleep_records: list[dict],
    readiness_records: list[dict],
    sessions: list[dict] | None = None,
    activity_records: list[dict] | None = None,
) -> tuple[Dimensions, dict, dict]:
    """Return (Dimensions, dimension_details, vitals) from Oura daily records.

    dimension_details keys: sleep, stress, meds, activity
    vitals keys: steps, resting_hr, hrv
    """
    sleep_rec = sleep_records[0] if sleep_records else {}
    ready_rec = readiness_records[0] if readiness_records else {}
    act_rec   = activity_records[0] if activity_records else {}
    sess = sessions or []

    sleep_score: float | None = sleep_rec.get("score")
    readiness_score: float | None = ready_rec.get("score")
    activity_score: float | None = act_rec.get("score")

    # 7-day history arrays (oldest→newest) for sparklines
    sleep_history = [int(r["score"]) for r in reversed(sleep_records) if r.get("score") is not None]
    ready_history = [int(r["score"]) for r in reversed(readiness_records) if r.get("score") is not None]
    act_history   = [int(r["score"]) for r in reversed(activity_records or []) if r.get("score") is not None]

    def sleep_state(v: float) -> DimensionState:
        if v >= 85: return "green"
        if v >= 60: return "yellow"
        return "red"

    def readiness_state(v: float) -> DimensionState:
        if v >= 80: return "green"
        if v >= 60: return "yellow"
        return "red"

    dims = Dimensions(
        sleep=sleep_state(sleep_score) if sleep_score is not None else "grey",
        stress=readiness_state(readiness_score) if readiness_score is not None else "grey",
        meds="grey",
    )

    details: dict = {}

    if sleep_score is not None:
        hours = _sleep_hours(sleep_rec, sess)
        sublabels = {"green": "well rested", "yellow": "slightly short", "red": "deep deficit"}
        details["sleep"] = {
            "score": int(sleep_score),
            "label": hours,
            "sublabel": sublabels.get(dims.sleep, ""),
            "history": sleep_history,
        }

    if readiness_score is not None:
        hrv_lbl = _hrv_label(ready_rec, sess)
        sublabels = {"green": "good recovery", "yellow": "moderate stress", "red": "needs rest"}
        details["stress"] = {
            "score": int(readiness_score),
            "label": hrv_lbl,
            "sublabel": sublabels.get(dims.stress, ""),
            "history": ready_history,
        }

    if activity_score is not None:
        steps = act_rec.get("steps", 0)
        steps_lbl = f"{steps:,} steps"
        act_sublabel = "great movement" if steps >= 8000 else "light movement" if steps >= 3000 else "very sedentary"
        details["activity"] = {
            "score": int(activity_score),
            "label": steps_lbl,
            "sublabel": act_sublabel,
            "history": act_history,
        }

    # Vitals: raw numbers for the stats strip
    resting_hr: int | None = None
    hrv_avg: int | None = None
    for s in sorted(sess, key=lambda x: x.get("total_sleep_duration", 0), reverse=True):
        if s.get("lowest_heart_rate") and resting_hr is None:
            resting_hr = int(s["lowest_heart_rate"])
        if s.get("average_hrv") and hrv_avg is None:
            hrv_avg = int(s["average_hrv"])

    vitals: dict = {
        "steps": act_rec.get("steps"),
        "resting_hr": resting_hr,
        "hrv": hrv_avg,
    }

    return dims, details, vitals
