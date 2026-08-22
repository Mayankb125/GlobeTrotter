# GlobeTrotter — Production Plan (Phased)

**Status:** Draft v1.1 (with sub-phases)
**Last Updated:** August 2026

Each phase has sub-phases you can pick off one at a time. Each sub-phase is a task small enough to finish in one sitting. Don't move to the next phase until the current phase's exit condition is met.

---

## Phase 0: Project Setup (Foundation)

**Goal:** Empty but fully wired skeleton — nothing functional yet, but everything runs.

- **0.1** — Create root repo `GlobeTrotter/` with `backend/`, `frontend/`, `docs/`; init git; add `.gitignore` (Python + Node + env files)
- **0.2** — Create `backend/.env.example` with every backend variable (placeholder values); create real local `backend/.env` (gitignored)
- **0.3** — Create `frontend/.env.example` with `VITE_API_BASE_URL`; create real local `frontend/.env`
- **0.4** — Write `docker-compose.yml` with a Postgres service (+ placeholder backend/frontend service blocks)
- **0.5** — Backend: create `pyproject.toml`/`requirements.txt`, set up virtualenv, install FastAPI/SQLAlchemy/Alembic/Pydantic/etc.
- **0.6** — Backend: create empty `app/main.py` with a `/health` route; confirm it boots with `uvicorn`
- **0.7** — Backend: create all empty folders (`models/`, `schemas/`, `api/v1/`, `services/`, `ai/`, `tests/`) per the architecture doc
- **0.8** — Frontend: scaffold with `npm create vite` (React + TS template)
- **0.9** — Frontend: install Axios, Zustand, Recharts, react-router, react-big-calendar; confirm `npm run dev` shows blank page
- **0.10** — Frontend: create all empty folders (`api/`, `types/`, `pages/`, `components/`, `hooks/`, `store/`, `utils/`, `styles/`) per the architecture doc
- **0.11** — Confirm Postgres container runs and backend can connect (empty DB is fine)
- **0.12** — Write root `README.md` with setup instructions (how to run docker-compose, how to run frontend/backend separately)

**Exit condition:** `docker-compose up` brings up Postgres + a "Hello World" FastAPI backend + a blank React frontend, all talking to each other over the configured ports/URLs.

---

## Phase 1: Migrate & Clean Up Existing AI Code

**Goal:** Old AI-Travel-Planner logic lives inside `backend/app/ai/`, cleaned up, not yet exposed via API.

- **1.1** — Copy `groq_client.py`, `gemini_research.py`, `duckduckgo_client.py`, `calculator.py` into `backend/app/ai/integrations/`
- **1.2** — Move/simplify `llm_prompts.py` → `backend/app/ai/prompts.py`; update imports
- **1.3** — Fix known bug: `MCPGroqAdapter`/Groq `json_mode` param mismatch (or just remove the MCP adapter layer entirely)
- **1.4** — Fix known bug: DuckDuckGo response object iteration (`.get()` on a Pydantic object)
- **1.5** — Write new `backend/app/ai/planner.py` — one function that does research → generate → optimize, replacing the CrewAI/ADK/A2A multi-agent dance
- **1.6** — Delete/archive the old `a2a/`, `agents/`, `mcp_client.py`, `mcp_tool_adapter.py`, `state/store.py` files (move to `docs/legacy/` if you want to keep for reference, don't ship them)
- **1.7** — Write unit tests for `planner.py` with mocked Groq/Gemini responses (no real API calls in tests)
- **1.8** — Manually test `planner.py` via a standalone script with real API keys to confirm it still produces valid itinerary JSON

**Exit condition:** You can call `planner.generate_itinerary(...)` directly from a script/test and get a valid itinerary JSON back, with no DB or API involved yet.

---

## Phase 2: Database Layer

**Goal:** Real schema exists and is migratable.

- **2.1** — Set up `database.py` (SQLAlchemy engine, session factory, declarative Base)
- **2.2** — Write `models/user.py`
- **2.3** — Write `models/city.py` and `models/activity.py` (catalog tables, no FKs to users)
- **2.4** — Write `models/trip.py` (FK to user)
- **2.5** — Write `models/stop.py` (FK to trip, FK to city)
- **2.6** — Write `models/stop_activity.py` (FK to stop, FK to activity)
- **2.7** — Write `models/budget_item.py` (FK to trip)
- **2.8** — Set up Alembic (`alembic init`), configure `env.py` to read models + `DATABASE_URL`
- **2.9** — Generate initial migration, run `alembic upgrade head` against local Postgres, verify tables in psql/DBeaver
- **2.10** — Write seed script (`scripts/seed_data.py`) with a starter set of cities + activities
- **2.11** — Run seed script, confirm data is queryable
- **2.12** — Write model-level tests: create a user/trip/stop and confirm relationships resolve (`trip.stops`, `stop.city`, etc.)

**Exit condition:** Fresh Postgres DB + `alembic upgrade head` produces all tables correctly; seed data is queryable.

---

## Phase 3: Auth

**Goal:** Users can sign up, log in, and every other endpoint can require a valid JWT.

- **3.1** — Write `core/security.py`: password hash/verify (bcrypt), JWT create/decode functions
- **3.2** — Write `schemas/user.py`: `UserCreate`, `UserLogin`, `UserOut` Pydantic models
- **3.3** — Write `POST /auth/signup` — validate email uniqueness, hash password, create user, return JWT
- **3.4** — Write `POST /auth/login` — verify credentials, return JWT
- **3.5** — Write `POST /auth/forgot-password` — stub (console-log a reset token for MVP; real email later)
- **3.6** — Write `get_current_user` FastAPI dependency (decodes JWT from `Authorization` header)
- **3.7** — Protect a throwaway test endpoint with `get_current_user`, confirm 401 without token and 200 with valid token
- **3.8** — Write tests: signup, login, duplicate-email rejection, wrong-password rejection, protected-route access

**Exit condition:** Can sign up, log in, receive a JWT, and hit a protected endpoint successfully with it (and get 401 without it).

---

## Phase 4: Core Trip Backend (Screens 3–8)

**Goal:** Full CRUD for trips, stops, activities, and search — this is the backend heart of the product.

- **4.1** — Write `schemas/trip.py`, `schemas/stop.py`, `schemas/activity.py` (Create/Update/Out variants)
- **4.2** — `POST /trips` — create trip (owner = current user)
- **4.3** — `GET /trips` — list current user's trips
- **4.4** — `GET /trips/{id}` — full nested detail (trip → stops → activities), with ownership check
- **4.5** — `DELETE /trips/{id}` — with ownership check
- **4.6** — `POST /trips/{id}/stops` — add a stop (city + dates)
- **4.7** — `PUT /stops/{id}` — update stop dates
- **4.8** — `PUT /trips/{id}/stops/reorder` — bulk update `order_index`
- **4.9** — `GET /cities?search=` — city search endpoint (name/country ilike match)
- **4.10** — `GET /activities?city_id=&category=` — activity search/filter endpoint
- **4.11** — `POST /stops/{id}/activities` — add activity to a stop (with scheduled_date/time)
- **4.12** — `DELETE /stop-activities/{id}` — remove activity from a stop
- **4.13** — Write tests for every endpoint above (happy path + ownership/auth failure cases)

**Exit condition:** Using only API calls (Postman/curl), you can build a complete multi-city trip with activities end-to-end and retrieve it as one structured response.

---

## Phase 5: Budget Backend (Screen 9)

**Goal:** Cost breakdown is calculated and queryable.

- **5.1** — Write `schemas/budget.py`
- **5.2** — `POST /trips/{id}/budget-items` — manually add a cost line (e.g. flights, stay)
- **5.3** — `DELETE /budget-items/{id}`
- **5.4** — Write `services/budget_service.py`: aggregation logic (sum activity costs by category + manual items)
- **5.5** — `GET /trips/{id}/budget` — returns full breakdown by category + grand total
- **5.6** — (Optional) add `budget_cap` field to trips, return `is_over_budget` flag in the response
- **5.7** — Write tests: budget with only activities, only manual items, mixed, and empty trip (should return zeros not error)

**Exit condition:** `GET /trips/{id}/budget` returns an accurate category breakdown and total for a trip built in Phase 4.

---

## Phase 6: Sharing Backend (Screen 11)

**Goal:** Public, no-auth access to a trip via link, plus copy.

- **6.1** — Write `services/share_service.py`: generate a secure random `share_token`
- **6.2** — `POST /trips/{id}/share` — sets `is_public=true`, generates/returns `share_token`
- **6.3** — `POST /trips/{id}/unshare` — sets `is_public=false`
- **6.4** — `GET /public/{share_token}` — no-auth route, returns read-only nested trip (only if `is_public=true`)
- **6.5** — `POST /public/{share_token}/copy` — requires auth, deep-clones the trip + stops + activities into the requesting user's account
- **6.6** — Write tests: sharing toggle, public fetch of unshared trip returns 404, copy creates a fully independent new trip

**Exit condition:** A logged-out request to a share URL returns the trip; a logged-in different user can copy it into their own account.

---

## Phase 7: AI-Assist Backend (exposes Phase 1's code)

**Goal:** `/ai-assist` endpoint wraps Phase 1's planner and writes results into the real schema.

- **7.1** — Write `schemas/ai_assist.py` (request: preferences/budget/interests; response: generated draft)
- **7.2** — Write `services/ai_assist_service.py`: calls `planner.py`, maps LLM JSON output → real `stops`/`stop_activities`/`budget_items` rows
- **7.3** — `POST /trips/{id}/ai-assist` — runs the service, persists results, returns updated trip detail
- **7.4** — Add graceful degradation: if `GROQ_API_KEY`/`GEMINI_API_KEY` missing or API call fails, return a clean 503-style "AI assist unavailable" response instead of crashing
- **7.5** — Write tests: successful generation (mocked), missing-key graceful failure, malformed-LLM-JSON fallback

**Exit condition:** Calling `/ai-assist` on an empty trip populates it with a real, editable itinerary using existing CRUD data structures.

---

## Phase 8: Frontend — Auth & Shell (Screens 1, 2)

**Goal:** Users can sign up/log in and see a dashboard shell.

- **8.1** — Build `api/client.ts` (Axios instance) + JWT interceptor (attach token, handle 401 → redirect to login)
- **8.2** — Build `store/authStore.ts` (Zustand: token, current user, login/logout actions)
- **8.3** — Build `api/auth.ts` (login, signup, forgotPassword calls)
- **8.4** — Build `LoginPage.tsx` + form validation
- **8.5** — Build `SignupPage.tsx` + form validation
- **8.6** — Build `ForgotPasswordPage.tsx`
- **8.7** — Build `ProtectedRoute.tsx` / `PublicRoute.tsx` wrappers, wire into `router.tsx`
- **8.8** — Build `Navbar.tsx`, base layout shell, `Toast.tsx`/`Spinner.tsx`/`Modal.tsx` common components
- **8.9** — Build static `DashboardPage.tsx` shell (welcome message, "Plan New Trip" button — trip list wired in Phase 9)
- **8.10** — Manual test: signup → auto-login → land on dashboard → refresh page → still logged in

**Exit condition:** Can sign up, log in, get redirected to dashboard, and reload the page without losing auth state.

---

## Phase 9: Frontend — Trip Building (Screens 3–8)

**Goal:** The core product experience — build a trip start to finish in the UI.

- **9.1** — Build `api/trips.ts`, `types/trip.ts`
- **9.2** — Build `CreateTripPage.tsx` (name, dates, description, cover photo)
- **9.3** — Build `TripCard.tsx` + `MyTripsPage.tsx` (list, edit/view/delete actions)
- **9.4** — Wire real trip list into `DashboardPage.tsx` (recent trips)
- **9.5** — Build `api/stops.ts`, `types/stop.ts`
- **9.6** — Build `CitySearchPage.tsx` / `CityResultCard.tsx`, wired to `GET /cities`
- **9.7** — Build `ItineraryBuilderPage.tsx`: "Add Stop" flow (pick city + dates), `StopCard.tsx` list, reorder (drag or up/down buttons)
- **9.8** — Build `api/activities.ts`, `types/activity.ts`
- **9.9** — Build `ActivitySearchPage.tsx` / `ActivityResultCard.tsx` / `FilterBar.tsx`, wired to `GET /activities`
- **9.10** — Wire "add activity to stop" action from search into the builder
- **9.11** — Build `ItineraryViewPage.tsx`: `DayBlock.tsx` + `ActivityRow.tsx`, grouping by day across stops
- **9.12** — Manual test: full flow — create trip → add 2+ stops → add activities to each → view full itinerary

**Exit condition:** A user can go from "Plan New Trip" to a fully built multi-city itinerary entirely through the UI, matching what Phase 4's API supports.

---

## Phase 10: Frontend — Budget, Calendar, Sharing (Screens 9, 10, 11)

**Goal:** Round out the MVP-adjacent visualization/sharing features.

- **10.1** — Build `api/budget.ts`, `types/budget.ts`
- **10.2** — Build `BudgetSummary.tsx` + `BudgetPieChart.tsx` (Recharts), `BudgetBreakdownPage.tsx`
- **10.3** — Build `OverBudgetAlert.tsx` (if budget cap set and exceeded)
- **10.4** — Build `CalendarView.tsx` wrapping react-big-calendar, feed it stop/activity data
- **10.5** — Build `CalendarTimelinePage.tsx`, `ViewModeToggle.tsx` (list vs calendar switch on Itinerary View)
- **10.6** — Build `api/public.ts`
- **10.7** — Build `ShareModal.tsx` (generate link, copy-to-clipboard)
- **10.8** — Build `SharedItineraryPage.tsx` (public route, no auth, read-only render)
- **10.9** — Build `CopyTripButton.tsx`, wire to `POST /public/{token}/copy`
- **10.10** — Manual test: share a trip → open link in incognito → copy trip while logged in as a different user

**Exit condition:** A completed trip shows an accurate budget chart, a working calendar view, and a shareable public link that a logged-out visitor can open.

---

## Phase 11: Frontend — Profile & AI-Assist UI (Screen 12 + AI feature)

**Goal:** Remaining MVP-adjacent screens.

- **11.1** — Build `api/users.ts`
- **11.2** — Build `ProfileSettingsPage.tsx` (edit name/photo/email, delete account with confirmation)
- **11.3** — Build `api/aiAssist.ts`
- **11.4** — Build `AiSuggestButton.tsx` (loading state, calls `/ai-assist`)
- **11.5** — Build AI result preview inside `ItineraryBuilderPage.tsx` (show generated draft, allow accept/discard/edit)
- **11.6** — Handle "AI unavailable" response gracefully in UI (clear message, doesn't block manual building)
- **11.7** — Manual test: AI-assist on empty trip populates a draft; user can then manually edit it same as any other trip

**Exit condition:** Profile edits persist; AI-assist button populates a draft itinerary the user can then edit manually.

---

## Phase 12: Testing, Hardening, Polish

**Goal:** MVP is stable, not just feature-complete.

- **12.1** — Backend: fill test coverage gaps across auth, trips, budget, sharing, ai-assist
- **12.2** — Frontend: smoke tests on core flows (signup → build trip → share) using React Testing Library or Playwright
- **12.3** — Add loading states to every page that fetches data
- **12.4** — Add empty states (no trips yet, no search results, etc.)
- **12.5** — Add error states (API failure, network error) with retry option where sensible
- **12.6** — CORS review — confirm only intended origins allowed
- **12.7** — Rate-limit `/auth/*` and `/ai-assist` endpoints
- **12.8** — File upload validation (size/type limits) for cover/profile photos
- **12.9** — Full manual QA pass through all 13 screens as a real user would use them
- **12.10** — Fix bugs found in QA pass

**Exit condition:** No known crash paths in the core flow; test suite passes in CI.

---

## Phase 13: Deployment

**Goal:** Live, accessible product.

- **13.1** — Write production `Dockerfile` for backend
- **13.2** — Write production `Dockerfile` (or static build) for frontend
- **13.3** — Set up CI pipeline: run tests on every PR
- **13.4** — Set up CD pipeline: deploy to staging on merge to main
- **13.5** — Provision staging environment (hosted Postgres, backend host, frontend host)
- **13.6** — Set staging `.env` values via secrets manager, smoke-test staging
- **13.7** — Provision production environment, set production secrets
- **13.8** — Point domain + HTTPS at production
- **13.9** — Set up basic monitoring/logging/error alerting (e.g. Sentry, uptime check)
- **13.10** — Deploy to production, final smoke test on live URL

**Exit condition:** GlobeTrotter is live at a real URL, fully functional end-to-end.

---

## Phase 14 (Post-MVP): Nice-to-Haves

Only after Phase 13 ships and the core flow is validated:

- **14.1** — Admin/Analytics Dashboard (Screen 13)
- **14.2** — Social sharing buttons on shared itinerary page
- **14.3** — Saved destinations/wishlist feature
- **14.4** — Multi-language support
- **14.5** — Metric-driven improvements based on real usage data (see PRD success metrics)

---

## Summary Table

| Phase | Focus | Depends on |
|---|---|---|
| 0 | Setup: folders, env, docker, empty apps | — |
| 1 | Migrate & clean AI code | 0 |
| 2 | Database schema + migrations | 0 |
| 3 | Auth | 2 |
| 4 | Core trip/stop/activity backend | 2, 3 |
| 5 | Budget backend | 4 |
| 6 | Sharing backend | 4 |
| 7 | AI-assist backend | 1, 4 |
| 8 | Frontend auth & shell | 3 |
| 9 | Frontend trip building | 4, 8 |
| 10 | Frontend budget/calendar/sharing | 5, 6, 9 |
| 11 | Frontend profile & AI-assist UI | 7, 9 |
| 12 | Testing & hardening | all above |
| 13 | Deployment | 12 |
| 14 | Post-MVP nice-to-haves | 13 |
