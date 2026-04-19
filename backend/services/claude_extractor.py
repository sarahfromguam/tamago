"""Extract medication info from Omi voice transcripts using Gemini Flash."""

import json
import os
from typing import Any

from google import genai

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    return _client


EXTRACTION_PROMPT = """You are a medication tracking assistant. Extract any medication events from this conversation transcript.

Return JSON only — no markdown, no explanation — with this schema:
{{
  "events": [
    {{
      "medication_name": str,
      "dose": str | null,
      "unit": str | null,
      "action": "taken" | "missed" | "scheduled" | "questioned",
      "taken_at": "<ISO8601> | null",
      "confidence": 0.0-1.0,
      "raw_quote": str
    }}
  ]
}}

If no medication events are found, return {{"events": []}}.
Transcript: {transcript_text}"""


async def extract_medication_events(transcript_text: str) -> list[dict[str, Any]]:
    response = _get_client().models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=EXTRACTION_PROMPT.format(transcript_text=transcript_text),
    )
    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    data = json.loads(text)
    return data.get("events", [])


async def extract_medication(transcript: str) -> dict[str, Any] | None:
    events = await extract_medication_events(transcript)
    return events[0] if events else None
