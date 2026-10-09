# MysteryCase CMS — Frontend Prototype Plan

A fully populated, working CMS for authoring 2D detective cases, shipping with the deeply connected demo case **CASE-001 — The Last Call**. Frontend only; mock repositories behind a clean API/WebSocket abstraction ready for a Bun backend.

## Platform notes (adaptations)
- Routing uses **TanStack Router** (the project's fixed router) instead of React Router — same URLs as requested (`/dashboard`, `/cases/$caseId/scenes`, ...). `/` redirects to `/dashboard`.
- No `src/app/App.tsx`; providers live in the root route. Everything else follows the requested folder structure (features/, repositories/, api/, websocket/, data/demo/, types/, schemas/...).
- Node graphs via **@xyflow/react** (React Flow), charts via **recharts**, forms via React Hook Form + Zod.

## Visual direction
Dark cinematic default: charcoal/navy sidebar, warm off-white (light) or deep graphite (dark) workspace, case-file typography (IBM Plex Sans + IBM Plex Mono for IDs/timestamps, a condensed serif accent for case titles). Red = critical/killer states, amber = clues/warnings, blue = info, green = published. Compact cards, thin borders, dense tables. Light/dark toggle.

## Build phases

1. **Foundation**: design tokens, theme toggle, app shell (sidebar with nav groups, workspace selector, profile/online status), top header (breadcrumbs, Ctrl+K global search, notifications, connection status), toasts.
2. **Architecture layer**: shared types (all ~30 listed), Zod schemas, `ApiClient`/`ApiError` + typed endpoints (using `VITE_API_URL`), repositories backed by demo data persisted to localStorage, TanStack Query hooks per feature, `WebSocketClient` + `MockWebSocketAdapter` + `WebSocketProvider` + `useWebSocket`/`useRealtimeEvent` (simulated status, app works offline).
3. **Demo data** (split per file in `data/demo/`): 4–6 cases across statuses, 3 suspects + victim, 8 locations, multiple scenes with hotspots (Living Room: Body, Phone, Wine Glass, Coffee Table, Window, Carpet, Sofa), 8 evidence items with inspection stages, 3 interviews with 20+ dialogue nodes (Sarah interview with evidence-gated branch), 10+ clues incl. red herrings, triggers/conditions, 10+ timeline events, investigation flow, theory, hints, solution, reveal, media, analytics, users/roles, notifications, audit log — all linked by IDs.
4. **Dashboard & Cases**: stats, pipeline, recent/popular cases, activity; cases list with filters, search, sort, table/grid, pagination, actions (edit, duplicate, preview, archive, publish/unpublish with confirmations); 11-step creation wizard with save-anytime.
5. **Case Editor** (sticky header, 12-step nav, autosave indicator, unsaved-changes guard, Validate/Publish):
   - Basic Info / Overview form
   - Scene builder: scene list, image canvas with draggable %-positioned hotspots, hotspot editor panel, thumbnails
   - Suspects, Evidence (CRUD, detail drawer, inspection stage editor with requirements)
   - Interview builder (React Flow, all node types, editable nodes, conditions)
   - Clues & Triggers with reusable AND/OR/NOT Condition Builder
   - Timeline builder, Investigation Flow graph (required/optional/locked/dead-end states), Case relationship graph
   - Solution (theory, hints, final solution, scoring/partial credit), Reveal sequence editor
   - Testing (QA panel: state, conditions evaluated live), Validation (PASS/WARNING/ERROR rules, blocks publishing), Publish (health, completeness, version, changelog, schedule, visibility)
6. **Player Preview**: full-screen mobile-frame player built from the same case data — briefing, scene investigation, evidence inspection, suspect profiles, interviews with evidence presentation, clues, timeline ordering, accusation, reveal, score — plus debug controls (restart, unlock all, show hidden, jump to scene/interview, exit).
7. **Workspace pages**: global Suspects, Locations, Evidence, Interviews, Clues, Timelines, Media Library (filters, upload-to-local, preview, replace, delete, usage), Analytics (charts), Players, Notifications, Users & Roles (permission matrix), Audit Log, Settings (all listed sections incl. API/WebSocket config).
8. **Images**: generate a set of cinematic assets (crime scene backgrounds, suspect portraits, evidence shots, case covers).

## Technical details
- Data flow: UI → feature hooks (React Query) → repositories (`DemoXRepository` implementing `XRepository` interface; swap to `ApiXRepository`) → api/endpoints → ApiClient.
- Autosave: debounced `saveCase` via repository (`PATCH /api/cases/:id` contract), status states Saving / Saved just now / Unsaved / Last saved time.
- Validation engine and condition evaluator are pure functions in `services/`, reused by Validation, Testing, and Preview.
- Env: `.env.example` with `VITE_API_URL`, `VITE_WS_URL`, `VITE_APP_ENV`.
- Each route gets its own head() metadata. Record architecture rules in AGENTS.md.

This is a very large build; it will be delivered in several passes, starting with foundation + architecture + demo data + dashboard/cases/editor core, then the visual editors, preview, and remaining pages.
