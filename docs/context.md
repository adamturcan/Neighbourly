# Project Context: Neighbourly
**Tagline:** Hyper-local community service marketplace.
**Visual Style:** Modern, high-contrast (Wolt/Bolt inspired).
**Primary Palette:** Black (#000000), Red (#E31B23), White (#FFFFFF).

## 1. Vision & Core Loop
Neighbourly connects people needing help (Seekers) with local talent (Helpers - students, seniors, experts).
* **Core Loop:** Seeker posts a task (photo + category + location) -> AI Agent categorizes and notifies nearby Helpers -> Helper bids/accepts -> Safe transaction/Cash -> Review.
* **Key Segments:** Home repairs, garden work, car assistance (jump-start), tutoring, cleaning.

## 2. Technical Stack (The "Modern Mobile" Stack)
* **Frontend:** React Native (Expo) + NativeWind (Tailwind CSS).
* **Backend/Database:** Supabase (Auth, PostgreSQL, Real-time).
* **Payments:** Stripe Connect (Support for Cash and Escrow-style digital payments).
* **Maps:** Mapbox or Google Maps (Custom Red/Dark theme).
* **AI Layer:** Claude API via Supabase Edge Functions.

## 3. Implementation Priorities (MVP)
### Phase 1: Foundation & Auth
* Setup React Native Expo with NativeWind.
* Theme configuration: Dark mode primary, Red `#E31B23` for primary buttons.
* Supabase Auth (Phone/Social) and User Profile schema (Roles: Seeker, Helper).

### Phase 2: Task Lifecycle (The Wolt Feel)
* **Home Screen:** Map view with "Live Tasks" pins + Wolt-style horizontal category scroller.
* **Post Task Flow:** 3-step modal (Category -> Details/Photo -> Budget/Location).
* **Task Discovery:** Feed of available local gigs for Helpers.

### Phase 3: Communication & Trust
* **Real-time Chat:** Supabase Real-time for messaging between Seeker and Helper.
* **Rating System:** Double-blind review system after task completion.

### Phase 4: Transactions (Escrow Lite)
* Implementation of a "Commitment" button.
* Integration with Stripe for holding funds or marking as "Cash Payment".

## 4. AI Agent Architecture (Automation Skills)
Claude should plan for these agents in `supabase/functions`:
1.  **Dispatcher Agent:** Automatically tags tasks and summarizes descriptions for notifications.
2.  **Safety Agent:** Flags suspicious chat activity or off-platform payment attempts.
3.  **Quality Agent:** Enhances user-uploaded task descriptions for better clarity.

## 5. Database Schema Requirements
* `profiles` (id, username, bio, rating, skills, avatar_url, role)
* `tasks` (id, creator_id, helper_id, title, description, category, status, price, type: [digital/cash], location_point)
* `messages` (id, task_id, sender_id, content, created_at)
* `reviews` (id, task_id, reviewer_id, reviewee_id, rating, comment)

## 6. Instructions for Claude Code
1.  **Architecture:** Use a feature-based folder structure (`src/features/tasks`, `src/features/auth`).
2.  **UI:** Prioritize `BorderRadius: 16` or higher for that "modern app" look. Use heavy bold headings.
3.  **Efficiency:** Propose a step-by-step implementation plan starting from the DB schema to the first screen.
4.  **Action:** Generate the `init` script for Supabase and the basic React Native navigation structure.