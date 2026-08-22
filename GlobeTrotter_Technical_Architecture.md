# Technical Architecture Document: GlobeTrotter

**Status:** Draft v1.0
**Owner:** Engineering
**Last Updated:** August 2026

---

## 1. Recommended Tech Stack (with reasoning)

### Backend

| Choice | Reasoning |
|---|---|
| **Python 3.11+** | Team already has working Python code (AI research/generation logic) to reuse; mature ecosystem for both web APIs and AI/LLM integration. |
| **FastAPI** | Async-native (important since AI calls to Groq/Gemini are I/O-bound and slow — async prevents blocking), automatic OpenAPI docs (`/docs`), native Pydantic integration for request/response validation, minimal boilerplate vs Django. |
| **PostgreSQL** | Trip data is inherently relational (users → trips → stops → activities, with joins for budgets and search). Postgres gives ACID guarantees, strong indexing/full-text search for city/activity search, and is the industry-standard choice for this shape of data. |
| **SQLAlchemy (ORM)** | Type-safe, mature, works cleanly with FastAPI + Pydantic; avoids hand-writing SQL for CRUD-heavy operations. |
| **Alembic** | Schema will evolve (adding fields, tables) — need versioned, reversible migrations rather than manual DB edits. |
| **Pydantic v2** | Already used in the existing codebase; validates all API request/response bodies. |
| **JWT (python-jose) + bcrypt (passlib)** | Stateless auth — no session storage needed, scales horizontally without sticky sessions. bcrypt is the standard for password hashing (adaptive cost, salted). |
| **Uvicorn** | ASGI server required to run FastAPI async app in production. |

### Frontend

| Choice | Reasoning |
|---|---|
| **React + TypeScript** | Component-driven UI fits GlobeTrotter's screen-based structure (13 distinct pages); TypeScript catches API-contract mismatches at compile time, valuable when frontend/backend evolve independently. |
| **Vite** | Fast dev server and build times vs. older tooling (CRA); minimal config needed. |
| **Recharts** | Budget breakdown needs pie/bar charts (PRD requirement); Recharts is React-native, simple API, good enough for this scope (no need for D3 complexity). |
| **react-big-calendar** (or FullCalendar) | Calendar/timeline screen requires drag-to-reorder and day-view rendering — purpose-built library beats hand-rolling this. |
| **Axios** | Simple, consistent API client with interceptors (attach JWT to every request, handle 401 refresh centrally). |
| **Zustand** (lightweight state) | Auth state + in-progress trip state needs to be shared across pages without prop-drilling; Zustand is simpler than Redux for this scope (no complex middleware needs). |

### AI / LLM Layer (optional feature, not core path)

| Choice | Reasoning |
|---|---|
| **Groq (Llama 3.3 70B)** | Fast inference for itinerary-generation JSON output; already integrated in the reused codebase. |
| **Google Gemini 2.0 Flash** | Used for destination research (weather, attractions, costs) — cheap, fast, good at structured JSON output. |
| **DuckDuckGo Search** | No-API-key web search fallback for supplementary travel info. |

This layer sits behind a single `/ai-assist` endpoint — it's isolated so it can be disabled, swapped, or rate-limited without touching core trip-building logic.

### Infra

| Choice | Reasoning |
|---|---|
| **Docker + docker-compose** | Consistent dev/prod environment; spins up backend + Postgres + frontend with one command; easy to hand off to any teammate. |
| **Local disk storage (v1)** | Simplest path for cover photos/profile photos with no extra vendor account; swappable for S3-compatible storage later via an abstracted storage service. |

---

## 2. Complete Folder Structure

```
GlobeTrotter/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── docs/
│   ├── architecture.md
│   ├── er-diagram.png
│   ├── api-spec.md
│   └── legacy/                        # old project docs kept for reference
│
├── backend/
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── .env.example
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   └── app/
│       ├── main.py                    # FastAPI entrypoint, CORS, router registration
│       │
│       ├── core/
│       │   ├── config.py              # env-based settings (Pydantic BaseSettings)
│       │   ├── security.py            # JWT create/verify, password hash/verify
│       │   └── database.py            # SQLAlchemy engine, session, Base
│       │
│       ├── models/                    # SQLAlchemy ORM classes (1 file per table)
│       │   ├── user.py
│       │   ├── trip.py
│       │   ├── stop.py
│       │   ├── city.py
│       │   ├── activity.py
│       │   ├── stop_activity.py
│       │   └── budget_item.py
│       │
│       ├── schemas/                   # Pydantic request/response DTOs
│       │   ├── user.py
│       │   ├── trip.py
│       │   ├── stop.py
│       │   ├── activity.py
│       │   └── budget.py
│       │
│       ├── api/v1/
│       │   ├── auth.py
│       │   ├── trips.py
│       │   ├── itinerary.py
│       │   ├── cities.py
│       │   ├── activities.py
│       │   ├── budget.py
│       │   ├── public.py              # shared/public itinerary routes
│       │   ├── users.py
│       │   └── ai_assist.py
│       │
│       ├── services/                  # business logic, called by routes
│       │   ├── trip_service.py
│       │   ├── budget_service.py
│       │   ├── share_service.py
│       │   └── ai_assist_service.py
│       │
│       ├── ai/                        # reused/cleaned-up AI engine
│       │   ├── integrations/
│       │   │   ├── groq_client.py
│       │   │   ├── gemini_research.py
│       │   │   └── duckduckgo_client.py
│       │   ├── prompts.py
│       │   └── planner.py
│       │
│       └── tests/
│           ├── test_auth.py
│           ├── test_trips.py
│           ├── test_itinerary.py
│           └── test_ai_assist.py
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── .env.example
    ├── .eslintrc.cjs
    ├── .prettierrc
    │
    ├── public/
    │   └── favicon.ico
    │
    └── src/
        ├── main.tsx                       # app entry, mounts <App /> + providers
        ├── App.tsx                        # top-level router
        ├── vite-env.d.ts
        │
        ├── routes/
        │   ├── router.tsx                 # route definitions (react-router)
        │   ├── ProtectedRoute.tsx         # redirects to /login if not authed
        │   └── PublicRoute.tsx            # for /login, /signup, /share/:token
        │
        ├── api/                           # thin HTTP layer, 1 file per resource
        │   ├── client.ts                  # axios instance, JWT interceptor, base URL
        │   ├── auth.ts                    # login, signup, forgotPassword
        │   ├── trips.ts                   # createTrip, getTrips, getTrip, deleteTrip
        │   ├── stops.ts                   # addStop, updateStop, reorderStops
        │   ├── cities.ts                  # searchCities
        │   ├── activities.ts              # searchActivities, addActivityToStop
        │   ├── budget.ts                  # getBudgetBreakdown, addBudgetItem
        │   ├── public.ts                  # getSharedTrip, copyTrip
        │   ├── users.ts                   # getProfile, updateProfile, deleteAccount
        │   └── aiAssist.ts                # requestAiSuggestion
        │
        ├── types/                         # TS interfaces mirroring backend Pydantic schemas
        │   ├── user.ts
        │   ├── trip.ts
        │   ├── stop.ts
        │   ├── city.ts
        │   ├── activity.ts
        │   ├── budget.ts
        │   └── api.ts                     # generic ApiResponse<T>, ApiError types
        │
        ├── pages/                         # 1:1 with the 13 PDF screens
        │   ├── auth/
        │   │   ├── LoginPage.tsx           # Screen 1
        │   │   ├── SignupPage.tsx          # Screen 1
        │   │   └── ForgotPasswordPage.tsx  # Screen 1
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx       # Screen 2
        │   ├── trips/
        │   │   ├── CreateTripPage.tsx      # Screen 3
        │   │   ├── MyTripsPage.tsx         # Screen 4
        │   │   ├── ItineraryBuilderPage.tsx# Screen 5
        │   │   └── ItineraryViewPage.tsx   # Screen 6
        │   ├── search/
        │   │   ├── CitySearchPage.tsx      # Screen 7
        │   │   └── ActivitySearchPage.tsx  # Screen 8
        │   ├── budget/
        │   │   └── BudgetBreakdownPage.tsx # Screen 9
        │   ├── calendar/
        │   │   └── CalendarTimelinePage.tsx# Screen 10
        │   ├── shared/
        │   │   └── SharedItineraryPage.tsx # Screen 11 (public, no auth)
        │   ├── profile/
        │   │   └── ProfileSettingsPage.tsx # Screen 12
        │   └── admin/
        │       └── AdminDashboardPage.tsx  # Screen 13 (optional/post-MVP)
        │
        ├── components/
        │   ├── common/                     # generic, reused everywhere
        │   │   ├── Button.tsx
        │   │   ├── Input.tsx
        │   │   ├── Modal.tsx
        │   │   ├── Spinner.tsx
        │   │   ├── Toast.tsx
        │   │   ├── EmptyState.tsx
        │   │   └── Navbar.tsx
        │   ├── trips/
        │   │   ├── TripCard.tsx            # used in My Trips + Dashboard
        │   │   ├── TripForm.tsx            # used in Create Trip
        │   │   └── StopCard.tsx            # a single stop in the builder
        │   ├── itinerary/
        │   │   ├── DayBlock.tsx            # groups activities by day
        │   │   ├── ActivityRow.tsx         # single activity within a day
        │   │   └── ViewModeToggle.tsx      # list vs calendar switch
        │   ├── search/
        │   │   ├── CityResultCard.tsx
        │   │   ├── ActivityResultCard.tsx
        │   │   └── FilterBar.tsx
        │   ├── budget/
        │   │   ├── BudgetSummary.tsx
        │   │   ├── BudgetPieChart.tsx      # Recharts
        │   │   └── OverBudgetAlert.tsx
        │   ├── calendar/
        │   │   └── CalendarView.tsx        # wraps react-big-calendar
        │   ├── share/
        │   │   ├── ShareModal.tsx          # generates/copies public link
        │   │   └── CopyTripButton.tsx
        │   └── ai/
        │       └── AiSuggestButton.tsx     # optional AI-assist trigger + result preview
        │
        ├── hooks/
        │   ├── useAuth.ts                  # current user, login/logout helpers
        │   ├── useTrips.ts                 # fetch/cache trip list
        │   ├── useTripDetail.ts            # fetch single trip + stops + activities
        │   ├── useBudget.ts
        │   └── useDebounce.ts              # for search inputs
        │
        ├── store/                          # Zustand stores
        │   ├── authStore.ts                # JWT token, current user, isAuthenticated
        │   ├── tripBuilderStore.ts         # in-progress trip being built (draft state)
        │   └── uiStore.ts                  # toasts, modals, global loading
        │
        ├── utils/
        │   ├── dateHelpers.ts              # format/compare trip & stop dates
        │   ├── currencyHelpers.ts          # format budget numbers
        │   └── validators.ts               # form validation (email, password strength)
        │
        ├── styles/
        │   ├── globals.css
        │   └── theme.ts                    # colors, spacing tokens
        │
        └── assets/
            ├── icons/
            └── images/
```

---

## 3. Database Schema (plain-English explanation)

### `users`
Stores every account. One row per person who signs up.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| email | string, unique | login identifier |
| password_hash | string | bcrypt hash, never plaintext |
| profile_photo_url | string, nullable | |
| created_at / updated_at | timestamp | |

### `trips`
One row per trip a user creates. This is the top-level container — everything else (stops, budget) belongs to a trip.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | owner of the trip |
| name | string | e.g. "Europe Summer 2026" |
| description | text, nullable | |
| start_date / end_date | date | overall trip window |
| cover_photo_url | string, nullable | |
| is_public | boolean, default false | controls whether share link works |
| share_token | string, unique, nullable | random token used in public share URL |
| created_at / updated_at | timestamp | |

**Relationship:** one user → many trips.

### `cities`
A reference/catalog table of destinations that can be added as stops. Populated independently of any user's trip (seed data or curated).

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| country | string | |
| region | string, nullable | e.g. "Southeast Asia" |
| cost_index | numeric, nullable | relative cost-of-travel score, used in search/filter |
| popularity_score | numeric, nullable | used for "recommended destinations" |
| image_url | string, nullable | |

### `stops`
A stop is "this city, for these dates, within this trip." A trip with 3 cities has 3 stop rows. This is what makes the trip multi-city.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| trip_id | UUID (FK → trips.id) | |
| city_id | UUID (FK → cities.id) | |
| start_date / end_date | date | this city's window within the trip |
| order_index | integer | controls stop ordering (drag-to-reorder) |
| created_at | timestamp | |

**Relationship:** one trip → many stops; one city → can appear in many stops (across different trips/users).

### `activities`
A reference/catalog table of things to do, scoped to a city (sightseeing, food tours, adventure activities). Also seed/curated data, browsable independent of any trip.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| city_id | UUID (FK → cities.id) | which city this activity belongs to |
| name | string | |
| description | text, nullable | |
| category | string | e.g. "sightseeing", "food", "adventure" — used for filters |
| cost_estimate | numeric | baseline cost used in budget calculations |
| duration_minutes | integer, nullable | |
| image_url | string, nullable | |

### `stop_activities` (join table)
Represents "this specific activity was added to this specific stop, on this date/time." This is what turns a generic catalog activity into part of a real itinerary.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| stop_id | UUID (FK → stops.id) | |
| activity_id | UUID (FK → activities.id) | |
| scheduled_date | date, nullable | which day within the stop |
| scheduled_time | time, nullable | |
| cost_override | numeric, nullable | if user edits the cost from the catalog default |
| notes | text, nullable | |
| order_index | integer | ordering within the day |

**Relationship:** many-to-many between stops and activities, resolved through this table (one activity can be used across many stops/trips; one stop can have many activities).

### `budget_items`
Line-item costs for a trip, grouped by category, used to render the cost-breakdown screen and charts. Can be auto-calculated from `stop_activities` costs plus manually-added items (e.g. flights, accommodation) that aren't tied to a specific activity.

| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| trip_id | UUID (FK → trips.id) | |
| category | enum | `transport`, `stay`, `activities`, `food`, `misc` |
| amount | numeric | |
| currency | string | default from user/trip settings |
| description | string, nullable | |
| created_at | timestamp | |

**Relationship:** one trip → many budget items. Total trip cost = sum of all budget_items for that trip.

### Entity relationship summary (plain English)

- A **user** owns many **trips**.
- A **trip** is made of many **stops**, each stop pointing to one **city**.
- **Cities** and **activities** are shared catalog data — not owned by any one user, reusable across all trips.
- A **stop** collects many **activities** through `stop_activities`, which is also where trip-specific scheduling and cost overrides live.
- A **trip** has many **budget_items**, which is how the cost-breakdown/chart screens get their numbers — either derived from activities or entered manually.
- Sharing is handled via a `share_token` directly on the `trips` table rather than a separate table — simplest structure for a single public link per trip.

---

## 4. Environment Variables / Configuration

### Backend (`backend/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string, e.g. `postgresql+asyncpg://user:pass@localhost:5432/globetrotter` |
| `SECRET_KEY` | Used to sign JWTs — must be long, random, never committed |
| `JWT_ALGORITHM` | e.g. `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry window |
| `GROQ_API_KEY` | For AI-assist itinerary generation (optional feature — app must degrade gracefully if unset) |
| `GEMINI_API_KEY` | For AI-assist destination research |
| `UPLOAD_DIR` | Local path for storing cover/profile photos (v1) |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `APP_ENV` | `development` / `staging` / `production` |
| `LOG_LEVEL` | e.g. `INFO` |
| `FRONTEND_URL` | Used to build public share links (`{FRONTEND_URL}/share/{token}`) |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API root, e.g. `http://localhost:8000/api/v1` |

### Things to decide/be aware of before building

- **Secrets management:** `.env` files must be gitignored; use different values per environment (dev/staging/prod), never share prod `GROQ_API_KEY`/`SECRET_KEY` in code or docs.
- **AI keys are optional at the infra level** — the app should not crash if `GROQ_API_KEY`/`GEMINI_API_KEY` are missing; the `/ai-assist` endpoint should simply return a clear "AI assist unavailable" response instead.
- **Database migrations must run before first boot** — `alembic upgrade head` as a required setup/deploy step.
- **CORS must explicitly list the frontend origin** — FastAPI blocks cross-origin requests by default; misconfiguration here is the most common local-dev blocker.
- **File upload size limits** should be set (both at FastAPI and any reverse proxy level) before allowing cover/profile photo uploads, to avoid abuse.
