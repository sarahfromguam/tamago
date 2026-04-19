"""Extract medication info from Omi voice transcripts.

Detection order:
1. Keyword scan for distress signals (headache, pain, etc.)
2. Keyword scan for medication-taken signals (took, finished, etc.)
3. Fall back to Gemini LLM if no clear signal
"""

import json
import os
import re
from typing import Any

from google import genai

_client: genai.Client | None = None

DISTRESS_WORDS = {
    "headache", "head ache", "pain", "hurts", "hurting", "ache", "aching",
    "terrible", "awful", "exhausted", "can't sleep", "won't sleep", "won't let me sleep",
    "sick", "nauseous", "dizzy", "migraine", "throbbing", "burning",
}

TAKEN_WORDS = {
    "took", "taken", "just took", "finished", "swallowed",
    "had my", "taking now", "took it", "taking my",
}


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
      "taken_at": null,
      "confidence": 0.0-1.0,
      "raw_quote": str
    }}
  ]
}}

Only include medications that were actually taken or missed — not ones merely mentioned in passing.
If no medication events are found, return {{"events": []}}.
Transcript: {transcript_text}"""


def detect_distress(transcript: str) -> bool:
    """Return True if transcript contains distress signals."""
    lower = transcript.lower()
    return any(w in lower for w in DISTRESS_WORDS)


def detect_taken(transcript: str, schedule: list[dict]) -> dict | None:
    """Return the first scheduled medication that appears to have been taken."""
    lower = transcript.lower()
    has_taken_word = any(w in lower for w in TAKEN_WORDS)
    if not has_taken_word:
        return None
    for med in schedule:
        if med["medication_name"].lower() in lower:
            sentences = re.split(r'[.!?\n]', transcript)
            quote = next((s for s in sentences if med["medication_name"].lower() in s.lower()), "")
            return {
                "medication_name": med["medication_name"],
                "dose": med.get("dose"),
                "unit": med.get("unit"),
                "action": "taken",
                "taken_at": None,
                "confidence": 0.92,
                "raw_quote": quote.strip(),
            }
    return None


async def extract_medication_events(
    transcript_text: str,
    schedule: list[dict] | None = None,
) -> list[dict[str, Any]]:
    # Fast keyword path for taken detection
    if schedule:
        match = detect_taken(transcript_text, schedule)
        if match:
            return [match]

    # Fall back to Gemini
    try:
        response = _get_client().models.generate_content(
            model="gemini-2.0-flash",
            contents=EXTRACTION_PROMPT.format(transcript_text=transcript_text),
        )
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        data = json.loads(text)
        return data.get("events", [])
    except Exception:
        return []


async def extract_medication(transcript: str) -> dict[str, Any] | None:
    events = await extract_medication_events(transcript)
    return events[0] if events else None
