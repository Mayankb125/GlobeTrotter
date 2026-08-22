# Product Requirements Document: GlobeTrotter
### Empowering Personalized Travel Planning

**Version:** 1.0
**Status:** Draft for Build
**Owner:** [Your Name] — Product
**Last Updated:** August 22, 2026

---

## 1. Executive Summary

GlobeTrotter is a web application that lets travelers plan multi-city trips end-to-end — choosing destinations, assigning dates and activities, tracking budget, and visualizing the whole journey — without juggling spreadsheets, group chats, and five browser tabs. It replaces ad-hoc trip planning (notes apps, WhatsApp threads, scattered blog research) with one structured, visual, shareable tool.

This is a hackathon-scoped, database-backed CRUD web application. It is **not** an AI/agent product in v1 — the core value is organization, search, and budget clarity over a curated dataset of cities and activities, not generative content.

---

## 2. Problem Statement

Planning a multi-city trip today is fragmented:

- **Discovery is scattered.** People research cities and activities across blogs, Instagram, and review sites, then manually copy notes into docs.
- **Budgeting is reactive, not proactive.** Most travelers don't know their total trip cost until after they've booked — overspending is discovered too late.
- **Itineraries live in the wrong tools.** Notes apps and spreadsheets aren't built for day-by-day, multi-city sequencing.
- **Sharing a plan is clunky.** Sending a trip to a friend or partner usually means exporting a doc or a screenshot, not a live, browsable itinerary.

**Core problem GlobeTrotter solves:** travelers need one place to search destinations and activities, assemble them into a day-by-day multi-city plan, see running costs as they build it, and share the result — all before they've spent a rupee/dollar on bookings.

---

## 3. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| **The Independent Planner** | Solo or couple travelers planning their own multi-city trip (e.g., 2 weeks across Europe) | Structure + budget visibility |
| **The Group Coordinator** | Person organizing a trip for friends/family who needs to propose and share a plan | Shareable, presentable itinerary |
| **The Inspiration Browser** | Someone in early "dreaming" phase, not ready to commit dates | Discover cities/activities, save for later |

**Out of scope for v1:** travel agents/B2B users, corporate travel, real-time booking customers.

---

## 4. Goals & Non-Goals

### Goals (v1)
- Let a user build a complete multi-city itinerary with dates, activities, and a live budget estimate.
- Make discovery (cities, activities) fast via search and filters over a curated dataset.
- Make the finished plan visual and easy to share.
- Demonstrate solid relational data modeling (trips → stops → activities → costs).

### Non-Goals (v1)
- Real bookings, payments, or live pricing from airlines/hotels.
- AI-generated itineraries or chat-based planning assistants.
- Social network features (following users, feeds, comments).
- Native mobile apps (responsive web only).

---

## 5. Core Features — Must Have vs Nice to Have

### 5.1 Must Have (MVP-blocking)

| Feature | Description |
|---|---|
| **Auth (Login/Signup)** | Email + password signup/login, forgot-password flow, basic validation |
| **Dashboard/Home** | Welcome message, list of the user's recent/upcoming trips, "Plan New Trip" CTA |
| **Create Trip** | Name, start/end dates, description; optional cover photo |
| **My Trips (list view)** | Trip cards with name, date range, stop count; edit/view/delete |
| **Itinerary Builder** | Add stops (cities) with dates, add activities per stop, reorder stops |
| **City Search** | Search/filter a pre-seeded city catalog (name, country, cost index, popularity); add to trip |
| **Activity Search** | Search/filter a pre-seeded activity catalog by type/cost/duration; add to a stop |
| **Itinerary View** | Structured read view of the full trip — grouped by city/day |
| **Budget & Cost Breakdown** | Auto-computed running total from selected activities/stays; breakdown by category |
| **Trip Calendar/Timeline** | Day-by-day or calendar visualization of the itinerary |
| **Public Share View** | Read-only shareable URL for a trip; "Copy Trip" action |
| **Relational Database** | Proper schema: users, trips, stops, cities, activities, costs — not flat JSON blobs |

### 5.2 Nice to Have (post-MVP / stretch)

| Feature | Description |
|---|---|
| User Profile/Settings | Edit name/photo/email, delete account, saved destinations list |
| Admin/Analytics Dashboard | Trip counts, top cities/activities, engagement stats (admin-only) |
| Drag-to-reorder activities within a day | Richer interactivity in the calendar view |
| Social sharing buttons (WhatsApp/X/etc.) | One-click share to external platforms |
| Overbudget alerts | Proactive warning when a day/trip exceeds budget threshold |
| AI-assisted itinerary suggestions | Optional "suggest activities" layer using an LLM over the *existing* city/activity dataset — explicitly not core to v1 |

---

## 6. User Flow (Start to Finish)

1. **Landing → Signup/Login** — New user creates an account or logs in.
2. **Dashboard** — Sees empty state ("no trips yet") or their existing trips; clicks "Plan New Trip."
3. **Create Trip** — Enters trip name, date range, optional description/cover photo → saves.
4. **Itinerary Builder** — Lands in the builder for the new trip:
   a. Searches for a city (City Search) → adds it as a stop with sub-dates.
   b. Within that stop, searches activities (Activity Search) → adds selected ones.
   c. Repeats for additional cities; reorders stops if needed.
5. **Live Budget Feedback** — As activities/stops are added, a running cost breakdown updates (visible in builder or a dedicated budget screen).
6. **Itinerary View** — User switches to the structured view to review the full day-wise/city-wise plan.
7. **Trip Calendar/Timeline** — User toggles to a calendar view to sanity-check pacing across days.
8. **Save & Return** — Trip auto-saves; user returns to "My Trips" list anytime to continue editing.
9. **Share** — User publishes a shareable public link; a friend opens it in read-only mode and optionally "Copies" it to their own account.
10. **(Nice-to-have) Settings** — User updates profile info or manages saved destinations at any point.

---

## 7. MVP Definition

The MVP is the smallest version that lets a user go **signup → build a real multi-city trip with budget visibility → share it** without hitting a dead end.

**MVP = all "Must Have" features above, specifically:**
- Auth (signup/login only — password reset can be a stub/basic version)
- Create Trip, My Trips list
- Itinerary Builder with City Search + Activity Search (seeded dataset of ~30–50 cities, ~100–150 activities is sufficient to demo)
- Itinerary View (list view is enough; calendar view can be simplified to a day-by-day list rather than full calendar UI)
- Budget & Cost Breakdown (numeric breakdown; charts are a stretch, not required for MVP)
- Public Share View (read-only link)

**Explicitly deferred from MVP even though "Must Have" long-term:** polished calendar UI, cover photo upload (can default to a placeholder), "Copy Trip" (share view can be view-only first, copy added after).

---

## 8. Success Metrics

Since this is an early-stage/hackathon product, metrics should validate *that the core loop works*, not growth at scale.

| Metric | What it tells us |
|---|---|
| **% of signups who create at least 1 trip** | Is onboarding → first value clear? |
| **% of trips with ≥2 stops and ≥1 activity per stop** | Are people actually building real itineraries, not abandoning after step 1? |
| **Time to complete a full itinerary (signup → shareable trip)** | Is the builder flow fast/intuitive enough? |
| **% of trips shared via public link** | Does the plan feel presentable enough to share? |
| **Search-to-add conversion rate** (city/activity search results that get added to a trip) | Is the seeded dataset relevant and the search UX usable? |
| **Return rate** (users who come back to edit an existing trip) | Is GlobeTrotter a living planning tool or a one-time-use form? |

For a hackathon demo specifically, the practical success bar is: **a judge can go from signup to a fully priced, shareable 3-city itinerary in under 5 minutes without confusion.**

---

## 9. What We Are Deliberately NOT Building in V1

- **No AI-generated itineraries or chatbot/agent-based planning.** All discovery is search/filter over our own curated database — not LLM-generated content. (This was evaluated and explicitly rejected for v1; see note below.)
- **No real bookings or payments.** No flight/hotel booking integrations, no payment processing.
- **No live/dynamic pricing.** Costs are static estimates from our seeded dataset, not real-time API pricing.
- **No native mobile apps.** Responsive web only.
- **No social features.** No following, feeds, comments, or public user profiles beyond the trip-share link.
- **No multi-language/localization.** English only for v1.
- **No admin analytics dashboard in MVP** (deferred to nice-to-have/post-MVP).
- **No offline mode.**

> **Note on AI:** An AI-assisted "suggest an itinerary" feature was considered, but the problem statement calls for search-and-select over a relational database of pre-populated cities/activities — not generative planning. Agentic AI is listed only as a possible *post-MVP* enhancement layered on top of the working CRUD product, not a v1 requirement.

---

## 10. Open Questions / Risks

- **Dataset scope:** who curates the initial city/activity dataset, and how large does it need to be for a convincing demo? (Recommend: 30–50 cities, 100–150 activities across a few popular regions.)
- **Cost model:** are activity/stay costs static per-item, or do we need per-day/per-person multipliers? Needs a decision before DB schema is finalized.
- **Sharing permissions:** is the public link fully open, or should it support "unlisted vs private" trip visibility?
- **Image handling:** cover photos and activity images — do we host user uploads or use stock/placeholder images for v1 to save time?

---

## 11. Appendix: Screen Inventory (from original problem statement)

1. Login / Signup
2. Dashboard / Home
3. Create Trip
4. My Trips (list)
5. Itinerary Builder
6. Itinerary View
7. City Search
8. Activity Search
9. Trip Budget & Cost Breakdown
10. Trip Calendar / Timeline
11. Shared / Public Itinerary View
12. User Profile / Settings *(nice-to-have)*
13. Admin / Analytics Dashboard *(nice-to-have, optional per original spec)*
