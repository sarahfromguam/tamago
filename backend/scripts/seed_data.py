"""Seed the database with demo data for frontend development."""

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timedelta, timezone

PDT = timezone(timedelta(hours=-7))
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services import db

UID = "user_mia"
TODAY = datetime.now(timezone.utc).date()


def seed():
    # Clear existing data for this user
    db._client().table("medication_logs").delete().eq("uid", UID).execute()
    db._client().table("medication_schedule").delete().eq("uid", UID).execute()
    db._client().table("health_snapshots").delete().eq("user_id", UID).execute()
    print(f"✓ cleared existing data for {UID}")

    # User
    db.upsert_user({
        "id": UID,
        "name": "Maya's Egg",
        "email": "maya@example.com",
        "phone": "+15550001234",
    })
    print(f"✓ user {UID}")

    # Schedule
    now_pdt = datetime.now(PDT)
    overdue_time = (now_pdt - timedelta(hours=1)).strftime("%H:%M")

    schedule = [
        {
            "uid": UID,
            "medication_name": "Tylenol",
            "dose": "500",
            "unit": "mg",
            "frequency": "as needed",
            "scheduled_times": [overdue_time],
            "start_date": str(TODAY),
            "reminders_enabled": True,
        },
        {
            "uid": UID,
            "medication_name": "Ibuprofen",
            "dose": "600",
            "unit": "mg",
            "frequency": "every 6 hours as needed",
            "scheduled_times": ["08:00", "14:00", "20:00"],
            "start_date": str(TODAY - timedelta(days=30)),
            "reminders_enabled": True,
        },
        {
            "uid": UID,
            "medication_name": "Docusate Sodium",
            "dose": "100",
            "unit": "mg",
            "frequency": "twice daily",
            "scheduled_times": ["08:00", "20:00"],
            "start_date": str(TODAY - timedelta(days=30)),
            "reminders_enabled": True,
        },
        {
            "uid": UID,
            "medication_name": "Postnatal Vitamin",
            "dose": "1",
            "unit": "tablet",
            "frequency": "once daily",
            "scheduled_times": ["09:00"],
            "start_date": str(TODAY - timedelta(days=30)),
            "reminders_enabled": True,
        },
        {
            "uid": UID,
            "medication_name": "Iron Supplement",
            "dose": "65",
            "unit": "mg",
            "frequency": "once daily",
            "scheduled_times": ["12:00"],
            "start_date": str(TODAY - timedelta(days=30)),
            "reminders_enabled": False,
        },
    ]
    for item in schedule:
        db.create_schedule_item(item)
    print(f"✓ {len(schedule)} schedule items")

    # Medication logs — past 7 days with realistic gaps
    logs = []
    for days_ago in range(7, 0, -1):
        day = TODAY - timedelta(days=days_ago)
        day_str = str(day)

        # Ibuprofen morning — always taken, slight variation each day
        am_min = 7 + (days_ago % 3)
        logs.append({
            "uid": UID,
            "date": day_str,
            "medication_name": "Ibuprofen",
            "dose": "600",
            "unit": "mg",
            "taken_at": datetime(day.year, day.month, day.day, 8, am_min, tzinfo=PDT).isoformat(),
            "source": "webhook",
            "conversation_id": f"conv_{day_str}_am",
            "confidence_score": 0.95,
            "notes": "took my ibuprofen with breakfast",
        })

        # Ibuprofen afternoon — skipped on days 5 and 3 ago
        if days_ago not in (5, 3):
            logs.append({
                "uid": UID,
                "date": day_str,
                "medication_name": "Ibuprofen",
                "dose": "600",
                "unit": "mg",
                "taken_at": datetime(day.year, day.month, day.day, 14, 5 + (days_ago % 4), tzinfo=PDT).isoformat(),
                "source": "webhook",
                "conversation_id": f"conv_{day_str}_pm",
                "confidence_score": 0.92,
                "notes": "took my afternoon ibuprofen",
            })

        # Docusate Sodium — skipped on day 2 ago
        if days_ago != 2:
            logs.append({
                "uid": UID,
                "date": day_str,
                "medication_name": "Docusate Sodium",
                "dose": "100",
                "unit": "mg",
                "taken_at": datetime(day.year, day.month, day.day, 8, 18 + (days_ago % 3), tzinfo=PDT).isoformat(),
                "source": "webhook" if days_ago > 2 else "manual",
                "confidence_score": 0.89 if days_ago > 2 else None,
                "notes": "stool softener with morning meds" if days_ago > 2 else None,
            })

        # Postnatal Vitamin — taken most days
        if days_ago % 3 != 0:
            logs.append({
                "uid": UID,
                "date": day_str,
                "medication_name": "Postnatal Vitamin",
                "dose": "1",
                "unit": "tablet",
                "taken_at": datetime(day.year, day.month, day.day, 9, 2 + (days_ago % 5), tzinfo=PDT).isoformat(),
                "source": "manual",
            })

        # Iron Supplement — taken every other day (easy to forget)
        if days_ago % 2 == 0:
            logs.append({
                "uid": UID,
                "date": day_str,
                "medication_name": "Iron Supplement",
                "dose": "65",
                "unit": "mg",
                "taken_at": datetime(day.year, day.month, day.day, 12, 15 + (days_ago % 10), tzinfo=PDT).isoformat(),
                "source": "webhook",
                "conversation_id": f"conv_{day_str}_noon",
                "confidence_score": 0.87,
                "notes": "took my iron with lunch",
            })

    # Today's logs
    logs.append({
        "uid": UID,
        "date": str(TODAY),
        "medication_name": "Ibuprofen",
        "dose": "600",
        "unit": "mg",
        "taken_at": datetime(TODAY.year, TODAY.month, TODAY.day, 8, 7, tzinfo=PDT).isoformat(),
        "source": "webhook",
        "conversation_id": f"conv_{TODAY}_am",
        "confidence_score": 0.97,
        "notes": "took my ibuprofen this morning",
    })
    logs.append({
        "uid": UID,
        "date": str(TODAY),
        "medication_name": "Docusate Sodium",
        "dose": "100",
        "unit": "mg",
        "taken_at": datetime(TODAY.year, TODAY.month, TODAY.day, 8, 19, tzinfo=PDT).isoformat(),
        "source": "webhook",
        "conversation_id": f"conv_{TODAY}_am",
        "confidence_score": 0.91,
        "notes": "and my stool softener",
    })
    logs.append({
        "uid": UID,
        "date": str(TODAY),
        "medication_name": "Postnatal Vitamin",
        "dose": "1",
        "unit": "tablet",
        "taken_at": datetime(TODAY.year, TODAY.month, TODAY.day, 9, 4, tzinfo=PDT).isoformat(),
        "source": "manual",
    })

    for log in logs:
        db.put_medication_log(log)
    print(f"✓ {len(logs)} medication logs")

    # Health snapshots — one per day for past 7 days
    states = ["thriving", "thriving", "okay", "okay", "thriving", "okay", "struggling"]
    for i, days_ago in enumerate(range(7, 0, -1)):
        ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
        db.put_health_snapshot({
            "user_id": UID,
            "source": "omi",
            "raw_data": {"conversation_id": f"conv_snap_{days_ago}"},
            "dimensions": {
                "sleep": "green" if i % 3 != 2 else "yellow",
                "stress": "green" if i % 4 != 3 else "red",
                "meds": "green" if days_ago not in (5, 3, 2) else "yellow",
            },
            "is_sleeping": False,
            "timestamp": ts.isoformat(),
        })
    print(f"✓ 7 health snapshots")

    print("\nDone! Seeded demo data for user_mia (Maya).")


if __name__ == "__main__":
    seed()
