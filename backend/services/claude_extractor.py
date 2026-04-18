"""Extract medication info from Omi voice transcripts using Claude API."""

from typing import Any

import anthropic


async def extract_medication(transcript: str) -> dict[str, Any] | None:
    """Parse a voice transcript and extract medication details.

    Returns dict with keys: medication_name, dose, unit, taken_at, confidence
    or None if no medication event detected.
    """
    raise NotImplementedError
