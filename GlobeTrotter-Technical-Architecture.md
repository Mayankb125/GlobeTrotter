# Technical Architecture Document: GlobeTrotter

**Version:** 1.1
**Status:** Draft for Build
**Owner:** [Your Name] — Engineering
**Last Updated:** August 22, 2026
**Companion doc:** PRD.md

---

## 1. Architecture Overview

GlobeTrotter is a standard **three-tier web application**: a React SPA frontend, a REST API backend, and a relational database. There is no AI/agent layer, no microservices, and no real-time infrastructure in v1 — the problem doesn't call for that complexity, and an early-stage/hackathon timeline doesn't afford it.

```
┌─────────────────┐       HTTPS/JSON        ┌──────────────────┐       SQL        ┌──────────────┐
│    frontend/     │ ───────────────────────▶│    backend/       │ ────────────────▶│  PostgreSQL   │
│  React + Vite     │◀─────────────────────── │  Node/Express API │◀──────────────────│               │
└─────────────────┘                          └──────────────────┘                  └──────────────┘
        │                                              │
        │                                              │
   Static hosting                                 JWT auth middleware
   (Vercel/Netlify)                                Object storage (S3/Cloudinary)
                                                    for cover photos/images
```

**Guiding principles for this stack:**
- Boring, well-documented technology over novel tooling — this is a CRUD-heavy product; the risk is in scope and data modeling, not in tech novelty.
- One language (TypeScript) across `frontend/` and `backend/` to reduce context-switching for a small team.
- A single relational database as the source of truth — no premature polyglot persistence.
- `frontend/` and `backend/` are independently deployable apps, not a tightly coupled monorepo — simpler to reason about, simpler to hand off pieces to different team members.

---

## 2. Recommended Tech Stack (with reasoning)

### 2.1 Frontend (`frontend/`)

| Choice | Reasoning |
|---|---|
| **React 18 + TypeScript** | Largest ecosystem, easiest to hire/collaborate for, and TypeScript catches shape mismatches between your API and UI early — valuable given how much of this app is nested data (trips → stops → activities). |
| **Vite** (build tool) | Far faster dev server and build times than CRA/Webpack; zero-config TS + React support. |
| **React Router** | Standard client-side routing for the ~13 screens (dashboard, builder, share view, etc.). |
| **TanStack Query (React Query)** | Handles server-state (fetching trips, cities, activities) with caching, loading/error states, and automatic refetching — avoids hand-rolling `useEffect` fetch logic across every screen. |
| **Tailwind CSS** | Fast to build consistent UI without writing custom CSS per screen; good fit for a small team shipping many screens quickly. |
| **React Hook Form + Zod** | Form handling (signup, create trip, add activity) with schema validation. |
| **Recharts** | Budget breakdown pie/bar charts — lightweight, React-native charting. |

### 2.2 Backend (`backend/`)

| Choice | Reasoning |
|---|---|
| **Node.js + Express + TypeScript** | Same language as the frontend, mature ecosystem, simple mental model for a REST CRUD API. Express avoids the overhead of a heavier framework (NestJS) that isn't justified at this scale. |
| **Prisma ORM** | Type-safe database access generated directly from your schema — critical because the data model (trips/stops/activities/costs) is relational and nested; Prisma's type generation prevents a whole class of bugs and makes migrations straightforward. |
| **Zod** | Validates request bodies server-side; same library used in frontend forms so validation rules aren't duplicated in two different syntaxes. |
| **JWT (jsonwebtoken) + bcrypt** | Stateless auth appropriate for a SPA + REST API; bcrypt for password hashing is the industry default. |
| **express-rate-limit** | Basic protection on auth endpoints (login/signup) against brute force — cheap to add, meaningfully reduces risk. |

### 2.3 Database

| Choice | Reasoning |
|---|---|
| **PostgreSQL** | The problem statement explicitly requires "proper use of relational databases" with clearly related entities (users → trips → stops → activities → costs). Postgres is the standard choice: strong relational integrity, JSON column support if flexible fields are needed later, free tier on every major host. |
| **Managed hosting (Neon, Supabase, or Railway Postgres)** | Removes the need to self-manage backups/scaling during early stage. |

### 2.4 Storage

| Choice | Reasoning |
|---|---|
| **Cloudinary or AWS S3** | For trip cover photos and activity images. Don't store binary image data in Postgres — store a URL reference; keeps the database fast and backups small. |

### 2.5 Hosting/Infra

| Layer | Recommendation | Reasoning |
|---|---|---|
| `frontend/` | Vercel or Netlify | Zero-config static/SPA hosting, free tier, instant preview deploys per branch. |
| `backend/` | Railway or Render | Simple git-push deploys for a Node API, free/cheap tier, built-in Postgres add-on if you want infra co-located. |
| Database | Same provider as backend, or Neon/Supabase | Co-locating DB with backend host reduces latency and setup complexity. |

### 2.6 What I'm deliberately NOT recommending (and why)

- **No GraphQL** — REST is simpler to reason about for a CRUD app of this size.
- **No NestJS/heavier backend framework** — Express is sufficient at ~13 screens and a handful of resources.
- **No MongoDB/NoSQL** — the data is inherently relational; forcing it into documents fights the natural shape of the data and contradicts the problem statement's DB requirement.
- **No microservices** — one deployable API is correct at this stage.
- **No real-time (WebSockets)** — nothing in the product requires live updates between users; refetch-on-navigation (via React Query) is sufficient.
- **No AI/agent layer** — confirmed against the problem statement: this is a search/CRUD product over a curated dataset, not a generative one.

---

## 3. Project Structure

```
globetrotter/
│
├── frontend/                     # React app
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx               # Route definitions
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CreateTripPage.tsx
│   │   │   ├── MyTripsPage.tsx
│   │   │   ├── ItineraryBuilderPage.tsx
│   │   │   ├── ItineraryViewPage.tsx
│   │   │   ├── CitySearchPage.tsx
│   │   │   ├── ActivitySearchPage.tsx
│   │   │   ├── BudgetPage.tsx
│   │   │   ├── CalendarPage.tsx
│   │   │   ├── PublicTripPage.tsx
│   │   │   ├── ProfilePage.tsx           # nice-to-have
│   │   │   └── AdminDashboardPage.tsx    # nice-to-have
│   │   ├── components/
│   │   │   ├── ui/                # Buttons, inputs, cards (design-system primitives)
│   │   │   ├── trip/              # TripCard, TripDatePicker
│   │   │   ├── itinerary/         # StopBlock, ActivityBlock, DayColumn
│   │   │   └── budget/            # CostBreakdownChart
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useTrips.ts        # React Query hooks wrapping API calls
│   │   │   ├── useCities.ts
│   │   │   └── useActivities.ts
│   │   ├── api/
│   │   │   └── client.ts          # Axios/fetch instance, base URL, interceptors
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── styles/
│   │       └── globals.css
│   ├── public/
│   ├── index.html
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                       # Node/Express API
│   ├── src/
│   │   ├── index.ts               # App entrypoint
│   │   ├── app.ts                 # Express app setup, middleware registration
│   │   ├── config/
│   │   │   └── env.ts             # Validated environment config (Zod-parsed)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── auth.schema.ts
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.routes.ts
│   │   │   ├── trips/
│   │   │   │   ├── trips.controller.ts
│   │   │   │   ├── trips.service.ts
│   │   │   │   ├── trips.routes.ts
│   │   │   │   └── trips.schema.ts
│   │   │   ├── stops/
│   │   │   │   ├── stops.controller.ts
│   │   │   │   ├── stops.service.ts
│   │   │   │   └── stops.routes.ts
│   │   │   ├── activities/
│   │   │   │   ├── activities.controller.ts
│   │   │   │   ├── activities.service.ts
│   │   │   │   └── activities.routes.ts
│   │   │   ├── cities/
│   │   │   │   ├── cities.controller.ts   # Search/filter endpoints
│   │   │   │   └── cities.routes.ts
│   │   │   ├── budget/
│   │   │   │   ├── budget.service.ts       # Cost aggregation logic
│   │   │   │   └── budget.routes.ts
│   │   │   └── sharing/
│   │   │       ├── sharing.controller.ts   # Public trip view + copy-trip
│   │   │       └── sharing.routes.ts
│   │   ├── db/
│   │   │   └── prisma.ts           # Prisma client singleton
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── jwt.ts
│   ├── prisma/
│   │   ├── schema.prisma            # Full DB schema (see Section 4)
│   │   ├── seed.ts                  # Seeds cities + activities dataset
│   │   └── migrations/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                            # All project documentation
│   ├── PRD.md
│   ├── Technical-Architecture.md
│   ├── API-reference.md
│   └── db-schema-diagram.png
│
├── shared/                          # Types & validation schemas shared by frontend & backend
│   ├── types/
│   │   ├── trip.types.ts
│   │   ├── city.types.ts
│   │   └── activity.types.ts
│   └── schemas/
│       ├── trip.schema.ts
│       └── auth.schema.ts
│
├── .gitignore
├── .env.example
└── README.md
```

*Rationale:* `frontend/` and `backend/` are fully separate, independently runnable apps — the simplest possible split for a small team, no workspace tooling required. `docs/` centralizes every planning artifact (PRD, this document, API reference) so they live with the code, not scattered across Google Docs. `shared/` is optional — only worth wiring up (via a local package link or simple copy-paste discipline) if you want frontend and backend to agree on TypeScript types/Zod schemas without duplicating them; skip it if that adds friction early on.

Within `backend/src/modules/`, each resource (auth, trips, stops, activities, cities, budget, sharing) keeps its controller/service/routes together — with only ~8 resources, this is easier to navigate than splitting by type (`/controllers`, `/services` at the root).

---

## 4. Database Schema

Postgres, managed via Prisma migrations (`backend/prisma/schema.prisma`). Explained in plain English first, then as a reference table list.

### 4.1 Plain-English explanation of the model

- A **User** signs up and owns zero or more **Trips**.
- A **Trip** belongs to exactly one User, has a name, start/end date, description, and optional cover photo. A Trip is made up of an ordered list of **Stops**.
- A **Stop** represents one city visited during a trip — it references a **City** from the catalog, has its own arrival/departure dates within the trip's overall range, and an order/position (for sequencing multi-city trips). A Stop has zero or more **Trip Activities**.
- A **City** is a catalog entity, pre-seeded by the team — name, country, a cost index (relative expensiveness), and a popularity score used for sorting search results. Cities are reused across many trips/stops; they're never created by end users in v1.
- An **Activity** is also a catalog entity, pre-seeded — a thing to do (a tour, a museum visit, a food experience), tagged with a type/category, a base cost, a duration, and which City it belongs to (activities are city-specific).
- A **TripActivity** is the join between a Stop and an Activity — it represents "this specific activity was added to this specific stop of this specific trip," along with the scheduled date/time and the price locked in at the time of adding (so later catalog price changes don't retroactively change a user's already-built trip budget).
- A **SharedTrip** record is created when a user publishes their trip publicly — it stores a unique share token/slug and visibility state, decoupled from the Trip itself so a trip can be un-shared without deleting trip data.

This gives a clean chain: **User → Trip → Stop → TripActivity ← Activity**, with **City** referenced by both Stop (which city) and Activity (which city it's available in).

### 4.2 Tables

**`users`**
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| email | string, unique | |
| password_hash | string | bcrypt hash, never store plaintext |
| name | string | |
| avatar_url | string, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**`trips`**
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | Owner of the trip |
| name | string | |
| description | text, nullable | |
| start_date | date | |
| end_date | date | |
| cover_photo_url | string, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**`cities`** *(pre-seeded catalog)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | string | |
| country | string | |
| cost_index | decimal | Relative daily cost estimate, used in budget calc |
| popularity_score | integer | Used to sort/rank search results |
| image_url | string, nullable | |
| created_at | timestamp | |

**`stops`**
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| trip_id | UUID (FK → trips.id) | |
| city_id | UUID (FK → cities.id) | |
| arrival_date | date | |
| departure_date | date | |
| order_index | integer | Position of this city within the trip sequence |
| created_at | timestamp | |

**`activities`** *(pre-seeded catalog)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| city_id | UUID (FK → cities.id) | Activity is scoped to a specific city |
| name | string | |
| description | text | |
| category | enum (`sightseeing`, `food`, `adventure`, `culture`, `nightlife`, `other`) | |
| base_cost | decimal | |
| duration_minutes | integer | |
| image_url | string, nullable | |
| created_at | timestamp | |

**`trip_activities`** *(join table: activities added to a specific stop)*
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| stop_id | UUID (FK → stops.id) | |
| activity_id | UUID (FK → activities.id) | |
| scheduled_date | date | Which day of the trip |
| scheduled_time | time, nullable | |
| price_at_time_of_add | decimal | Snapshot of `activities.base_cost` at the time it was added |
| created_at | timestamp | |

**`shared_trips`**
| Field | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| trip_id | UUID (FK → trips.id, unique) | One share record per trip |
| share_token | string, unique | Used in the public URL, e.g. `/share/:share_token` |
| is_public | boolean | Toggle sharing on/off without deleting the record |
| created_at | timestamp | |

### 4.3 Relationships summary

- `users` 1 → many `trips`
- `trips` 1 → many `stops`
- `cities` 1 → many `stops`
- `cities` 1 → many `activities`
- `stops` 1 → many `trip_activities`
- `activities` 1 → many `trip_activities`
- `trips` 1 → 1 `shared_trips` (nullable — only exists once a trip is shared)

### 4.4 Indexing notes
- Index `trips.user_id` (every dashboard/my-trips query filters by owner).
- Index `stops.trip_id` and `trip_activities.stop_id` (itinerary builder loads nested by trip → stops → activities constantly).
- Index `cities.name` and `activities.name` (or a full-text index) to support search performance.
- Unique index on `shared_trips.share_token` (lookup path for public view).

---

## 5. Environment Variables & Configuration

Each app manages its own env file: `frontend/.env` and `backend/.env`. Never commit real values — commit only `.env.example` at the repo root.

### 5.1 Backend (`backend/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` / `production` | Controls logging verbosity, error detail exposure |
| `PORT` | Yes | `4000` | API server port |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/globetrotter` | Prisma connection string |
| `JWT_SECRET` | Yes | (32+ char random string) | Signs auth tokens — must be long/random, never reused across environments |
| `JWT_EXPIRES_IN` | Yes | `7d` | Token lifetime |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Password hashing cost factor |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` (dev) / prod frontend URL | Restrict which origins can call the API |
| `STORAGE_PROVIDER` | Yes | `cloudinary` or `s3` | Which image storage backend is active |
| `CLOUDINARY_URL` or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_S3_BUCKET` | Yes (one set) | — | Image upload credentials, depending on chosen provider |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) | Auth endpoint rate limiting window |
| `RATE_LIMIT_MAX_REQUESTS` | No | `10` | Max requests per window on auth routes |
| `LOG_LEVEL` | No | `info` | Logging verbosity |

### 5.2 Frontend (`frontend/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:4000/api` (dev) / prod API URL | Base URL the frontend calls |
| `VITE_APP_ENV` | No | `development` | Used for conditional dev-only UI (e.g., debug banners) |

### 5.3 Things to decide/lock down before writing code

- **Secrets management:** for local dev, `.env` files are fine; for production, use your host's secret manager (Railway/Render/Vercel all have built-in encrypted env var storage) — never hardcode secrets in code or commit them.
- **JWT secret rotation policy:** decide now whether you'll support rotating `JWT_SECRET` — for v1, a single static secret per environment is acceptable.
- **CORS origin list:** must be updated the moment you have a real production frontend domain, or all API calls from production will fail silently with CORS errors.
- **Database connection pooling:** if deploying to a serverless-style host, configure Prisma's connection pooling (e.g., via PgBouncer or your provider's pooled connection string) — direct connections can exhaust Postgres's connection limit under load.
- **Seed data ownership:** decide who runs `backend/prisma/seed.ts` and when — this populates `cities` and `activities` and must run once per environment before the app is usable (search screens will be empty otherwise).

---

## 6. API Surface (high-level, for reference)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Authenticate, return JWT |
| POST | `/api/auth/forgot-password` | Trigger reset flow |
| GET | `/api/trips` | List current user's trips |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/:id` | Get single trip with stops/activities |
| PATCH | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| POST | `/api/trips/:id/stops` | Add a stop to a trip |
| PATCH | `/api/stops/:id` | Update stop (dates, order) |
| DELETE | `/api/stops/:id` | Remove stop |
| POST | `/api/stops/:id/activities` | Add an activity to a stop |
| DELETE | `/api/trip-activities/:id` | Remove an activity from a stop |
| GET | `/api/cities?search=&country=` | Search city catalog |
| GET | `/api/activities?city_id=&category=&maxCost=` | Search activity catalog |
| GET | `/api/trips/:id/budget` | Get cost breakdown for a trip |
| POST | `/api/trips/:id/share` | Generate/enable public share link |
| GET | `/api/share/:token` | Public read-only trip view (no auth) |
| POST | `/api/share/:token/copy` | Copy a shared trip into current user's account |

---

## 7. Summary of Key Architectural Decisions

| Decision | Choice | Why |
|---|---|---|
| Frontend | React + TS + Vite (`frontend/`) | Fast dev loop, type safety, huge ecosystem |
| Backend | Node/Express + TS (`backend/`) | Same language as frontend, simple REST model |
| Database | PostgreSQL + Prisma | Matches the inherently relational data; type-safe queries |
| Auth | JWT + bcrypt | Stateless, standard, no session store needed |
| Repo structure | Separate `frontend/`, `backend/`, `docs/`, optional `shared/` | Simple, independently deployable apps; no monorepo tooling overhead |
| Hosting | Vercel (frontend) + Railway/Render (backend) + Neon/Supabase (DB) | Fast to deploy, generous free tiers, minimal ops overhead |
| No AI/agents in v1 | — | Confirmed against problem statement: this is a search/CRUD product, not a generative one |
