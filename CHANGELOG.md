# Changelog

All notable changes to the Neighborly project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/)

## [2026-04-03] — Phase 5.5: Service Publishing & Provider Dashboard

### Added
- My Services Dashboard — stats (active services, bookings, rating), service cards with Live status, Edit/Remove actions
- Create Service Wizard — 3-step flow: title+description → categories+pricing → review & publish
- Success screen with green checkmark after publishing
- API functions: listMyServices, createService, updateService, deleteService
- "My Services" entry point on Profile screen settings section
- MyServicesScreen and CreateServiceScreen registered in navigation

---

## [2026-04-03] — Search Screen Redesign (V2 Explore)

### Changed
- Search screen redesigned with Uber-style explore layout
- Browse Categories grid with colored icons (8 categories)
- Popular Near You section showing top-rated services
- Open Tasks Nearby section with category dots
- Recent searches with history and clear button
- Search results show as horizontal cards with thumbnails, ratings, distance
- Active category filter pill with dismiss

---

## [2026-04-03] — Message Reactions

### Added
- Long-press on any message to react with 5 emojis (❤️ 😂 😮 😢 👍)
- Reaction pills displayed below message bubbles with count
- Tap existing reaction to toggle it off or change emoji
- Real-time reaction sync via Supabase Realtime
- message_reactions table migration (006_message_reactions.sql)
- Own reactions highlighted with red border

---

## [2026-04-03] — Phase 5: Reviews & Trust

### Added
- StarRating shared component (display + interactive modes)
- ReviewSubmitScreen — bottom sheet style modal with star rating + comment
- Review prompt on completed tasks in TaskDetailScreen (with post-completion flow)
- fetchReviewsForUser, fetchReviewStatus, getPublicProfile API functions
- PublicProfileScreen — view other users' profiles with reviews
- EditProfileScreen — edit name, bio, skills
- Reviews section on ProfileScreen showing latest reviews with stars

### Changed
- ProfileScreen redesigned to V1 card sections layout: header card with avatar/role/bio/member since, stats card with star rating, skills card, reviews card, tasks/offers cards, settings card with sign out
- Review type extended with reviewerName, reviewerAvatarUrl, taskTitle
- Profile type extended with created_at
- HomeStack updated with ReviewSubmit, EditProfile, PublicProfile routes
- Task completion now prompts user to leave a review immediately

### Fixed
- EAS Update configured for OTA deployments
- App name corrected to "Neighbourly" (British spelling)
- Added android.package and ios.bundleIdentifier for EAS builds

---

## [2026-04-03] — Phase 1: Supabase Foundation & Auth

## [2026-04-03] — Phase 4: Chat & Inbox

### Added
- Inbox screen: conversation list with avatar, name, last message, task context badge, time ago
- ChatScreen: real-time messaging with Supabase Realtime subscription
  - Incoming (gray) and outgoing (red) message bubbles with timestamps
  - Task context banner at top (category icon, title, price, status)
  - Input bar with attachment button, text field, send button
- API: listConversations(), listMessages(), sendMessage()
- "Message" button on TaskDetail when task is matched/in_progress
- Auto-refetch inbox on tab focus
- Empty state for inbox when no conversations

---

## [2026-04-03] — Phase 3: Maps & Location

### Added
- Discover screen: List/Map toggle pills — tap Map to see tasks as colored pins
- DiscoverMapView component with category-colored custom pins
- Tap pin → task preview card slides up with title, price, category, "View task" button
- Recenter button to jump back to current location
- LocationPickerScreen: modal with draggable center pin, search bar, "Use my location" button
- Inline map on TaskDetailScreen showing task location with category-colored pin
- `useCurrentLocation` hook: expo-location permissions + GPS coordinates
- Category color constants for consistent pin/badge colors across the app
- Real user geolocation replaces hardcoded Prague coordinates

---

## [2026-04-03] — Post Task UI Redesign (V2 iOS Native)

### Changed
- PostTaskScreen redesigned with iOS native style:
  - Step 1: 4-column icon grid with white shadow cards, colored icons, check badge
  - Step 2: iOS grouped table inputs (title/description in one white card), photo upload
  - Step 3: Budget with quick-pick presets, iOS settings rows (payment/when/location), review card
- iOS system gray background (#f2f2f7) instead of white
- "Post task — €45" dynamic CTA button
- Proper iOS spacing, typography, and shadow treatment

---

## [2026-04-03] — Phase 2: Task Lifecycle

### Added
- 3-step Post Task flow: Category picker (9 categories with icons) → Details (title, description) → Budget & payment type (cash/digital)
- Zod validation on task form submission
- Task Detail screen with role-aware UI:
  - Helpers see "Make an offer" form (amount + message)
  - Seekers see incoming offers with Accept button
  - Owner can "Mark as completed" when task is in progress
- Status badges with color coding (open/matched/in_progress/completed/disputed)
- "My Tasks" section on Profile screen (posted tasks + tasks helping on)
- `listMyTasks()` API function for fetching user's own tasks
- Pull-to-refresh on both Discover modes (services + tasks)
- Task cards in Profile link to TaskDetail screen

---

### Changed
- All screens now use Supabase API (`api.ts`) instead of mock repo
- PostTaskScreen creates real tasks in Supabase
- TaskDetailScreen fetches real offers from Supabase
- HomeScreen, SearchScreen, ServiceDetailScreen fetch from `services` table
- FullMapScreen, MapScreen fetch from Supabase
- Added "Dev Sign In" and "Dev Onboarding" buttons on WelcomeScreen
- Replaced phone/SMS auth with Apple Sign-In + Google OAuth + Email magic link

### Removed
- All imports of `repo.ts` — mock data layer no longer used by any screen
- WelcomeScreen now has 3 sign-in options (Apple on iOS, Google, Email)
- Simplified AuthStack to single WelcomeScreen (no more phone/OTP flow)
- Removed PhoneEntryScreen and OTPScreen from auth flow (kept as files for reference)

### Added
- `expo-apple-authentication` for native Apple Sign-In
- Supabase client (`src/shared/lib/supabase.ts`) with Expo SecureStore for token persistence
- Database schema migration (`supabase/migrations/001_schema.sql`):
  - `profiles` table with RLS policies + auto-create trigger on signup
  - `tasks` table with PostGIS spatial index + RLS for creator/helper access
  - `offers` table with RLS (helper creates, task creator accepts/rejects)
  - `messages` table with RLS + Supabase Realtime enabled
  - `reviews` table with RLS + trigger to recompute profile rating
- Auth store (`src/features/auth/store/useAuth.ts`) with Zustand:
  - Session/user/profile state, initialize, fetchProfile, updateProfile, signOut
  - Dev mode fallback: mock profile when Supabase env vars not set
- Auth screens:
  - `WelcomeScreen` — branded landing page with Get Started / Sign In
  - `PhoneEntryScreen` — phone number input with OTP send
  - `OTPScreen` — 6-digit code verification with resend
  - `OnboardingScreen` — role selection (Seeker/Helper/Both), name, skills picker
- Auth navigation (`src/navigation/AuthStack.tsx`) — step-based flow
- Auth-gated App.tsx: unauthenticated → auth flow, no profile → onboarding, ready → main tabs
- `.env.example` with Supabase env var template
- `.env` added to `.gitignore`

### Changed
- App.tsx now wraps NavigationContainer and conditionally renders auth/main
- RootNavigator renamed to MainTabs, NavigationContainer moved to App.tsx
- Fixed `expo-secure-store` version to match SDK 54

---

## [2025-09-21] — Initial UI Shell

### Added
- React Native Expo project setup with TypeScript
- Bottom tab navigation (Discover, Search, Post, Inbox, Profile)
- Home screen with dual-mode toggle (Hire Help / Jobs Near You)
- Scroll-driven header animations
- Service cards and job cards with horizontal carousels
- Search screen with debounced filtering
- Service detail screen with mini-map
- Task detail screen with offers list
- Post task screen (basic form)
- Full-screen map view
- Location picker bottom sheet with recent addresses
- Mock data repository with 30 helpers, 6 services, 1 task
- Helper ranking algorithm (distance, rating, experience)
- Zustand stores: useLocation, useFavorites, useAuth (stub)
- React Query integration for data fetching
- Ferrari Red (#E10600) theme with React Native Paper

### Not Yet Implemented
- Backend API (all data mocked)
- Authentication
- Real-time chat
- Payments / escrow
- Reviews display
- Push notifications
- Profile screen (stub)
- Inbox screen (stub)

---

## [2026-04-03] — Phase 0: Project Restructure & NativeWind

### Added
- NativeWind v4 + Tailwind CSS integration with custom config
- `tailwind.config.js` with brand colors (Red #E31B23, Black, White)
- `metro.config.js` with NativeWind preset
- `global.css` with Tailwind directives
- Feature-based folder structure: `src/features/{services,tasks,map,chat,profile}`
- `src/shared/` for types, components, hooks, lib, and stores
- Shared utilities: `constants.ts`, `geo.ts`, `useDebounced.ts`
- `nativewind-env.d.ts` type declarations

### Changed
- Migrated all screens and components from React Native Paper to NativeWind classes
- Restructured from screen-based to feature-based folder layout
- Updated all import paths across navigation, screens, and components
- Replaced Paper `Button`, `Text`, `Chip`, `Card`, `Searchbar` with RN primitives + Tailwind
- Updated Expo SDK dependencies to latest compatible versions
- Fixed TaskDetailScreen route params bug (`id` → `taskId`)
- Replaced deprecated `SafeAreaView` from RN with `react-native-safe-area-context`
- Installed missing peer deps: `expo-font`, `react-native-worklets`

### Removed
- `react-native-paper` dependency
- Old `src/screens/`, `src/components/`, `src/models/`, `src/services/`, `src/store/`, `src/mock/` directories
- `src/theme.ts` (Paper theme) — replaced by Tailwind config

---

## [2026-04-03] — Project Documentation

### Added
- `docs/context.md` — Project vision and requirements
- `docs/analysis.md` — Comprehensive codebase analysis
- `docs/implementation-plan.md` — Feature-by-feature build plan (9 phases)
- `CLAUDE.md` — Claude Code workflow instructions
- `CHANGELOG.md` — This changelog
