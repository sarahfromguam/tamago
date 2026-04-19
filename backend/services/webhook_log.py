"""In-memory log of incoming Omi webhook conversations (resets on restart)."""
from __future__ import annotations

_log: list[dict] = []


def append(entry: dict) -> None:
    _log.insert(0, entry)  # newest first
    if len(_log) > 50:
        _log.pop()


def get_all() -> list[dict]:
    return list(_log)
