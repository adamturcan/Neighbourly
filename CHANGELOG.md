# Changelog

All notable changes to the Neighborly project will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/)

---

## [2026-04-03] — Phase 1: Supabase Foundation & Auth

### Changed
- Added "Dev Sign In" button on WelcomeScreen (auto-creates dev@neighbourly.local account)
- Replaced phone/SMS auth with Apple Sign-In + Google OAuth + Email magic link
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
