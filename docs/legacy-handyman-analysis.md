# Legacy Handyman - Analysis & Lessons Learned

> Predecessor project at `legacy-handyman/` — cloned from `github.com/adamturcan/handyman`

---

## Overview

Handyman was an earlier attempt at a local services marketplace built with React Native + Expo. It focused on connecting customers with handymen and agencies. The project has solid UI foundations but no backend integration — all API calls are stubbed out.

**Tech:** React Native 0.70.5, Expo ~47, React Navigation, Formik + Yup, apisauce, Lottie animations

---

## Ideas Worth Carrying Forward into Neighbourly

### 1. Role-Based Onboarding ("Who Are You?" screen)
The legacy app asks users to self-identify as **Customer**, **Handyman**, or **Agency** immediately after signup. This is excellent UX — it personalizes the experience from the start.

**Apply to Neighbourly:** Map to Seeker / Helper / Both roles during onboarding. Show role-specific home screens and features.

### 2. Tabbed Provider Profile (Services / About / Ratings)
Clean three-tab layout on provider profiles:
- **Services** — categorized list with price, duration, rating per service
- **About** — bio with "read more" expansion + media gallery (images + videos)
- **Ratings** — customer reviews tied to specific services

**Apply to Neighbourly:** Reuse this pattern for helper profiles. Add portfolio/gallery showing past work.

### 3. Per-Service Ratings (not just per-provider)
Ratings are tied to specific services, not just the provider overall. A handyman might be 5-star at plumbing but 3-star at electrical work.

**Apply to Neighbourly:** Track ratings per category/skill, show granular trust signals.

### 4. Media-Rich Profiles (Gallery with Video)
Providers can showcase their work with images AND videos in a horizontal gallery. Uses expo-av for video playback.

**Apply to Neighbourly:** Let helpers upload before/after photos of completed tasks, short video intros.

### 5. Reusable Form Component Library
Well-built Formik + Yup form system with reusable components:
- `AppForm` — wrapper with validation schema
- `AppFormField` — input with error display
- `SubmitButton` — auto-disabled on submit
- `ErrorMessage` — field-level error display

**Apply to Neighbourly:** Rebuild this pattern with Zod (already a dependency) instead of Yup. Same DRY approach.

### 6. Agency Role
The legacy app supported agencies (businesses with multiple handymen), not just individuals.

**Apply to Neighbourly:** Consider a future "Business" tier — cleaning companies, tutoring centers, etc.

### 7. Offline Detection
`OfflineNotice` component detects network loss and shows a banner.

**Apply to Neighbourly:** Add offline detection + queue actions for retry when connection returns.

---

## What the Legacy Got Wrong (Avoid These)

| Problem | Impact | Neighbourly Fix |
|---------|--------|-----------------|
| No backend integration | App is a shell, no real data | Supabase from Phase 1 |
| No state management | No global auth, no caching | Zustand + React Query (already in place) |
| Commented-out code everywhere | Confusing, hard to read | Clean code, no dead code |
| Empty stub screens (5 of 13) | Broken navigation flows | Build screens when needed, not before |
| Hardcoded sample data in components | Can't test real flows | Mock repo pattern (already done), then migrate to Supabase |
| No testing | No confidence in changes | Test on Simulator after every change |
| Outdated deps (Expo 47, RN 0.70) | Security + compatibility issues | Already on Expo 54, RN 0.81 |
| No location-based features | Core value prop missing | Maps + geolocation in Phase 3 |
| moment.js for dates | Heavy bundle size | Day.js (already in place, 10x smaller) |

---

## Component Inventory (Reuse Candidates)

| Legacy Component | Purpose | Neighbourly Equivalent |
|-----------------|---------|----------------------|
| ProfileItem | Provider card with photo, name, wage, rating | ServiceCard (already exists, better) |
| RatingCard | Review with stars + text | Build in Phase 5 (Reviews) |
| WhoCard | Role selector during onboarding | Build in Phase 1 (Auth) |
| GalleryList | Horizontal media scroll | ImageCarousel (already exists) |
| AboutMeCard | Bio with read-more | Build for Profile screen |
| OfflineNotice | No-connection banner | Reimplement with NetInfo |
| Form components | Formik form system | Rebuild with Zod |

---

## Data Model Comparison

| Concept | Handyman | Neighbourly |
|---------|----------|-------------|
| User roles | Customer, Handyman, Agency | Seeker, Helper, Both |
| Services | Nested by category, per-service pricing | Flat list with categories array |
| Ratings | Per-service, tied to customer name | Per-task, double-blind |
| Media | Gallery with images + videos | Photos on tasks (expand to gallery) |
| Location | Planned but not implemented | Core feature with geo queries |
| Payments | Not implemented | Stripe Connect escrow (Phase 6) |
| Messaging | ContactSellerForm (stub) | Supabase Realtime chat (Phase 4) |
| AI | None | Claude API agents (Phase 7) |

---

## Summary

The legacy handyman app was a **UI prototype** — good component design, clean form patterns, and smart UX ideas (role selection, tabbed profiles, per-service ratings). But it never connected to a backend and left most features incomplete.

Neighbourly already surpasses it in: state management, data architecture, animations, and real data flow (even if currently mocked). The key takeaways to absorb are the UX patterns — especially role-based onboarding, tabbed profiles with galleries, and per-service granular ratings.
