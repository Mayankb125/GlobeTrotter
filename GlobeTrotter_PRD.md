# Product Requirements Document: GlobeTrotter

**Status:** Draft v1.0
**Owner:** Product
**Last Updated:** August 2026

---

## 1. Overview

### 1.1 What is GlobeTrotter?

GlobeTrotter is a web application that lets travelers plan multi-city trips end-to-end — adding stops, assigning dates and activities, tracking budget, and visualizing the full itinerary as a timeline or calendar. Users build trips manually with full control, and can optionally use an AI-assist feature to auto-generate or fill in an itinerary based on their preferences. Completed itineraries can be shared publicly so others can view or copy them.

### 1.2 Who is it for?

**Primary users:** Independent leisure travelers planning multi-city or multi-stop trips (backpackers, vacationers, digital nomads) who currently juggle spreadsheets, notes apps, and multiple browser tabs to plan a trip.

**Secondary users:** Friends/family who view a shared itinerary (read-only, no account required) and may copy it to start their own trip.

**Not the target user (v1):** Corporate travel bookers, travel agents managing client trips, group-collaboration-heavy planners (multiple editors on one trip).

### 1.3 What problem does it solve?

Planning a multi-city trip today is fragmented:
- Destination research happens in one place (blogs, Google), budgeting in another (spreadsheet), and the actual day-by-day plan in a third (notes app or nothing at all).
- There's no single place to see "what am I doing, where, on what day, for how much" across an entire trip.
- Estimating total trip cost before booking anything is manual and error-prone.
- Sharing a plan with a travel companion means sending screenshots or a messy doc.

GlobeTrotter solves this by giving travelers one structured place to build, budget, visualize, and share a multi-city itinerary — with AI available to speed up the research/first-draft step, but never required.

---

## 2. Core Features

### Must-Have (MVP)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Auth (signup/login)** | Email + password signup, login, forgot password. |
| 2 | **Create Trip** | Name, start/end dates, description, optional cover photo. |
| 3 | **My Trips list** | View all trips the user has created, with edit/view/delete. |
| 4 | **Itinerary Builder** | Add stops (city + dates), add activities per stop, reorder stops. |
| 5 | **Itinerary View** | Day-wise structured view of the full trip (list format). |
| 6 | **City Search** | Search and add cities to a trip. |
| 7 | **Activity Search** | Browse/search activities per city, filter by type/cost. |
| 8 | **Budget & Cost Breakdown** | Estimated total cost, broken down by transport/stay/activities/food. |
| 9 | **Public Share Link** | Read-only public URL for any itinerary; "Copy Trip" to clone it. |
| 10 | **Profile/Settings** | Edit name, email, photo, delete account. |

### Nice-to-Have (Post-MVP)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **AI-Assist Itinerary Suggestion** | One-click AI-generated draft itinerary (destination research + day plan) that the user can edit or discard. |
| 2 | **Calendar/Timeline View** | Visual calendar toggle in addition to list view, drag-to-reorder. |
| 3 | **Budget Charts** | Pie/bar chart visualization of cost breakdown, over-budget alerts. |
| 4 | **Social sharing** | Direct share-to-social buttons for public itineraries. |
| 5 | **Admin/Analytics Dashboard** | Internal view of platform usage, popular cities/activities. |
| 6 | **Saved destinations / wishlist** | Users bookmark cities/activities for future trips. |
| 7 | **Multi-language support** | Language preference in settings. |

---

## 3. User Flow (Start to Finish)

```
1. Landing → Signup/Login
2. Dashboard → "Plan New Trip"
3. Create Trip → name, dates, description
4. Itinerary Builder → Add Stop (search city) → assign dates
                     → Add Activities to stop (search/browse) → repeat per stop
                     → (optional) tap "AI Suggest" to auto-fill a draft
5. Itinerary View → review day-wise plan, edit if needed
6. Budget Breakdown → check estimated total cost vs. expectations
7. My Trips → trip now listed; can revisit/edit anytime
8. Share → generate public link → send to friend
   → Friend opens public link (no login) → views or "Copy Trip" to their own account
```

---

## 4. What MVP Looks Like

The MVP is a **fully functional manual trip planner**:
- User can sign up, create a trip, add multiple city stops with dates, add activities to each stop, see a day-wise itinerary, see a basic cost breakdown, and share a public read-only link.
- AI-assist, calendar view, charts, and admin dashboard are **excluded from MVP** — they ship after the manual flow is validated.
- Single-editor per trip (no real-time collaboration).
- Web only, responsive layout (not a native mobile app).

**MVP is "done" when:** a user can go from signup → fully-built multi-city itinerary with budget estimate → shareable link, entirely manually, with no AI dependency.

---

## 5. Success Metrics

| Metric | Target signal |
|--------|----------------|
| Activation | % of signups who create at least 1 trip with 2+ stops |
| Engagement | Average number of activities added per trip |
| Completion | % of started trips that reach a "complete" itinerary (all stops have dates + ≥1 activity) |
| Sharing | % of completed trips that generate a public share link |
| Virality | % of shared-link viewers who sign up / copy the trip |
| Retention | % of users who create a 2nd trip within 60 days |
| (Post-MVP) AI adoption | % of trips that use AI-Assist at least once |

---

## 6. Explicitly NOT Building in V1

- Real-time multi-user collaborative editing on a single trip
- Native mobile apps (iOS/Android) — web-responsive only
- In-app booking (flights, hotels, activities) — GlobeTrotter estimates cost, it does not transact
- Payment processing / paid subscriptions
- OAuth/social login (email+password only for v1)
- Admin/analytics dashboard (deferred to post-MVP)
- AI-assist as a required step (it's optional, added after MVP)
- Offline mode / PWA support
- Group expense splitting (Splitwise-style)
- Multi-language UI

---

## 7. Open Questions for Next Iteration

- Do we allow trip co-editors (shared ownership) later, or keep single-owner permanently?
- Is activity/city data user-generated, curated by us, or sourced from a third-party API?
- Do we need moderation for public shared itineraries?
