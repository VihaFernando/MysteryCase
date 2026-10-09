# MysteryCase CMS — Pending Frontend Tasks

The app builds and runs. Every screen below exists as a route but renders a
`Pending` placeholder (`src/features/workspace/Pending.tsx`) unless marked done.
All data access must go through `src/hooks/queries.ts` → `src/repositories/*`
(never call `localDb` / `ApiClient` from components). Case editors read/write the
working copy via `useCaseDraft()` (`bundle`, `update`) which autosaves.

## Done
- Architecture: `api/`, `repositories/` (localStorage mock), `websocket/` (typed client + adapters), `services/` (conditionEngine, validation, scoring, search, caseFactory), TanStack Query hooks, autosave draft provider.
- Full CASE-001 demo data (`src/data/demo/*`).
- Layout: sidebar, header, Ctrl+K search, notifications popover, realtime status, theme provider.
- Dashboard, Cases list (filter/sort/grid/table/pagination/actions), New case wizard.
- Case editor shell + Overview, Basic info, Crime scenes (hotspot builder), Suspects, Evidence (+ inspection stages).
- Interview builder (React Flow branching dialogue) — `features/interviews/InterviewBuilder.tsx`.
- Investigation flow graph — `features/investigation-flow/InvestigationFlowPage.tsx`.
- Player preview — `features/preview/{PlayerPreview,PhoneScreens}.tsx`, engine in `services/previewEngine.ts` (tested in `src/test/previewEngine.test.ts`).
- Workspace pages: cross-case libraries, Media library, Analytics — `features/workspace/{LibraryPages,MediaPage,AnalyticsPage}.tsx`.
- Workspace pages: Players, Notifications, Users & Roles, Audit log, Settings — `features/workspace/*Page.tsx`.
- Testing / Publish / Validation — `features/cases/testing/TestingPanel.tsx`, `features/cases/publish/{PublishSection,ValidationScreen}.tsx`.
- Reveal — `features/reveals/RevealBuilder.tsx` (ordered scenes, media-library pickers, play-through preview).
- Solution — `features/solutions/SolutionSection.tsx` (answer, ordered timeline, theories, hints, scoring config + live preview).
- Timeline builder — `features/timelines/TimelineBuilder.tsx` (drag/arrow reorder, claim-vs-truth contradiction highlighting).
- Clues & Triggers — `features/clues/CluesSection.tsx` (clue CRUD, connections + graph, triggers with ConditionBuilder).

## Case editor sections (placeholder → build)
1. ~~Clues & Triggers~~ — done.
2. ~~Timeline~~ — done.
3. ~~Solution~~ — done.
4. ~~Reveal~~ — done.
5. ~~Testing~~, 6. ~~Publish~~, 7. ~~Validation~~ — done.

## Player preview
~~8.~~ done.

## Workspace pages (routes `src/routes/_cms.<name>.tsx`)
~~9.~~ ~~10.~~ ~~11.~~ done.
~~12.~~ done.
~~13.~~ done.
~~14.~~ done.
~~15.~~ done.
~~16.~~ done.

## Quality / polish
Done:
- Strict tsconfig flags re-enabled (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`); domain types now declare optional props as `?: T | undefined`.
- `src/components/ui/chart.tsx` is type-checked again (no `@ts-nocheck`); Recharts v3 injected props are typed locally.
- Unit tests for `conditionEngine`, `previewEngine`, `scoring` and `validation` (17 tests).
- Loading/error/empty states on all workspace pages added in this pass.
- `.env.example` added.

Demo case fixes (CASE-001 is now fully solvable; `src/test/solvability.test.ts` plays it end to end and the editor's Validation flags unreachable evidence/locations):
- Added Bedroom, Pharmacy, Parking and Office scenes with hotspots, plus the missing corridor hotspots (receipt, notice board).
- **The four new scene images (`scene-bedroom|pharmacy|parking|office.jpg`) are generated placeholders** — replace them with real art (Media Library → Replace image).

Still open:
- Prettier: `eslint .` reports ~2,500 `prettier/prettier` errors across the whole codebase (it was never formatted to `.prettierrc`). Run `bun run format` once, ideally in its own commit, so it doesn't bury real changes.
- Light theme visual QA; mobile layout of the case editor and workspace tables (needs a real browser pass — not checked).
- Deeper validation-rule tests (dialogue reachability, trigger references).
- When backend exists: swap demo repositories for `ApiClient`-based ones and set `VITE_API_URL` / `VITE_WS_URL`.
