# Implementation Plan: Advanced Filter Builder

**Branch**: `001-advanced-filter-builder` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-advanced-filter-builder/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A single-page, client-only filter builder over a static 40-employee mock dataset. Users compose a two-level tree of AND/OR groups and field/operator/value conditions; the table re-renders matching rows and a match count on every edit, a plain-language sentence above the table describes the active filter, and the whole tree round-trips through a single base64url-encoded JSON query parameter (synced via `history.replaceState`, no router). No backend, no persistence beyond the URL, no new runtime dependencies — built with React state/hooks and plain TypeScript functions for tree evaluation, sentence generation, and URL encode/decode.

## Technical Context

**Language/Version**: TypeScript ~6.0.2 (strict mode, `noUnusedLocals`/`noUnusedParameters`), React 19.2

**Primary Dependencies**: React 19 + Tailwind CSS v4 (already in the project), plus Zod (already in `package.json`) for declarative, schema-based condition-value validation (FR-021, per spec.md Assumptions). No router, no state-management library, no URL/query-string library, no date-formatting library, no debounce library — the feature is one page with native browser APIs (`URLSearchParams`, `history.replaceState`, `btoa`/`atob`, `Intl.NumberFormat`) and plain `useState`/`useEffect`/`setTimeout` covering everything else it needs, including the FR-025 debounce.

**Storage**: N/A — a static, bundled mock dataset of 40 employees held in memory; the URL query string is the only place filter state is externalized (not a persistence layer).

**Testing**: None configured in this project (no Vitest/Jest in `package.json`). Per the constitution, tasks get a concrete manual repro step instead; test infrastructure is out of scope unless explicitly requested.

**Target Platform**: Browser, single Vite-built page (existing `index.html` → `src/main.tsx` → `src/App.tsx` entry chain).

**Project Type**: Single frontend project (existing Vite + React scaffold) — no frontend/backend split.

**Performance Goals**: Filter edits must re-render with no perceptible delay (SC-002). Trivial at this scale (40 rows, ≤2 tree levels) — no memoization or virtualization strategy is required beyond straightforward React re-renders.

**Constraints**: Two-level tree strictly enforced (root group + at most one nested group inside it, no third level); strict TypeScript throughout (discriminated unions for condition vs. group, no `any`); no plain CSS beyond the existing Tailwind v4 setup; URL must degrade to an empty filter on any decode/validation failure, never throw or show an error; `hireDate` matches only the specified day/month/year component, independent of the other two (FR-018), using constrained inputs so no invalid-value fallback is needed; a condition's entered value MUST be validated against its field/operator's Zod schema before being applied to filtering, with an invalid value treated as unset for matching purposes while its inline error stays visible (FR-021/FR-022); salary and hire date table cells MUST use fixed presentational formatting (thousands-separated integer, `D MMM YYYY`) that never changes the underlying value used for filtering or URL encoding (FR-019/FR-020); a group's condition rows MUST align into consistent columns and a nested group MUST be visually distinguishable from its parent (FR-023/FR-024); free-text/numeric condition-value edits (`name`, `salary`, `hireDate` day/year) MUST debounce table/count re-evaluation by a short fixed delay (~300ms) after the user stops typing, while selection-based edits (`country`, `isActive`, `hireDate` month) MUST continue to update immediately (FR-025); on viewports narrower than Tailwind's `md` breakpoint (768px), each condition's remove control MUST render outside the field/operator/value row while staying reachable with one tap, with no change to the existing inline placement at `md` and above (FR-026).

**Scale/Scope**: 1 page, 40 static rows, 1 filter tree, 5 fields (`name`, `country`, `salary`, `isActive`, `hireDate`), ≤2 nesting levels.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Readability First** — PASS. Field/operator/value-input rules are centralized in one config map (`fieldConfig.ts`) rather than scattered conditionals; adding a hypothetical future field would mean one new map entry, not edits across files.
- **II. Deliberate, Incremental Delivery** — PASS (process gate, applies at `/speckit-tasks` + `/speckit-implement` time). This plan itself is one step; implementation will be sequenced story-by-story per the spec's priorities (P1 → P4).
- **III. Minimal Scope (YAGNI)** — PASS. No router, no state library, no persistence layer, no saved presets — all explicitly excluded by the spec's Assumptions. No abstraction is introduced for a second implementation that doesn't exist (e.g., no generic "tree" package, just the one filter tree). Zod is the one exception to "no new dependency," and it is justified, not speculative: FR-021 explicitly requires a declarative, schema-based validation approach, the spec's Assumptions name Zod directly as a deliberate exception to "no implementation details," and it is already present in `package.json` — this plan reuses it rather than introducing it.
- **IV. Surgical Changes Only** — PASS (applies at implementation time; nothing pre-existing is touched by this plan beyond `App.tsx` wiring in the feature).
- **V. Clear Structure & Separation of Concerns** — PASS. Tree evaluation, sentence generation, and URL encode/decode are plain TS functions with no React/framework imports (`filterEngine.ts`, `urlState.ts`); components (`FilterBuilder.tsx`, `FilterGroup.tsx`, `FilterCondition.tsx`, `EmployeeTable.tsx`) call them and stay render-focused, each kept under 150 lines.
- **VI. Extension Through Configuration, Not Branching** — PASS. Per-field operator lists live in one config map keyed by field (`fieldConfig.ts`); value-input kind is keyed by *operator* within that map (not just by field), since `hireDate`'s three operators (`day_is`/`month_is`/`year_is`) each need a different input, unlike every other field's operators which share one input kind. This stays data, not branching — FilterCondition.tsx still switches on a `valueKind` value read from config, never on `field` or `operator` directly (FR-003/FR-004).
- **VII. Strict TypeScript** — PASS. Condition vs. group is a discriminated union; field, operator, and value types are narrow (no `string`/`object` catch-alls); `unknown` + narrowing is used when decoding untrusted URL JSON.

No violations — Complexity Tracking table is not needed.

**Post-Phase 1 re-check**: [data-model.md](./data-model.md) and [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) confirm the design stays within the above gates — notably, the root-vs-nested `FilterGroup` asymmetry (Principle VI) is enforced with one type plus a validated rule rather than two type-level variants, and URL decoding narrows `unknown` field-by-field with no schema-validation dependency (Principle VII, III — this is a separate trust boundary from condition-value validation, see research.md §5 vs. §10). Adding `hireDate` (User Story 5) reused the same `FilterCondition`/`FilterGroup` types and config-map pattern with no new entity or component — only `Field`/`Operator` grew by one and three variants respectively, and `fieldConfig.ts` grew by one entry, matching Principle I's "adding one more thing means adding data in one place." Adding value validation (User Story 6) and layout/alignment (User Story 7) followed the same pattern: one new per-field/operator Zod schema map (`validation.ts`) keyed the same way as `fieldConfig.ts`, one new presentational `format.ts` module, and Tailwind grid-column classes applied uniformly in `FilterCondition.tsx`/`FilterGroup.tsx` rather than per-field markup — no new component, no new branching. No new violations introduced; Complexity Tracking remains empty.

Adding debounce (User Story 1 Scenario 5) and mobile remove-control placement (User Story 8) follows the same pattern and needs no new files: whether a `valueKind` debounces is a `boolean` read off the same `fieldConfig.ts` entry that already drives its input control (`text`/`number`/`day`/`year` → debounced, `select`/`month`/`none` → immediate) — one config field, not a new `if` on field/operator (Principle VI) — and is applied with local `useState`/`useEffect`/`setTimeout` inside `FilterCondition.tsx`, inlined there rather than as a separate hook file since it has exactly one caller (Principle III). The mobile remove-control repositioning is a Tailwind responsive-class change to the same grid in `FilterCondition.tsx` (single-column below `md`, existing fixed-column grid at `md` and above) — layout only, no new component, no behavior change to what the remove control does. No new violations introduced; Complexity Tracking remains empty.

User Story 9 (FR-027, FR-028, SC-012) extracts the debounce state that had accumulated inline in `FilterCondition.tsx` (a ref plus two `useState`s plus two `useEffect`s) into one new file, `useDebouncedValue.ts` — this reverses the "inline it, one caller doesn't justify a file" call made above and in research.md §13, because the spec now explicitly requires the mechanism to be one named unit (Principle I, Readability, which precedes Principle III, Scope, per CLAUDE.md's conflict-resolution rule — see research.md §15 for the full rationale). This is still PASS under every gate: it's a behavior-preserving refactor (FR-028; no new user-facing capability, no new component, no wire-shape change per data-model.md), the hook stays narrowly scoped to its one real caller rather than generalized for hypothetical reuse (Principle III still governs the hook's internal shape), and its inputs/outputs are strictly typed with no `any` (Principle VII). No new violations introduced; Complexity Tracking remains empty.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx                              # unchanged entry point
├── App.tsx                               # renders <FilterBuilder /> (existing scaffold, wired in)
├── index.css                             # unchanged (single @import "tailwindcss";)
├── data/
│   └── employees.ts                      # static 40-employee mock dataset + Employee type (incl. hireDate: "YYYY-MM-DD")
└── features/
    └── filter-builder/
        ├── types.ts                      # Field, Operator, FilterCondition, FilterGroup (discriminated union), FilterNode
        ├── fieldConfig.ts                # per-field operator list + per-operator value-input kind (config map, drives FR-003/FR-004); month-name options for hireDate's month selector
        ├── validation.ts                 # per-field/operator Zod schema map + validateConditionValue(condition) → { valid, parsed | error } (FR-021/FR-022, research.md §10)
        ├── format.ts                     # plain functions: formatSalary, formatHireDate — presentational only, no framework imports (FR-019/FR-020, research.md §11)
        ├── filterEngine.ts               # plain functions: evaluateNode, matchCount, describeFilter (sentence), hireDate component extraction — no framework imports; evaluateNode treats an invalid condition value as vacuous via validation.ts
        ├── urlState.ts                   # plain functions: encodeFilterToParam, decodeFilterFromParam (base64url + JSON, validates against fieldConfig)
        ├── useFilterUrlSync.ts            # hook: reads filter from URL on mount, writes via history.replaceState on every change
        ├── useDebouncedValue.ts           # hook: owns local in-progress value, re-sync on external value change, and delayed commit — the single unit of logic for FR-025's debounce behavior (FR-027/FR-028, research.md §15)
        ├── FilterBuilder.tsx             # top-level: owns filter tree state, renders sentence + FilterGroup(root) + EmployeeTable
        ├── FilterGroup.tsx               # renders AND/OR toggle, child conditions/nested group, add-condition/add-group/remove controls; nested groups get a distinguishing indent/border (FR-024)
        ├── FilterCondition.tsx           # renders one condition's field/operator/value controls in aligned grid columns (FR-023, single-column below `md` / fixed columns at `md`+ for FR-026), using fieldConfig + validation.ts, showing an inline error on invalid value (FR-022); calls useDebouncedValue for text/number/day/year valueKinds (FR-025/FR-027), commits immediately for select/month/none kinds
        └── EmployeeTable.tsx             # renders header + matching rows (salary/hireDate formatted via format.ts), or the "No data matching the filter" state
```

**Structure Decision**: Single existing Vite + React project — no new project or package boundary. A new `src/features/filter-builder/` module holds this feature end to end (types, config, pure engine/URL logic, and components), matching Principle V's separation of plain business-logic functions from rendering components; `src/data/employees.ts` holds the static dataset separately since it's not filter-specific. No `tests/` tree is added — no test runner is configured (see Technical Context → Testing), so `/speckit-tasks` will specify manual repro steps instead.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
