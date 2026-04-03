# Neighborly - Feature-by-Feature Implementation Plan

> **Target:** React Native (Expo) on macOS M4, testing via Xcode iPhone Simulator
> **Current state:** Phases 0–3 complete. Supabase backend, auth, task lifecycle, maps all working.
> **Goal:** Fully functional MVP matching the vision in `context.md`

---

## Phase 0: Project Restructure & Dev Environment ✅ COMPLETED (2026-04-03)

### 0.1 - Dev environment validation ✅
- [x] Verify Expo runs on iPhone Simulator (iPhone 17 Pro Max)
- [x] Confirm hot reload works on Simulator
- [x] Updated all Expo SDK deps to latest compatible versions
- [x] Installed missing peer deps (`expo-font`, `react-native-worklets`)
- [x] All 17/17 `expo-doctor` checks pass
- [x] Set up environment variables file (`.env`) for Supabase keys — _done in Phase 1_

### 0.2 - Migrate to feature-based folder structure ✅
- [x] Restructure `src/` from screen-based to feature-based:
  ```
  src/
  ├── features/
  │   ├── services/    (HomeScreen, SearchScreen, ServiceDetailScreen, ServiceCard)
  │   ├── tasks/       (PostTaskScreen, TaskDetailScreen, JobCard)
  │   ├── map/         (FullMapScreen, MapScreen)
  │   ├── chat/        (InboxScreen)
  │   └── profile/     (ProfileScreen)
  ├── shared/          (types, components, hooks, lib, stores)
  └── navigation/      (RootNavigator, HomeStack)
  ```
- [x] Move existing screens and components into feature folders
- [x] Update all import paths

### 0.3 - Swap UI framework to NativeWind ✅
- [x] Install NativeWind v4 + Tailwind CSS 3.4
- [x] Remove React Native Paper dependency
- [x] Configure `tailwind.config.js` with project palette (Black, Red #E31B23, White)
- [x] Configure `metro.config.js` with NativeWind preset
- [x] Migrate all screens/components from Paper styles to NativeWind `className` props
- [x] Enforce `rounded-2xl` (borderRadius 16+) and bold headings throughout

### 0.4 - Theme & design tokens ✅ (partial)
- [x] Define color tokens, border radii, text colors in `tailwind.config.js`
- [x] Extract shared constants (`COLORS`, `ORIGIN`) to `src/shared/lib/constants.ts`
- [x] Extract geo utility to `src/shared/lib/geo.ts`
- [x] Extract `useDebounced` hook to `src/shared/hooks/`
- [ ] Set up dark mode as primary theme — _deferred to Phase 8 polish_
- [ ] Create shared UI primitives (Button, Card, Input, Chip, Avatar) — _will build as needed per phase_

### 0.x - Bug fixes ✅
- [x] Fixed TaskDetailScreen route params bug (`id` → `taskId`)
- [x] Replaced deprecated `SafeAreaView` from RN with `react-native-safe-area-context`

---

## Phase 1: Foundation & Auth (Supabase) ✅ COMPLETED (2026-04-03)

**Why:** Everything depends on user identity. No auth = no task ownership, no chat, no payments.

### 1.1 - Supabase project setup ✅
- [x] Create Supabase project — _done, connected to jnlgcgvvokoncszvvwup.supabase.co_
- [x] Install `@supabase/supabase-js` + `expo-secure-store` + `react-native-url-polyfill`
- [x] Create `src/shared/lib/supabase.ts` client singleton (with SecureStore adapter)
- [x] Create `.env.example` with `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [x] Add `.env` to `.gitignore`
- [x] Dev mode fallback: app works with mock data when env vars not set

### 1.2 - Database schema (SQL migrations) ✅
- [x] Created `supabase/migrations/001_schema.sql` with full schema:
  - `profiles` table with auto-create trigger on auth.users insert
  - `tasks` table with PostGIS spatial index
  - `offers` table
  - `messages` table with Supabase Realtime enabled
  - `reviews` table with rating recompute trigger
- [x] Enable Row Level Security (RLS) on all tables
- [x] RLS policies written for all tables (public read for discovery, owner writes, participant access)
- [x] PostGIS index on `tasks.location_point`

### 1.3 - Auth screens ✅
- [x] ~~Phone number auth~~ → replaced with Apple + Google + Email magic link
- [x] Apple Sign-In for iOS (native via `expo-apple-authentication`)
- [x] Google OAuth sign-in via Supabase
- [x] Email magic link (for dev/testing)
- [x] Build screens:
  - `WelcomeScreen` — branded black landing page with Get Started / Sign In
  - `PhoneEntryScreen` — phone number input with validation
  - `OTPScreen` — 6-digit code input with resend
  - `OnboardingScreen` — role picker (Seeker/Helper/Both), name, skills
- [x] Create `useAuth` Zustand store:
  - `session`, `user`, `profile`, `loading`, `initialized`
  - `initialize()`, `fetchProfile()`, `updateProfile()`, `signOut()`
- [x] Auth-gated navigation: unauthenticated → AuthStack, no profile → Onboarding, ready → MainTabs
- [x] Auto-create `profiles` row on first sign-in (Supabase trigger in migration)

### 1.4 - Replace mock repo with Supabase queries ✅
- [x] Create `src/shared/lib/api.ts` with typed Supabase query functions
- [x] Replace every `repo.ts` call with real Supabase queries
- [x] Update React Query hooks to use new API functions
- [x] Created `services` table migration (`002_services.sql`)
- [x] Created `supabase/seed.sql` for populating test data
- [x] All screens now import from `api.ts` — zero imports from `repo.ts`
- [x] Test all data flows on Simulator
- [ ] Delete `seed.ts` and `repo.ts` — _kept for reference, no longer imported_

---

## Phase 2: Task Lifecycle ✅ COMPLETED (2026-04-03)

**Why:** The core loop. Seekers post tasks, helpers discover and bid on them.

### 2.1 - Post Task flow (3-step modal) ✅
- [x] Step 1 — Category picker: grid of 9 category icons (cleaning, garden, moving, tutoring, plumbing, electrical, painting, car, other)
- [x] Step 2 — Details: title + description inputs
- [x] Step 3 — Budget (€) + payment type picker (cash/digital)
- [x] Validate with Zod schemas before submission
- [x] Insert into `tasks` table, reset form on success
- [ ] Photo upload (expo-image-picker → Supabase Storage) — _deferred to Phase 8_
- [ ] Location picker (map tap / current location) — _deferred to Phase 3_
- [ ] Date/time picker — _deferred to Phase 8_

### 2.2 - Task Discovery feed (for Helpers) ✅
- [x] HomeScreen "Jobs near you" mode fetches from Supabase
- [x] Pull-to-refresh on both modes (services + tasks)
- [ ] Geo-filtered query (within X km) — _deferred to Phase 3 (needs real geolocation)_
- [ ] Sort by: newest, closest, highest budget — _deferred to Phase 8_
- [ ] Filter by: category, payment type — _deferred to Phase 8_
- [ ] Infinite scroll pagination — _deferred to Phase 8_

### 2.3 - Task Detail screen ✅
- [x] Show task info: title, description, budget, category, status badge
- [x] **For Helpers:** "Make Offer" form — amount + message → insert into `offers`
- [x] **For Seekers (task owner):** list of incoming offers with Accept button
  - Accept → task status `matched`, offer `accepted`, others `rejected`
- [x] Status badge with color coding (open/matched/in_progress/completed/disputed)
- [x] "Mark as completed" button for task owner when status is `in_progress`
- [x] Mini-map showing task location — _done in Phase 3_
- [ ] Photo display — _deferred to Phase 8_

### 2.4 - Active Task management ✅
- [x] "My Tasks" section on Profile screen
- [x] Seeker view: posted tasks with status badges
- [x] Helper view: tasks assigned to them
- [x] Tap task → navigates to TaskDetail
- [x] Status transitions: open → matched → in_progress → completed

---

## Phase 3: Maps & Location ✅ COMPLETED (2026-04-03)

**Why:** Location is the core differentiator. Everything is hyper-local.

### 3.1 - Map provider setup ✅
- [x] Using react-native-maps (Apple Maps on iOS, Google Maps on Android)
- [ ] Apply custom dark/red map theme — _deferred to Phase 8_
- [ ] Google Maps API key for Android — _needed when targeting Android_

### 3.2 - Home Screen map view ✅
- [x] List/Map toggle pills on Discover screen
- [x] "Live Tasks" map with pins for open tasks nearby
- [x] Pin color/icon by category (colored circles with white icons)
- [x] Tap pin → task preview card slides up (title, price, category, "View task")
- [x] Tap "View task" → opens TaskDetail modal
- [x] Recenter button to jump to current location
- [x] Shows user location blue dot
- [ ] Cluster pins when zoomed out — _deferred to Phase 8_

### 3.3 - Location picker for task posting ✅
- [x] LocationPickerScreen: modal with map + draggable center pin
- [x] "Use current location" button
- [x] Search bar UI (placeholder — needs geocoding API for full autocomplete)
- [x] Bottom card shows resolved address + "Confirm location" button
- [ ] Address search autocomplete (geocoding API) — _deferred, needs API key_
- [ ] Reverse geocode pin to readable address — _deferred, needs API key_

### 3.4 - Real user geolocation ✅
- [x] `useCurrentLocation` hook with expo-location permissions + live GPS
- [x] Map centers on real user position
- [x] Category color constants (`CATEGORY_COLORS`) for consistent pin colors
- [ ] Background location tracking opt-in — _deferred to Phase 8_

### 3.5 - Task Detail inline map ✅
- [x] Mini map embedded in TaskDetailScreen showing task location
- [x] Category-colored pin marker
- [x] Budget + time info row

---

## Phase 4: Communication & Chat ✅ COMPLETED (2026-04-03)

**Why:** Seekers and helpers need to coordinate before, during, and after a task.

### 4.1 - Real-time chat ✅
- [x] Supabase Realtime subscription on `messages` table filtered by `task_id`
- [x] Chat screen: incoming (gray) / outgoing (red) message bubbles with timestamps
- [x] Task context banner at top of chat (category icon, title, price, status)
- [x] Input bar with attachment button, text field, send button
- [x] Navigate to chat from TaskDetail ("Message" button when matched/in_progress)
- [x] Show last message preview in inbox

### 4.2 - Inbox screen ✅
- [x] Conversation list with avatar, name, last message, time ago
- [x] Task context badge (category + title) on each row
- [x] Tap → opens ChatScreen
- [x] Auto-refetch on tab focus
- [x] Empty state when no conversations

### 4.3 - Push notifications
- [ ] Install `expo-notifications` — _deferred to Phase 8_
- [ ] Supabase Edge Function for push — _deferred to Phase 8_
- [ ] Push token storage — _deferred to Phase 8_
- [ ] Deep-link on notification tap — _deferred to Phase 8_

---

## Phase 5: Reviews & Trust

**Why:** Two-sided marketplace needs trust signals to function.

### 5.1 - Review flow
- [ ] After task `completed`, prompt both parties to leave a review
- [ ] Double-blind: neither review is visible until both are submitted (or 48h passes)
- [ ] Star rating (1-5) + optional comment
- [ ] Insert into `reviews` table

### 5.2 - Rating display
- [ ] Show aggregate rating + review count on profile and service cards
- [ ] Supabase function to recompute `profiles.rating` on new review insert
- [ ] Review list on profile screen (most recent reviews)

### 5.3 - Profile screen (replace stub)
- [ ] Avatar, name, bio, role badge (Seeker/Helper)
- [ ] Skills list (for helpers)
- [ ] Stats: rating, jobs done, member since
- [ ] Reviews section
- [ ] Edit profile button -> edit name, bio, avatar, skills
- [ ] Settings: notifications, logout

---

## Phase 6: Payments (Escrow Lite)

**Why:** Digital payments with escrow build trust and keep transactions on-platform.

### 6.1 - Stripe Connect setup
- [ ] Create Stripe Connect platform account
- [ ] Helpers onboard as Stripe Connected Accounts (Express)
- [ ] Supabase Edge Function to handle Stripe webhooks

### 6.2 - Payment flow
- [ ] When seeker accepts an offer:
  - If `digital`: charge seeker, hold in escrow (Stripe PaymentIntent with `capture_method: manual`)
  - If `cash`: mark task as cash, no digital escrow
- [ ] "Commitment" button confirms payment intent
- [ ] On task `completed`: capture the held payment, transfer to helper's connected account
- [ ] On `disputed`: hold funds, flag for manual review

### 6.3 - Payment UI
- [ ] Payment method management (add/remove cards)
- [ ] EscrowBanner component (already exists) -> wire up to real status
- [ ] Transaction history on profile screen

---

## Phase 7: AI Agents (Claude API)

**Why:** Automation and safety at scale, as specified in context doc.

### 7.1 - Dispatcher Agent
- [ ] Supabase Edge Function triggered on new task insert
- [ ] Claude API call to:
  - Auto-categorize task from title + description
  - Generate concise notification summary
  - Suggest budget range based on category + location
- [ ] Store AI-generated fields on task record

### 7.2 - Quality Agent
- [ ] Enhance user-uploaded task descriptions
- [ ] Triggered when task is created or edited
- [ ] Claude rewrites description for clarity while preserving intent
- [ ] Show "enhanced" version with option to accept/reject

### 7.3 - Safety Agent
- [ ] Monitor chat messages via Supabase Realtime or DB trigger
- [ ] Flag: off-platform payment requests, phone number sharing, suspicious patterns
- [ ] Insert flagged content into admin review queue
- [ ] Auto-warn users when flagged content is detected

---

## Phase 8: Polish & Launch Prep

### 8.1 - Service Discovery refinement
- [ ] Horizontal category scroller on home screen (Wolt-style)
- [ ] Search with filters: category, price range, rating, distance
- [ ] Provider profiles with portfolio/gallery

### 8.2 - Animations & UX polish
- [ ] Preserve existing scroll-driven header animations
- [ ] Add skeleton loading states (replace empty screens during fetch)
- [ ] Haptic feedback on key actions (accept offer, send message)
- [ ] Pull-to-refresh everywhere
- [ ] Dark mode as primary theme

### 8.3 - Error handling & edge cases
- [ ] Network error states with retry
- [ ] Empty states for all lists (no tasks, no offers, no messages)
- [ ] Form validation error display
- [ ] Session expiry handling

### 8.4 - Testing
- [ ] Unit tests for business logic (ranking algorithm, validation schemas)
- [ ] Integration tests for Supabase queries
- [ ] E2E tests with Detox on iPhone Simulator
- [ ] Test full task lifecycle end-to-end

### 8.5 - Performance & accessibility
- [ ] Image optimization (thumbnails, lazy loading)
- [ ] List virtualization audit (FlatList performance)
- [ ] Accessibility labels on all interactive elements
- [ ] VoiceOver testing on Simulator

---

## Execution Order Summary

| Order | Phase | Status | Depends On |
|-------|-------|--------|------------|
| 1 | Phase 0: Restructure & NativeWind | ✅ Done | Nothing |
| 2 | Phase 1: Auth & Supabase | ✅ Done | Phase 0 |
| 3 | Phase 2: Task Lifecycle | ✅ Done | Phase 1 |
| 4 | Phase 3: Maps & Location | ✅ Done | Phase 1 |
| 5 | Phase 4: Chat & Notifications | ✅ Done | Phase 2 |
| 6 | Phase 5: Reviews & Profile | ⬜ | Phase 2 |
| 7 | Phase 6: Payments | ⬜ | Phase 2 |
| 8 | Phase 7: AI Agents | ⬜ | Phase 2, 4 |
| 9 | Phase 8: Polish & Testing | ⬜ | All above |

> Phases 3, 4, 5, 6 can be parallelized after Phase 2 is complete.
> Phase 7 can start as soon as Phase 2 (tasks) and Phase 4 (chat) are done.
