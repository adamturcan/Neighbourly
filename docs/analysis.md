# Neighborly - Solution Analysis

## 1. Overview

**Neighborly** is a location-based peer-to-peer services marketplace mobile application built with React Native and Expo. It connects service seekers with service providers in their local area -- similar to TaskRabbit or Fiverr, but focused on neighborhood/local help.

**Key capabilities:**
- Browse and discover service providers nearby
- Post tasks/jobs requesting help
- Browse jobs available near you as a potential helper
- Search and filter services by category
- View providers and tasks on an interactive map
- Location-based matching and discovery
- Escrow payment system (planned, not yet implemented)

**Current status:** Early-stage MVP with complete navigation flows, UI, and mock data. No backend integration yet.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.4 |
| Platform | Expo | 54.0.9 |
| Language | TypeScript | 5.9.2 |
| UI Library | React Native Paper | 5.14.5 |
| Navigation | React Navigation | 7.x |
| State Management | Zustand | 5.0.8 |
| Server State | TanStack React Query | 5.89.0 |
| Maps | react-native-maps | 1.20.1 |
| Location | expo-location | 19.0.7 |
| Animations | react-native-reanimated | 4.1.0 |
| Validation | Zod | 3.25.76 |
| Dates | Day.js | 1.11.18 |

---

## 3. Project Structure

```
/src
├── screens/                  # Full-screen views (app pages)
│   ├── HomeScreen.tsx        # Main discovery page with animated header
│   ├── SearchScreen.tsx      # Service search with live filter
│   ├── PostTaskScreen.tsx    # Create/post a new task
│   ├── ProfileScreen.tsx     # User profile (stub)
│   ├── InboxScreen.tsx       # Messages/offers (stub)
│   ├── InboxTaskScreen.tsx   # Task-specific inbox (stub)
│   ├── TaskDetailScreen.tsx  # View task & offers detail
│   ├── ServiceDetailScreen.tsx # View service provider details
│   ├── MapScreen.tsx         # Nested map view
│   └── FullMapScreen.tsx     # Full-screen map with all services
├── components/               # Reusable UI components
│   ├── ServiceCard.tsx       # Horizontal service provider card
│   ├── JobCard.tsx           # Task/job card
│   ├── LocationBar.tsx       # Address selector header
│   ├── LocationPickerSheet.tsx # Bottom sheet for location selection
│   ├── ImageCarousel.tsx     # Horizontal image slider
│   └── EscrowBanner.tsx      # Payment escrow status banner
├── navigation/               # Navigation structure
│   ├── RootNavigator.tsx     # Bottom tab navigation root
│   └── HomeStack.tsx         # Home tab nested stack navigator
├── services/                 # Data fetching & business logic
│   ├── repo.ts              # Mock data repository (simulates API)
│   └── match.ts             # Helper ranking algorithm
├── store/                    # Zustand state management stores
│   ├── useLocation.ts       # Location/address management
│   ├── useAuth.ts           # Authentication (empty stub)
│   └── useFavorites.ts      # Favorite services toggle
├── models/                   # TypeScript type definitions
│   └── types.ts             # Core data types
├── mock/                     # Mock data & seeding
│   └── seed.ts              # Demo data (30 helpers, 6 services, 1 task)
└── theme.ts                  # Global app theme (Ferrari Red primary)
```

---

## 4. Data Models

### User (Helper / Service Provider)
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| name | string | Display name |
| photoUrl | string? | Profile photo |
| skills | string[] | e.g. moving, chores, tutoring |
| rating | number | 0-5 stars |
| jobsDone | number | Completed jobs count |
| lat, lng | number | Location coordinates |

### Service
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| providerId | string | Link to User |
| title | string | e.g. "Lawn mowing" |
| categories | string[] | e.g. gardening, chores |
| photoUrl | string | Cover image |
| priceFrom | number | Starting price in EUR |
| rating | number | 0-5 stars |
| lat, lng | number | Service location |

### Task (Job Request)
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| title | string | Task name |
| description | string | Details |
| category | string | Task category |
| budget | number | Budget in EUR |
| status | enum | open, matched, in_progress, disputed, completed |
| requesterId | string | Who posted it |
| helperId | string? | Assigned helper |
| when | string | ISO timestamp |

### Offer
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| taskId | string | Related task |
| helperId | string | Who made the offer |
| amount | number | Proposed price |
| message | string? | Helper's message |

### Review
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| taskId | string | Related task |
| fromUserId | string | Reviewer |
| toUserId | string | Reviewed user |
| rating | number | 0-5 |
| comment | string? | Text review |

---

## 5. Navigation Architecture

```
Bottom Tabs (RootNavigator)
├── Discover  → HomeStack
│   ├── HomeMain        (discovery page with dual mode toggle)
│   ├── ServiceDetail   (service provider details + map)
│   ├── TaskDetail      (task offers view)
│   └── FullMap         (full-screen map of all services)
├── Search    → SearchScreen
├── Post      → PostTaskScreen
├── Inbox     → InboxScreen (stub)
└── Profile   → ProfileScreen (stub)
```

---

## 6. Key Features & Business Logic

### Dual-Mode Home Screen
The home screen toggles between two modes:
- **"Hire help"** -- browse service providers, grouped by category in horizontal carousels
- **"Jobs near you"** -- browse open tasks as a helper, grouped by category in a section list

The screen features scroll-driven header animations: the location bar stays fixed, the mode toggle collapses into a circular button, and background color transitions from white to soft red.

### Helper Ranking Algorithm (`services/match.ts`)
Candidates are ranked by:
1. Distance to task (closest first, Haversine formula)
2. Rating (highest first)
3. Jobs completed (most experienced first)

Returns top 3 matches.

### Mock Data Repository (`services/repo.ts`)
Repository pattern simulating a backend API with artificial delays (150-350ms). Operations include:
- `listServices()`, `getService(id)` -- service CRUD
- `listTasks()`, `getTask(id)`, `createTask()` -- task management
- `createOffer()`, `acceptOffer()` -- offer workflow
- `completeTask()`, `leaveReview()` -- completion flow
- `getNearbyHelpers()` -- location-based helper discovery

When a task is created, the system auto-generates 1 initial offer from a random helper at ~95% of the task budget.

### Location Management (Zustand store)
- Maintains current selected address and up to 6 recent addresses
- Seeded with Prague addresses (Home, Work, Gym)
- Center point: approximately 48.15N, 17.11E

---

## 7. UI / Design System

| Token | Value |
|-------|-------|
| Primary color | Ferrari Red (#E10600) |
| Accent | Black (#000000) |
| Background | White (#ffffff) |
| Surface | White (#ffffff) |
| Card dimensions | 220px x 260px |
| Component library | React Native Paper (Material Design) |

Key reusable components:
- **ServiceCard** -- fixed-size card with image, title, price, rating, distance
- **JobCard** -- fixed-size card with image, title, description, budget, categories
- **LocationBar** -- header with address and map marker icon
- **LocationPickerSheet** -- draggable bottom sheet with recent addresses, spring animations
- **EscrowBanner** -- payment status indicator
- **ImageCarousel** -- horizontal scrollable image list

---

## 8. State Management

### Zustand Stores
| Store | Purpose |
|-------|---------|
| `useLocation` | Current/recent addresses, setCurrent, addRecent |
| `useFavorites` | Toggle/check favorite services |
| `useAuth` | Empty stub for future authentication |

### React Query
Used for all data fetching with caching. Query keys:
- `['services', 'nearby']`
- `['tasks', 'open']`
- `['service', id]`
- `['task', id]`

---

## 9. Strengths

1. **Clean architecture** -- clear separation of concerns across screens, components, services, stores, and models
2. **Modern stack** -- up-to-date versions of React Native, Expo, and supporting libraries
3. **Type safety** -- full TypeScript with strict mode enabled
4. **Polished UI** -- advanced scroll-driven animations, spring-animated bottom sheets, smooth transitions
5. **Repository pattern** -- data layer is isolated behind a Promise-based API, making backend integration straightforward
6. **Dual-mode discovery** -- single screen serves both seekers and providers, maximizing engagement
7. **React Query integration** -- proper server state caching and management

---

## 10. Gaps & Areas for Improvement

### Not Yet Implemented
| Feature | Status |
|---------|--------|
| Backend API | All data is mocked in-memory |
| Authentication | Store exists but is empty |
| User profiles | Screen is a stub |
| Inbox / messaging | Screen is a stub |
| Payment / escrow | Banner exists but no logic |
| Image upload | Not implemented |
| Reviews display | Model exists, no UI |
| Push notifications | Not present |
| Real location services | Using hardcoded coordinates |

### Architectural Considerations
- **No backend** -- the biggest gap. All state resets on app restart. Needs API design and integration.
- **No authentication** -- no user identity, session management, or authorization.
- **No error handling** -- mock repo always succeeds; real API calls need error states, retries, and user feedback.
- **No offline support** -- no persistence layer or optimistic updates for poor connectivity.
- **No testing** -- no unit, integration, or E2E tests present.
- **Hardcoded location** -- seed data centers on Prague; real implementation needs dynamic geolocation.
- **Image hosting** -- currently uses hardcoded Unsplash URLs; needs proper image upload and CDN.
- **No input validation** -- PostTaskScreen has minimal validation; needs Zod schema enforcement (Zod is a dependency but not yet used).
- **Accessibility** -- no evidence of a11y labels or considerations.

---

## 11. Git History

| # | Message |
|---|---------|
| 1 | Initial commit |
| 2 | Add basic dependencies |
| 3 | Add first concept of home screen and navigation |

Early-stage repository with 3 commits. No branching strategy, CI/CD, or release process yet.

---

## 12. Development Commands

```bash
npm start          # Start Expo dev server
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on Web
```

---

## 13. Summary

Neighborly is a well-structured early-stage React Native marketplace app for local peer-to-peer services. The frontend foundation is solid -- modern tech stack, clean code organization, polished animations, and proper state management patterns. The app is ready for the next phase: backend API development, authentication, real payment integration, and comprehensive testing.
