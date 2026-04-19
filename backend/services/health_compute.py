"""Compute tamago egg state from health dimensions."""

from typing import Any

from models.egg_state import EggState, EggBase
from models.health_snapshot import Dimensions, DimensionState

# Contextual action order per base state
ACTION_MAP: dict[str, list[str]] = {
    "thriving": ["text", "coffee"],
    "okay": ["text", "coffee", "food"],
    "struggling": ["food", "text", "call"],
    "fried": ["call", "food", "text"],
}

SLEEPING_ACTIONS: list[str] = ["text", "coffee", "food"]


def compute_sleep_state(oura_data: dict[str, Any]) -> DimensionState:
    sleep_score = oura_data.get("sleep", {}).get("score", 0)
    if sleep_score >= 85:
        return "green"
    elif sleep_score >= 60:
        return "yellow"
    else:
        return "red"


def compute_stress_state(oura_data: dict[str, Any]) -> DimensionState:
    hrv = oura_data.get("hrv", {}).get("average", 0)
    stress_level = oura_data.get("stress", {}).get("level", "unknown")
    if stress_level == "low" or hrv > 50:
        return "green"
    elif stress_level == "medium" or hrv > 30:
        return "yellow"
    else:
        return "red"


def compute_meds_state(logged_meds: list[str], scheduled_meds: list[dict]) -> DimensionState:
    if not scheduled_meds:
        return "grey"
    taken = len([m for m in scheduled_meds if m["name"] in logged_meds])
    ratio = taken / len(scheduled_meds)
    if ratio >= 0.9:
        return "green"
    elif ratio >= 0.5:
        return "yellow"
    else:
        return "red"


def compute_base_state(dimensions: Dimensions) -> EggBase:
    states = [dimensions.sleep, dimensions.stress, dimensions.meds]
    active = [s for s in states if s != "grey"]
    red_count = active.count("red")
    yellow_count = active.count("yellow")

    if red_count >= 2:
        return "fried"
    elif red_count == 1:
        return "struggling"
    elif yellow_count >= 1:
        return "okay"
    return "thriving"


def compute_tamago_state(
    dimensions: Dimensions,
    is_sleeping: bool,
    support_count: int,
) -> EggState:
    base = compute_base_state(dimensions)
    actions = SLEEPING_ACTIONS if is_sleeping else ACTION_MAP.get(base, [])

    return EggState(
        base=base,
        is_sleeping=is_sleeping,
        supported=support_count > 0,
        support_count=support_count,
        dimensions=dimensions,
        recommended_actions=actions,
    )
