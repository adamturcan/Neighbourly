# Neighborly - Feature-by-Feature Implementation Plan

> **Target:** React Native (Expo) on macOS M4, testing via Xcode iPhone Simulator
> **Current state:** Feature-based structure with NativeWind, mock data, no backend
> **Goal:** Fully functional MVP matching the vision in `context.md`

---

## Phase 0: Project Restructure & Dev Environment ✅ COMPLETED (2026-04-03)

### 0.1 - Dev environment validation ✅
- [x] Verify Expo runs on iPhone Simulator (iPhone 17 Pro Max)
- [x] Confirm hot reload works on Simulator
- [x] Updated all Expo SDK deps to latest compatible versions
- [x] Installed missing peer deps (`expo-font`, `react-native-worklets`)
- [x] All 17/17 `expo-doctor` checks pass
- [ ] Set up environment variables file (`.env`) for Supabase/Stripe/Maps keys — _deferred to Phase 1_

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

## Phase 1: Foundation & Auth (Supabase)

**Why:** Everything depends on user identity. No auth = no task ownership, no chat, no payments.

### 1.1 - Supabase project setup
- [ ] Create Supabase project
- [ ] Install `@supabase/supabase-js`
- [ ] Create `src/shared/lib/supabase.ts` client singleton
- [ ] Configure Supabase URL + anon key via `.env`

### 1.2 - Database schema (SQL migrations)
- [ ] Create `profiles` table:
  ```sql
  id uuid references auth.users primary key,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  role text check (role in ('seeker', 'helper', 'both')),
  skills text[],
  rating numeric default 0,
  jobs_done integer default 0,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
  ```
- [ ] Create `tasks` table:
  ```sql
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id),
  helper_id uuid references profiles(id),
  title text not null,
  description text,
  category text not null,
  status text default 'open' check (status in ('open','matched','in_progress','disputed','completed','cancelled')),
  budget numeric,
  payment_type text check (payment_type in ('digital', 'cash')),
  photos text[],
  location_point geography(Point, 4326),
  address text,
  scheduled_at timestamptz,
  created_at timestamptz default now()
  ```
- [ ] Create `offers` table:
  ```sql
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  helper_id uuid references profiles(id),
  amount numeric,
  message text,
  status text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz default now()
  ```
- [ ] Create `messages` table:
  ```sql
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  sender_id uuid references profiles(id),
  content text,
  created_at timestamptz default now()
  ```
- [ ] Create `reviews` table:
  ```sql
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id),
  reviewer_id uuid references profiles(id),
  reviewee_id uuid references profiles(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
  ```
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Write RLS policies (users read own data, public read for discovery, etc.)
- [ ] Create PostGIS indexes on `location_point` columns for geo queries

### 1.3 - Auth screens
- [ ] Phone number auth via Supabase Auth (OTP)
- [ ] Social login (Apple Sign-In for iOS, Google)
- [ ] Build screens:
  - `WelcomeScreen` -- app intro with Sign In / Sign Up
  - `PhoneEntryScreen` -- phone number input
  - `OTPScreen` -- verification code input
  - `OnboardingScreen` -- choose role (Seeker / Helper / Both), set name, avatar, skills
- [ ] Create `useAuth` Zustand store (replace empty stub):
  - `session`, `user`, `profile`
  - `signIn()`, `signOut()`, `refreshProfile()`
- [ ] Auth-gated navigation: unauthenticated users see auth stack, authenticated see main tabs
- [ ] Auto-create `profiles` row on first sign-in (Supabase trigger or client-side)

### 1.4 - Replace mock repo with Supabase queries
- [ ] Create `src/shared/lib/api.ts` with typed Supabase query functions
- [ ] Replace every `repo.ts` call with real Supabase queries
- [ ] Update React Query hooks to use new API functions
- [ ] Delete `seed.ts` and `repo.ts` once fully migrated
- [ ] Test all data flows on Simulator

---

## Phase 2: Task Lifecycle

**Why:** The core loop. Seekers post tasks, helpers discover and bid on them.

### 2.1 - Post Task flow (3-step modal)
- [ ] Step 1 -- Category picker: grid of category icons (home repairs, garden, car, tutoring, cleaning, other)
- [ ] Step 2 -- Details: title, description, photo upload (expo-image-picker -> Supabase Storage)
- [ ] Step 3 -- Budget & location: price input, payment type (digital/cash), date/time picker, location picker (map tap or current location)
- [ ] Validate with Zod schemas before submission
- [ ] Insert into `tasks` table, navigate to task detail on success

### 2.2 - Task Discovery feed (for Helpers)
- [ ] Refactor HomeScreen "Jobs near you" mode to fetch from Supabase
- [ ] Geo-filtered query: only tasks within X km of helper's location
- [ ] Sort by: newest, closest, highest budget
- [ ] Filter by: category, payment type
- [ ] Pull-to-refresh + infinite scroll pagination

### 2.3 - Task Detail screen
- [ ] Show task info: title, description, photos, budget, location on mini-map, time, category
- [ ] **For Helpers:** "Make Offer" button -> amount + message input -> insert into `offers`
- [ ] **For Seekers (task owner):** list of incoming offers with helper info (name, rating, jobs done)
  - Accept offer -> update task status to `matched`, offer status to `accepted`, reject others
- [ ] Status badge showing current task state

### 2.4 - Active Task management
- [ ] "My Tasks" section accessible from Profile or a dedicated tab
- [ ] Seeker view: posted tasks grouped by status (open, matched, in progress, completed)
- [ ] Helper view: tasks they've been matched to
- [ ] Status transitions:
  - Seeker accepts offer -> `matched`
  - Helper starts work -> `in_progress`
  - Seeker confirms completion -> `completed`
  - Either party can raise `disputed`

---

## Phase 3: Maps & Location

**Why:** Location is the core differentiator. Everything is hyper-local.

### 3.1 - Map provider setup
- [ ] Choose Mapbox or Google Maps (context doc allows either)
- [ ] Install and configure with API key
- [ ] Apply custom dark/red map theme to match brand

### 3.2 - Home Screen map view
- [ ] "Live Tasks" map with pins for open tasks nearby
- [ ] Pin color/icon by category
- [ ] Tap pin -> task preview card -> tap card -> TaskDetail screen
- [ ] Cluster pins when zoomed out

### 3.3 - Location picker for task posting
- [ ] Map with draggable pin for precise location
- [ ] "Use current location" button
- [ ] Address search autocomplete (geocoding API)
- [ ] Reverse geocode pin position to readable address

### 3.4 - Real user geolocation
- [ ] Replace hardcoded Prague coordinates with `expo-location` permissions + live GPS
- [ ] Update `useLocation` store to persist real coordinates
- [ ] Background location tracking opt-in for helpers (to surface nearby tasks via push)

---

## Phase 4: Communication & Chat

**Why:** Seekers and helpers need to coordinate before, during, and after a task.

### 4.1 - Real-time chat
- [ ] Supabase Realtime subscription on `messages` table filtered by `task_id`
- [ ] Chat screen: message bubbles, input bar, send button
- [ ] Navigate to chat from TaskDetail (once task is `matched`)
- [ ] Show last message preview in task list / inbox

### 4.2 - Inbox screen (replace stub)
- [ ] List of active conversations grouped by task
- [ ] Each row: task title, other party's name/avatar, last message, unread badge
- [ ] Tap -> opens chat for that task

### 4.3 - Push notifications
- [ ] Install `expo-notifications`
- [ ] Supabase Edge Function to send push on:
  - New offer on your task
  - Offer accepted
  - New chat message
  - Task status change
- [ ] Store push tokens in `profiles` table
- [ ] Notification tap deep-links to relevant screen

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
| 2 | Phase 1: Auth & Supabase | ⬜ Next | Phase 0 |
| 3 | Phase 2: Task Lifecycle | ⬜ | Phase 1 |
| 4 | Phase 3: Maps & Location | ⬜ | Phase 1 |
| 5 | Phase 4: Chat & Notifications | ⬜ | Phase 2 |
| 6 | Phase 5: Reviews & Profile | ⬜ | Phase 2 |
| 7 | Phase 6: Payments | ⬜ | Phase 2 |
| 8 | Phase 7: AI Agents | ⬜ | Phase 2, 4 |
| 9 | Phase 8: Polish & Testing | ⬜ | All above |

> Phases 3, 4, 5, 6 can be parallelized after Phase 2 is complete.
> Phase 7 can start as soon as Phase 2 (tasks) and Phase 4 (chat) are done.
