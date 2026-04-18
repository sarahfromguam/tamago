# Medication Management System — Omi Wearable

## Overview

A hands-free medication tracking system powered by the Omi wearable. Users speak naturally ("I just took my metformin") and the system automatically logs it, detects missed doses, and sends SMS reminders via Twilio.

---

## How Omi Powers This

| Omi API | How We Use It |
|---|---|
| **Memory Webhook** | Fires when a conversation ends — we parse the transcript for medication mentions |
| **Twilio SMS** | Send medication reminders and missed-dose alerts to the user's phone |
| **Memories API** | Store the user's medication schedule as persistent facts Omi can reference |
| **REST API** (`https://api.omi.me`) | Pull conversation history, back-fill logs |

Authentication: `Authorization: Bearer <omi_dev_key>` on all REST calls.

---

## Architecture

```
Omi Device
    │
    │  (speech → transcript)
    ▼
Omi Platform  ──── Memory Webhook POST ────►  FastAPI Backend
                                                    │
                                                    │  Claude API
                                                    │  (extract meds)
                                                    ▼
                                              DynamoDB
                                         ┌────────────────────┐
                                         │  MedicationLogs    │
                                         │  MedicationSchedule│
                                         │  Users             │
                                         └────────────────────┘
                                                    │
                                                    ▼
                                            FastAPI REST API
                                                    │
                                                    ▼
                                           React Frontend
                                        (medication dashboard)
                                                    │
                                                    ▼
                                         Omi Action Items API
                                         (push reminders back
                                          to the wearable)
```

---

## Backend — Python FastAPI

### Webhook Endpoints

```
POST /webhook/memory
    - Receives full conversation payload from Omi when a conversation ends
    - Payload includes: transcript segments, summary, action items, uid
    - Calls Claude to extract: medication name, dose, time taken, missed flag
    - Writes a MedicationLog entry to DynamoDB
```

### REST API Endpoints

```
GET  /api/logs?uid=&date=          — list medication logs for a user/day
GET  /api/logs/{log_id}            — single log detail
POST /api/logs                     — manual log entry (fallback)

GET  /api/schedule?uid=            — user's medication schedule
POST /api/schedule                 — add a medication + schedule
PUT  /api/schedule/{med_id}        — update dose/time
DEL  /api/schedule/{med_id}        — remove medication

GET  /api/adherence?uid=&range=    — adherence stats (taken vs scheduled)
POST /api/reminders                — manually trigger a reminder via Omi Action Items API
```

### DynamoDB Tables

**MedicationLogs**
```
PK: uid#YYYY-MM-DD  (partition by user + day)
SK: timestamp#log_id
Attributes: medication_name, dose, unit, taken_at, source (webhook|manual),
            conversation_id, confidence_score, notes
```

**MedicationSchedule**
```
PK: uid
SK: medication_id
Attributes: medication_name, dose, unit, frequency, scheduled_times[],
            start_date, end_date, reminders_enabled, omi_memory_id
```

**Users**
```
PK: uid
Attributes: omi_uid, name, timezone, phone_number, created_at
```

### Claude Integration (Medication Extraction)

When a memory webhook fires, call Claude with the transcript:

```python
prompt = """
You are a medication tracking assistant. Extract any medication events from this conversation transcript.

Return JSON with this schema:
{
  "events": [
    {
      "medication_name": str,
      "dose": str | null,
      "unit": str | null,          # mg, ml, tablet, etc.
      "action": "taken" | "missed" | "scheduled" | "questioned",
      "taken_at": ISO8601 | null,
      "confidence": 0.0-1.0,
      "raw_quote": str             # the exact phrase from transcript
    }
  ]
}

If no medication events are found, return {"events": []}.
Transcript: {transcript_text}
"""
```

---

## Frontend — React

### Pages

**Dashboard (`/`)**
- Today's medication timeline (taken ✓ / missed ✗ / upcoming ○)
- Adherence ring chart (% taken today)
- Recent activity feed from Omi conversations

**Medication Log (`/logs`)**
- Filterable table: date range, medication name, source
- Each row: med name, dose, time taken, detected from conversation snippet
- Expandable row → shows original Omi transcript excerpt

**Schedule (`/schedule`)**
- List of user's medications with times
- Add/edit/delete medications
- Toggle reminders on/off per medication (triggers Twilio SMS)

**Adherence (`/adherence`)**
- Weekly/monthly adherence bar chart per medication
- Streak tracking (days with 100% adherence)

### Key UI States
- **Detected**: log from Omi transcript (shows conversation source badge)
- **Manual**: user entered it themselves
- **Missed**: scheduled dose with no log within the window

---

## Reminder Flow (Twilio SMS)

When a scheduled dose is upcoming or missed:

1. Backend scheduler runs every 15 min, checks DynamoDB for doses where `scheduled_time + 1 hour < now` and no log exists
2. Calls Twilio Messages API:
   ```python
   client.messages.create(
       body="You missed your Metformin 500mg scheduled for 8:00 AM. Did you take it?",
       from_=TWILIO_PHONE_NUMBER,
       to=user.phone_number
   )
   ```
3. User receives SMS, takes (or notes) the medication
4. User speaks to Omi → memory webhook fires → log updated, alert cleared

### Twilio SMS trigger
- **Missed dose alert only** — sent if no log is recorded within ~1 hour of the scheduled time

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Backend | Python FastAPI | Async, fast webhook handling, great DynamoDB/boto3 support |
| Database | AWS DynamoDB | Serverless, scales per user, good for time-series log patterns |
| AI extraction | Claude API (`claude-sonnet-4-6`) | Best-in-class conversation understanding |
| Frontend | React + Vite | Fast setup for hackathon |
| Charts | Recharts | Simple, composable |
| SMS reminders | Twilio Messages API | Reliable delivery, easy Python SDK |
| Auth | Omi OAuth 2.0 | Use Omi's own auth so we get the user's `uid` securely |
| Hosting | AWS Lambda + API Gateway (backend), Vercel (frontend) | Fast deploy |

---

## Project Structure

```
oop-hkt/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── routers/
│   │   ├── webhooks.py          # /webhook/memory
│   │   ├── logs.py              # /api/logs
│   │   ├── schedule.py          # /api/schedule
│   │   └── adherence.py         # /api/adherence
│   ├── services/
│   │   ├── omi_client.py        # Omi REST API wrapper
│   │   ├── claude_extractor.py  # Claude medication extraction
│   │   ├── twilio_sms.py        # Twilio SMS reminders and alerts
│   │   └── dynamodb.py          # DynamoDB table operations
│   ├── models/
│   │   ├── medication_log.py
│   │   └── schedule.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Logs.tsx
    │   │   ├── Schedule.tsx
    │   │   └── Adherence.tsx
    │   ├── components/
    │   │   ├── MedicationTimeline.tsx
    │   │   ├── AdherenceRing.tsx
    │   │   └── LogTable.tsx
    │   ├── api/
    │   │   └── client.ts        # fetch wrapper for FastAPI
    │   └── App.tsx
    └── package.json
```

---

## Build Order

1. **Backend skeleton** — FastAPI app, DynamoDB tables, env config
2. **Omi webhook receiver** — accept memory payload, log raw to DynamoDB
3. **Claude extractor** — parse transcript → structured medication event
4. **REST API** — logs + schedule CRUD
5. **Twilio client** — SMS missed-dose alert (1 hour overdue, no log)
6. **Frontend** — Dashboard + Log table (connect to API)
7. **Schedule page** — add/edit medications, toggle reminders
8. **Adherence charts** — stats from DynamoDB aggregation
9. **Polish** — Omi OAuth, error states, loading skeletons
