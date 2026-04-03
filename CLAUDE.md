# Neighborly - Claude Code Instructions

## Project Structure
- **Root:** `/Users/adamturcan/Documents/data/private/neighborly/` — docs, CLAUDE.md
- **App:** `/Users/adamturcan/Documents/data/private/neighborly/neighborly/` — React Native Expo app (git repo)
- **Docs:** `/Users/adamturcan/Documents/data/private/neighborly/docs/` — context, analysis, implementation plan
- **Legacy ref:** `/Users/adamturcan/Documents/data/private/neighborly/legacy-handyman/` — old handyman codebase for reference

## Dev Environment
- macOS M4, Xcode iPhone Simulator (iPhone 17 Pro Max)
- React Native (Expo) project
- Run app: `cd neighborly && npx expo start --ios`
- TypeScript check: `cd neighborly && npx tsc --noEmit`

## Workflow Rules (MUST follow)

### 1. Changelog
- Every change MUST be logged in `neighborly/CHANGELOG.md`
- Format: `## [YYYY-MM-DD] — Short Title` with bullet points describing what changed
- Group by: Added, Changed, Fixed, Removed

### 2. Commit & Push
- After every meaningful change, commit with a descriptive message
- Push to remote after each commit
- Never batch unrelated changes into one commit
- Use conventional commit style: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`

### 3. Test
- After every code change, relaunch the app on the iPhone Simulator so the user sees changes immediately
- Run `npx expo start --ios --clear` to ensure a fresh bundle (Expo Go does NOT hot-reload reliably)
- Leave the Expo process running so the user can interact with the app
- Run `npx tsc --noEmit` to catch type errors before committing
- If tests exist, run them before committing
- Report test results to the user

### 4. Implementation Plan Tracking
- The implementation plan lives at `docs/implementation-plan.md`
- After completing any task, update the plan: change `[ ]` to `[x]` for done items
- Mark phases as ✅ COMPLETED with date when all sub-items are done
- Update the Execution Order Summary table status column
- If a task is deferred, add a note explaining where it moved to

### 5. UI Prototyping with 21st.dev
- Use the `mcp__magic__21st_magic_component_builder` tool to prototype and brainstorm UI components
- Use `mcp__magic__21st_magic_component_inspiration` to explore design ideas
- Use `mcp__magic__21st_magic_component_refiner` to iterate on components
- When the user asks to brainstorm, prototype, or explore UI ideas, use these tools first
- Adapt web components from 21st.dev to React Native equivalents

## Tech Stack
- **Frontend:** React Native (Expo) + NativeWind v4 + Tailwind CSS
- **Backend:** Supabase (Auth, PostgreSQL, Realtime) — not yet integrated
- **Payments:** Stripe Connect — not yet integrated
- **Maps:** react-native-maps (Mapbox or Google Maps for custom theme later)
- **AI:** Claude API via Supabase Edge Functions — not yet integrated
- **State:** Zustand + TanStack React Query
- **Validation:** Zod (installed, not yet used)

## Design System
- **Primary:** Ferrari Red `#E31B23`
- **Accent:** Black `#000000`
- **Background:** White `#FFFFFF`
- **Border Radius:** 16+ (modern rounded look) — Tailwind: `rounded-2xl`, `rounded-card`
- **Style:** Wolt/Bolt inspired, dark mode planned for Phase 8
- **Typography:** Bold headings (`font-extrabold`), clean sans-serif
- **Tokens:** Defined in `tailwind.config.js` under `theme.extend`

## Architecture
- Feature-based folder structure: `src/features/{services,tasks,map,chat,profile}/`
- Shared code in `src/shared/` (types, components, hooks, lib, stores)
- Navigation in `src/navigation/`
- Mock data layer in `src/shared/lib/repo.ts` (to be replaced by Supabase in Phase 1)
- See `docs/implementation-plan.md` for full phase breakdown with progress tracking

## Key Docs
- `docs/context.md` — Vision, core loop, tech stack, AI agents, DB schema
- `docs/analysis.md` — Codebase analysis (written before Phase 0)
- `docs/implementation-plan.md` — Feature-by-feature build plan with ✅/⬜ tracking
- `docs/legacy-handyman-analysis.md` — Lessons learned from predecessor app
