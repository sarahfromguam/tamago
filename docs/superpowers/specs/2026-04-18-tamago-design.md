# Tamago: Health-State Tamagotchi for Postpartum Support

## Overview

Tamago is a webapp that visualizes a person's health and wellbeing as a cute egg character ("tamago") using wearable data. The egg's appearance changes based on real health metrics — sleep, stress, and medication adherence — so a protagonist's support network can see at a glance how they're doing and take action to help.

The primary persona is a postpartum mother whose community (partner, parents, friends, doula) wants to support her but doesn't always know when or how. Tamago bridges that gap with a visual, low-friction, judgment-free interface.

## Core Concepts

### Protagonist
The person being tracked. Creates a tamago, connects their Oura ring, optionally uses Omi for medication logging. Invites their support network by phone number.

### Supporter
A community member subscribed to one or more tamagos. Views the egg's state, sees recommended actions, and can take action (text, call, send food/coffee). Does not need a wearable.

### Tamago
The egg character representing a protagonist's current wellbeing. Its visual state is driven by the worst active health dimension. Support actions add visual decorations (flowers, sparkles).

## Health Dimensions (Multi-Axis State Model)

The tamago's state is driven by three independently tracked dimensions. Each dimension is green, yellow, or red. The egg's overall appearance reflects the **worst** active dimension.

| Dimension | Data Source | Green | Yellow | Red |
|-----------|-----------|-------|--------|-----|
| Sleep | Oura sleep score | 85+ | 60-84 | < 60 |
| Stress | Oura HRV / stress data | Low stress / high HRV | Moderate | High stress / low HRV |
| Medication | Omi voice logs | All taken on time | Partially taken | Missed doses |

Thresholds are configurable per-protagonist in the future, but hardcoded for MVP.

### Egg Visual States

| State | Trigger | Visual Description |
|-------|---------|-------------------|
| Thriving | All dimensions green | Happy egg, rosy cheeks, bright eyes |
| Doing OK | Worst dimension is yellow | Content egg, slight smile, neutral expression |
| Struggling | One dimension red | Cracked egg, droopy eyes, concerned expression |
| Fried | Multiple dimensions red | Cooked/fried egg, needs help urgently |
| Sleeping | Oura detects active sleep | Eyes closed, ZZZ overlay, muted dimension indicators |
| Supported | Any state + recent support action | Base state + flower on head and/or sparkle decoration, support count badge |

The "Supported" state is a **modifier** layered on top of the base state. A struggling egg that receives support becomes a struggling egg with a flower — still showing the need, but also showing the love.

### Sleeping State Behavior

Sleep is sacred. When Oura detects the protagonist is currently sleeping:

- Egg displays with closed eyes and animated ZZZ icon overlay
- All dimension indicators are muted/greyed out
- "Call" and "FaceTime" action buttons are **disabled**
- Tapping a disabled button shows a nudge: *"She's catching up on sleep right now. Send a quiet text or schedule support for when she wakes up."*
- Async actions (text, send food, send coffee) remain fully active
- The sleeping state clears automatically when Oura reports the sleep session has ended

## Support Actions

Each tamago detail view shows contextual action buttons as icons. Actions are recommended based on the egg's current state.

| Action | Icon | Behavior | Available When |
|--------|------|----------|---------------|
| Text | 💬 | Opens native SMS via `sms:{phone}` with optional pre-filled message | Always |
| Call | 📞 | Opens native phone via `tel:{phone}` | Not sleeping |
| FaceTime | 📱 | Opens FaceTime via `facetime:{phone}` | Not sleeping |
| Send Coffee | ☕ | Links to DoorDash/Venmo (or pre-filled text for MVP) | Always |
| Send Food | 🍕 | Links to DoorDash/UberEats (or pre-filled text for MVP) | Always |

### Contextual Action Recommendations

The order and emphasis of actions changes based on state:

- **Thriving**: Text (check in), Coffee (treat her)
- **Doing OK**: Text, Coffee, Send Food
- **Struggling**: Send Food (promoted), Text, Call
- **Fried**: Call (urgent styling), Send Food, Text — all actions have elevated visual urgency
- **Sleeping**: Text, Coffee, Send Food — call/FaceTime disabled with nudge

### Support Tracking

When a supporter takes an action, it's logged in `support_actions`. This:
1. Adds the flower/sparkle decoration to the egg
2. Shows a count badge: "2 people sent support today"
3. Provides the protagonist with a warm notification (optional, non-intrusive)

Support decorations persist for 24 hours or until the next health data refresh, whichever is later.

## Screens

### 1. Onboarding
**URL:** `/create`

Simple flow:
1. Enter phone number (primary identifier)
2. Enter name for your tamago (e.g., "Sarah's Egg")
3. Connect Oura Ring (OAuth flow via OpenWearables)
4. Optionally connect Omi for medication tracking
5. Receive your shareable tamago URL (e.g., `/t/sarahs-egg`)

No password. Phone number is the identity. Returning users enter their phone number to access their tamago settings. For MVP, there is no SMS verification — we trust the phone number entry. This is acceptable because the data shown is non-sensitive health summaries, not raw medical records.

### 2. My Tamago (Protagonist View)
**URL:** `/t/{slug}/manage`

The protagonist's own dashboard:
- Current egg state with all three dimension indicators
- Raw health data summary (last night's sleep score, current HRV, meds taken today)
- Invite supporters section: enter phone numbers to send invite links via SMS
- List of current supporters
- Support received today (who did what)

### 3. Tamago Detail (Supporter View)
**URL:** `/t/{slug}`

The core experience for supporters:
- Large egg character with current visual state
- Three dimension indicators (sleep/stress/meds) with green/yellow/red dots
- If sleeping: ZZZ overlay with muted indicators
- Support action buttons (contextual to current state)
- "X people supported today" badge if applicable
- Last updated timestamp

This page refreshes data on load and via Oura webhooks.

### 4. Home Feed (Supporter Dashboard)
**URL:** `/home`

Grid/list of all tamagos the supporter is subscribed to:
- Each card shows: egg character (small), name, current state summary, worst dimension
- Sleeping tamagos show the ZZZ indicator
- Tap a card to go to the full Tamago Detail view
- Supporters identify themselves by phone number (no account creation needed beyond entering their phone on first visit)

### 5. Invite Handling
**URL:** `/invite/{code}`

When a supporter receives an invite link via SMS:
1. Enter their phone number (to identify them across tamagos)
2. They're now subscribed to that tamago
3. Redirect to the Tamago Detail view

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | Python FastAPI | Team's strongest language, async, good for webhooks |
| Database | Supabase (Postgres) | Free tier, jsonb for wearable data, instant setup |
| Frontend | React + Vite | Component-based, fast dev, existing skeleton |
| Wearable Data | OpenWearables (Oura) | Standardized access to Oura sleep/HRV/stress |
| Voice Logging | Omi Webhook | Medication tracking via natural speech |
| SMS Invites | Twilio | Send invite links and support notifications |
| Backend Deploy | Railway or Render | One-click deploy from git, free tier |
| Frontend Deploy | Vercel | Push-to-deploy for React/Vite |

## Data Model (Supabase)

### `users` table
```
id          uuid        PRIMARY KEY DEFAULT gen_random_uuid()
phone       text        NOT NULL UNIQUE  -- protagonist's phone number
name        text        NOT NULL         -- display name ("Sarah's Egg")
slug        text        NOT NULL UNIQUE  -- URL slug ("sarahs-egg")
oura_token  text                         -- OpenWearables/Oura OAuth token
omi_enabled boolean     DEFAULT false
created_at  timestamptz DEFAULT now()
```

### `health_snapshots` table
```
id          uuid        PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid        REFERENCES users(id)
source      text        NOT NULL         -- 'oura' | 'omi' | 'manual'
raw_data    jsonb       NOT NULL         -- full API response payload
dimensions  jsonb       NOT NULL         -- {"sleep": "green", "stress": "yellow", "meds": "green"}
is_sleeping boolean     DEFAULT false    -- true if Oura detects active sleep
timestamp   timestamptz DEFAULT now()
```

### `support_actions` table
```
id              uuid        PRIMARY KEY DEFAULT gen_random_uuid()
tamago_id       uuid        REFERENCES tamagos(id)
supporter_phone text        NOT NULL
action_type     text        NOT NULL    -- 'text' | 'call' | 'facetime' | 'coffee' | 'food'
created_at      timestamptz DEFAULT now()
```

### `invites` table
```
id              uuid        PRIMARY KEY DEFAULT gen_random_uuid()
tamago_id       uuid        REFERENCES tamagos(id)
invitee_phone   text        NOT NULL
invite_code     text        NOT NULL UNIQUE
status          text        DEFAULT 'pending'  -- 'pending' | 'accepted'
created_at      timestamptz DEFAULT now()
```

## API Endpoints

### Tamago CRUD
- `POST /api/tamago` — Create a tamago (phone, name) → returns slug
- `GET /api/tamago/{slug}` — Get tamago state (current egg state, dimensions, actions, support count)
- `PUT /api/tamago/{slug}` — Update tamago settings (protagonist only, verified by phone)

### Invites
- `POST /api/tamago/{slug}/invite` — Send invite SMS to a phone number
- `POST /api/invite/{code}/accept` — Accept an invite (subscriber enters their phone)

### Support
- `POST /api/tamago/{slug}/support` — Log a support action (supporter_phone, action_type)
- `GET /api/tamago/{slug}/support` — Get today's support actions

### Feed
- `GET /api/feed?phone={phone}` — Get all tamagos this phone number is subscribed to

### Webhooks
- `POST /webhook/oura` — Oura data webhook (sleep sessions, HRV, stress)
- `POST /webhook/omi` — Omi memory webhook (medication voice logs)

### Health Data
- `POST /api/tamago/{slug}/refresh` — Force refresh from Oura API (called on page load)

## Data Flow

### Oura Data Refresh
1. Supporter visits `/t/sarahs-egg`
2. Frontend calls `POST /api/tamago/sarahs-egg/refresh`
3. Backend fetches latest Oura data via OpenWearables API using stored token
4. Backend computes dimension states (sleep score → green/yellow/red, HRV → green/yellow/red)
5. Stores new `health_snapshot` with raw_data and computed dimensions
6. Returns current tamago state to frontend
7. Frontend renders egg with appropriate visual state

### Oura Webhook (Background Updates)
1. Oura pushes new data event to `POST /webhook/oura`
2. Backend identifies which tamago this Oura account belongs to
3. Fetches full data, computes dimensions, stores snapshot
4. Tamago state is pre-computed for next page load

### Omi Medication Logging
1. Protagonist says "I just took my prenatal vitamin" to Omi
2. Omi sends transcript to `POST /webhook/omi`
3. Backend uses Claude API to extract: medication name, dose, time taken
4. Updates the `meds` dimension in health_snapshots
5. Meds dimension: green if all scheduled meds taken, yellow if partial, red if missed

### Support Action Flow
1. Supporter views tamago, taps "Send Coffee" icon
2. Frontend logs the action via `POST /api/tamago/{slug}/support`
3. For phone-based actions (text, call, FaceTime): browser opens native handler via `sms:`/`tel:`/`facetime:` URI
4. For gift actions (coffee, food): MVP opens pre-filled text message suggesting a DoorDash gift
5. Egg state updates to show flower decoration and support count

## Dimension Computation Logic

### Sleep (from Oura)
```python
def compute_sleep_state(oura_data):
    sleep_score = oura_data.get("sleep", {}).get("score", 0)
    if sleep_score >= 85:
        return "green"
    elif sleep_score >= 60:
        return "yellow"
    else:
        return "red"
```

### Stress (from Oura)
```python
def compute_stress_state(oura_data):
    # Use HRV and stress data from Oura
    hrv = oura_data.get("hrv", {}).get("average", 0)
    stress_level = oura_data.get("stress", {}).get("level", "unknown")
    if stress_level == "low" or hrv > 50:
        return "green"
    elif stress_level == "medium" or hrv > 30:
        return "yellow"
    else:
        return "red"
```

### Medication (from Omi)
```python
def compute_meds_state(logged_meds, scheduled_meds):
    if not scheduled_meds:
        return "green"  # no meds scheduled = not applicable
    taken = len([m for m in scheduled_meds if m["name"] in logged_meds])
    ratio = taken / len(scheduled_meds)
    if ratio >= 0.9:
        return "green"
    elif ratio >= 0.5:
        return "yellow"
    else:
        return "red"
```

### Sleep Detection
```python
def is_currently_sleeping(oura_data):
    # Check if there's an active sleep session with no end time
    current_sleep = oura_data.get("sleep", {}).get("current_session")
    return current_sleep is not None and current_sleep.get("end_time") is None
```

### Overall Egg State
```python
def compute_egg_state(dimensions, is_sleeping, support_count):
    states = [dimensions["sleep"], dimensions["stress"], dimensions["meds"]]
    red_count = states.count("red")
    yellow_count = states.count("yellow")
    
    if red_count >= 2:
        base = "fried"
    elif red_count == 1:
        base = "struggling"
    elif yellow_count >= 1:
        base = "okay"
    else:
        base = "thriving"
    
    # Sleeping and supported are modifiers layered on top of the base state
    has_support = support_count > 0
    return {
        "base": base,
        "is_sleeping": is_sleeping,
        "supported": has_support,
        "support_count": support_count,
    }
```

## Demo Flow (4 minutes)

**Target narrative:** Show the full loop — from data to character to community action to visible impact.

1. **Setup (30s):** "Meet Sarah. She just had a baby 3 weeks ago. Her Oura ring tracks her sleep and stress. Her community wants to help but doesn't know when or how."

2. **Create Tamago (45s):** Quick onboarding — enter phone, name it "Sarah's Egg", connect Oura. Show the tamago page with current egg state based on real Oura data. Walk through the three dimensions.

3. **Invite Community (30s):** Sarah invites her mom and best friend by phone number. They receive a text with a link.

4. **Supporter View (60s):** Switch to the supporter's phone/browser. Show the home feed with Sarah's egg. It's a cracked, struggling egg — sleep is red (she only got 3 hours). Tap into the detail view. Show the contextual actions. Tap "Send Food" — it opens a pre-filled text.

5. **Support Impact (45s):** Switch back to Sarah's tamago. A flower has appeared on the egg. "2 people sent support today." The egg still shows the health reality, but now it's decorated with love.

6. **Sleeping State (30s):** Fast forward — Sarah is napping. The egg now shows ZZZ, indicators are muted. Supporter tries to call — nudge appears: "She's sleeping! Send a text instead."

7. **Close (15s):** "Tamago turns invisible health data into visible community care. You don't need to ask how someone is doing — you can see it. And you always know the right way to help."

## MVP Scope Boundaries

### In Scope
- Oura integration via OpenWearables (sleep score, HRV/stress, sleep detection)
- Omi integration for medication voice logging (optional per-protagonist)
- Egg character with 6 visual states (SVG/CSS illustrated)
- Three health dimensions with green/yellow/red indicators
- Support actions (text, call, FaceTime, coffee, food) with contextual recommendations
- Sleeping state with ZZZ overlay and call protection
- Phone-number-based identity (no passwords)
- Invite-by-phone subscription model
- Home feed for supporters
- Shareable tamago URLs
- Data refresh on page load + Oura webhooks

### Out of Scope (Post-MVP)
- Custom character creation/themes beyond the egg
- CGM, Samsung Health, Apple Health integrations
- Push notifications to supporters
- Historical health trends/charts
- Multiple protagonists per phone number
- Password-based authentication
- Native mobile app (responsive web only for now)
- Configurable dimension thresholds
- DoorDash/Venmo API integration (MVP uses pre-filled text messages)
- Group support coordination ("I'll handle dinner tonight")

## Character Art Direction

The egg character should be:
- **Kawaii/cute** aesthetic inspired by Gudetama and Tamagotchi
- Simple, round egg shape with expressive facial features
- Implemented as **SVG or CSS** for easy state transitions and animations
- States conveyed through: eye shape, mouth expression, cracks, color tint, accessories (flowers, sparkles)
- Sleeping state: closed eyes, subtle breathing animation, floating ZZZ
- The egg sits on a small surface/nest — can be personalized later
- Support decorations (flowers) appear organically, not as UI badges

## Open Wearables Integration Notes

OpenWearables provides standardized access to Oura data. Key endpoints we need:
- Sleep data (score, duration, stages, current session)
- HRV data (daily average, trend)
- Stress data (level, recovery)
- OAuth flow for connecting a ring

We should cache the OAuth token in the `tamagos` table and refresh it as needed. The OpenWearables API handles the Oura-specific auth complexity.

## Error Handling (MVP)

- **Oura disconnected:** Show egg with a "?" overlay and message "Connect your Oura ring to update your tamago"
- **No recent data:** Show last known state with "Last updated X hours ago" timestamp
- **Omi not connected:** Meds dimension shows as grey/N/A, not red
- **Webhook failures:** Log and retry once; page-load refresh acts as fallback
