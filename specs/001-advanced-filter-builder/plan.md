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

**Constraints**: Two-level tree strictly enforced (root group + any number of nested groups directly inside it, each nested group flat — no third level, per the 2026-07-28 amendment superseding the original "at most one nested group" cap); a single "Clear All" control MUST reset the entire tree (every condition, every nested group) to one empty root group in one action with no confirmation step, updating rows/count/sentence/URL immediately, and MUST be a no-op when the filter is already empty (FR-036/FR-037); every interactive control (add/remove condition, add/remove group, field/operator/value inputs, the AND/OR toggle, Clear All) MUST be operable via keyboard alone and carry a programmatic label for assistive technology, with no live/spoken announcements required for dynamic changes (FR-038); strict TypeScript throughout (discriminated unions for condition vs. group, no `any`); no plain CSS beyond the existing Tailwind v4 setup; URL must degrade to an empty filter on any decode/validation failure, never throw or show an error; `hireDate` matches only the specified day/month/year component, independent of the other two (FR-018), using constrained inputs so no invalid-value fallback is needed; a condition's entered value MUST be validated against its field/operator's Zod schema before being applied to filtering, with an invalid value treated as unset for matching purposes while its inline error stays visible (FR-021/FR-022); salary and hire date table cells MUST use fixed presentational formatting (thousands-separated integer, `D MMM YYYY`) that never changes the underlying value used for filtering or URL encoding (FR-019/FR-020); a group's condition rows MUST align into consistent columns and a nested group MUST be visually distinguishable from its parent (FR-023/FR-024); free-text/numeric condition-value edits (`name`, `salary`, `hireDate` day/year) MUST debounce table/count re-evaluation by a short fixed delay (~300ms) after the user stops typing, while selection-based edits (`country`, `isActive`, `hireDate` month) MUST continue to update immediately (FR-025); on viewports narrower than Tailwind's `md` breakpoint (768px), each condition's remove control MUST render outside the field/operator/value row while staying reachable with one tap, with no change to the existing inline placement at `md` and above (FR-026); a condition currently failing validation MUST be excluded from the URL-encoded tree entirely (dropped from its parent group before encoding), not merely marked invalid within it (FR-013, clarified 2026-07-28 — see [contracts/filter-url-schema.md](./contracts/filter-url-schema.md)); the condition-row's field-change/operator-change/value-commit logic MUST be owned by one custom hook with the component limited to rendering its return value, and the decision of whether a value commits immediately or is staged/debounced MUST come from field/operator configuration data rather than an inline conditional (FR-029/FR-030); each value-kind's input control MUST be resolved through one lookup map with no per-field/per-value-kind conditional rendering left in the component (FR-031); the top-level filter page MUST contain no logic beyond composing child components and calling hooks/functions defined elsewhere, including the pluralized match-count text (FR-032); every module (the `filter-builder` feature and the shared debounce hook's new home) MUST expose its public API through a single entry file that no file inside that module imports back from (FR-033); the debounce mechanism MUST be relocated outside `filter-builder` to a shared, project-level location as a generic wrapper with no filter-specific reference (FR-034); none of this restructuring (FR-029–FR-034) may change any previously-specified user-facing behavior (FR-035).

**Scale/Scope**: 1 page, 40 static rows, 1 filter tree, 5 fields (`name`, `country`, `salary`, `isActive`, `hireDate`), ≤2 nesting levels.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Readability** — PASS. Field/operator/value-input rules are centralized in one config map (`fieldConfig.ts`) rather than scattered conditionals; adding a hypothetical future field would mean one new map entry, not edits across files.
- **II. Deliberate, Incremental Delivery** — PASS (process gate, applies at `/speckit-tasks` + `/speckit-implement` time). This plan itself is one step; implementation will be sequenced story-by-story per the spec's priorities (P1 → P4).
- **III. Simplicity** — PASS. No router, no state library, no persistence layer, no saved presets — all explicitly excluded by the spec's Assumptions. No abstraction is introduced for a second implementation that doesn't exist (e.g., no generic "tree" package, just the one filter tree). Zod is the one exception to "no new dependency," and it is justified, not speculative: FR-021 explicitly requires a declarative, schema-based validation approach, the spec's Assumptions name Zod directly as a deliberate exception to "no implementation details," and it is already present in `package.json` — this plan reuses it rather than introducing it.
- **IV. Surgical Changes Only** — PASS (applies at implementation time; nothing pre-existing is touched by this plan beyond `App.tsx` wiring in the feature).
- **V. Layer Separation** — PASS. Tree evaluation, sentence generation, and URL encode/decode are plain TS functions with no React/framework imports (`filterEngine.ts`, `urlState.ts`); components (`FilterBuilder.tsx`, `FilterGroup.tsx`, `FilterCondition.tsx`, `EmployeeTable.tsx`) call them and stay render-focused, each kept under 150 lines.
- **VI. Extension by Data** — PASS. Per-field operator lists live in one config map keyed by field (`fieldConfig.ts`); value-input kind is keyed by *operator* within that map (not just by field), since `hireDate`'s three operators (`day_is`/`month_is`/`year_is`) each need a different input, unlike every other field's operators which share one input kind. This stays data, not branching — FilterCondition.tsx still switches on a `valueKind` value read from config, never on `field` or `operator` directly (FR-003/FR-004).
- **VII. Strict TypeScript** — PASS. Condition vs. group is a discriminated union; field, operator, and value types are narrow (no `string`/`object` catch-alls); `unknown` + narrowing is used when decoding untrusted URL JSON.
- **VIII. Module Boundaries** — PASS (as of this refactor). `src/features/filter-builder/index.ts` now exports the module's sole public symbol, `FilterBuilder`; `App.tsx` imports it from `./features/filter-builder` rather than reaching into the internal `FilterBuilder.tsx` file. Everything else in the module (types, config, engine, hooks, subcomponents) stays internal and unexported, free to change without affecting consumers. No wildcard re-exports; no file inside the module imports from its own `index.ts`. User Story 12 (FR-033) extends this same rule to a second module: `src/hooks/`, created by User Story 13's relocation (see below), gets its own `index.ts` exporting `useDebouncedCommit` as its sole public symbol, under the identical no-wildcard/no-self-import gate.
- **IX. Testing** — N/A. No test runner is installed in this project yet (see Technical Context → Testing), so the mandatory-tests gate for logic files does not apply; manual repro steps remain the success criterion per the Development Workflow guidance.

No violations — Complexity Tracking table is not needed.

**Post-Phase 1 re-check**: [data-model.md](./data-model.md) and [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) confirm the design stays within the above gates — notably, the root-vs-nested `FilterGroup` asymmetry (Principle VI) is enforced with one type plus a validated rule rather than two type-level variants, and URL decoding narrows `unknown` field-by-field with no schema-validation dependency (Principle VII, III — this is a separate trust boundary from condition-value validation, see research.md §5 vs. §10). Adding `hireDate` (User Story 5) reused the same `FilterCondition`/`FilterGroup` types and config-map pattern with no new entity or component — only `Field`/`Operator` grew by one and three variants respectively, and `fieldConfig.ts` grew by one entry, matching Principle I's "adding one more thing means adding data in one place." Adding value validation (User Story 6) and layout/alignment (User Story 7) followed the same pattern: one new per-field/operator Zod schema map (`validation.ts`) keyed the same way as `fieldConfig.ts`, one new presentational `format.ts` module, and Tailwind grid-column classes applied uniformly in `FilterCondition.tsx`/`FilterGroup.tsx` rather than per-field markup — no new component, no new branching. No new violations introduced; Complexity Tracking remains empty.

Adding debounce (User Story 1 Scenario 5) and mobile remove-control placement (User Story 8) follows the same pattern and needs no new files: whether a `valueKind` debounces is a `boolean` read off the same `fieldConfig.ts` entry that already drives its input control (`text`/`number`/`day`/`year` → debounced, `select`/`month`/`none` → immediate) — one config field, not a new `if` on field/operator (Principle VI) — and is applied with local `useState`/`useEffect`/`setTimeout` inside `FilterCondition.tsx`, inlined there rather than as a separate hook file since it has exactly one caller (Principle III). The mobile remove-control repositioning is a Tailwind responsive-class change to the same grid in `FilterCondition.tsx` (single-column below `md`, existing fixed-column grid at `md` and above) — layout only, no new component, no behavior change to what the remove control does. No new violations introduced; Complexity Tracking remains empty.

User Story 9 (FR-027, FR-028, SC-012) extracts the debounce state that had accumulated inline in `FilterCondition.tsx` (a ref plus two `useState`s plus two `useEffect`s) into one new file, `useDebouncedValue.ts` — this reverses the "inline it, one caller doesn't justify a file" call made above and in research.md §13, because the spec now explicitly requires the mechanism to be one named unit (Principle I, Readability, which precedes Principle III, Scope, per CLAUDE.md's conflict-resolution rule — see research.md §15 for the full rationale). This is still PASS under every gate: it's a behavior-preserving refactor (FR-028; no new user-facing capability, no new component, no wire-shape change per data-model.md), the hook stays narrowly scoped to its one real caller rather than generalized for hypothetical reuse (Principle III still governs the hook's internal shape), and its inputs/outputs are strictly typed with no `any` (Principle VII). No new violations introduced; Complexity Tracking remains empty.

User Stories 10-13 (FR-029–FR-035, SC-013–SC-016) are a second, larger maintainability-only refactor pass and remain PASS under every gate:
- **Story 10** (FR-029/FR-030/FR-031) consolidates `FilterCondition.tsx`'s field/operator/value-commit handling into one hook, `useConditionRow.ts` (Principle V — logic in a hook, component stays render-focused; Principle I — the mechanism is one named unit, not state scattered across a component), and resolves the value-input control through the already-implemented `ValueInput.tsx` lookup map (Principle VI — a map keyed by `ValueKind`, not per-field `if`s, since seven variants that grow with each new field is exactly the "3+ branches likely to grow" case the constitution requires a map for). This isn't a second implementation seeking a reason to exist — it's required directly by FR-029/FR-031, so Principle III's "no caller yet" objection doesn't apply.
- **Story 11** (FR-032) moves the match-count text into `describeMatchCount`, a new plain function alongside the existing `describeFilter` in `filterEngine.ts` — "one more of an existing thing" (Principle I's test), not a new file, since `filterEngine.ts` already owns sibling text-derivation logic with no framework imports (Principle V).
- **Stories 12-13** (FR-033/FR-034) relocate the debounce hook to a second module, `src/hooks/`, with its own `index.ts` entry point (Principle VIII, extended above) and rename it to `useDebouncedCommit` to reflect that it now carries no filter-specific concept, satisfying SC-013's "reusable without learning any filter-specific concept" directly rather than only structurally.
- All four stories are explicitly required to preserve every previously-specified behavior unchanged (FR-035) — this is a structural-only pass with no new field, entity, or wire-shape change (research.md §16-§19, data-model.md → "Condition-row hook and shared debounce hook"). No new violations introduced; Complexity Tracking remains empty.

The 2026-07-28 amendment (Story 3 revised, FR-007/FR-008; Story 14, FR-036/FR-037; FR-038) remains PASS under every gate:
- **Story 3's relaxed depth rule** (multiple nested groups instead of at most one) changes a runtime-enforced count check, not the type shape — `FilterGroup` stays the single type from data-model.md's "one type plus a validated rule" decision (Principle VI: no `RootFilterGroup`/`NestedFilterGroup` split introduced just because the count changed). `FilterGroup.tsx`'s "add group" control becomes available whenever the current group is the root, full stop, rather than "root and no nested group exists yet" — one condition dropped, not a new branch added (Principle VI's gate is unaffected either way). `describeFilter`'s nested-group join logic already iterates `children` generically; going from "at most one nested-group child" to "any number" is the same `.map`/`.join` over a longer array, not new conditional logic (research.md §21).
- **Story 14's Clear All** (FR-036/FR-037) is one new plain function, `createEmptyFilter()`, alongside `filterEngine.ts`'s existing tree-shaping helpers, and one new button in `FilterBuilder.tsx` that calls the existing `onChange`/URL-sync setter with that empty tree — reusing the same single state-update path every other edit already goes through (no new state, no new sync mechanism). This keeps `FilterBuilder.tsx` as pure composition (Principle V/FR-032: the button wires an existing handler to an existing plain function, it doesn't compute anything itself).
- **FR-038's accessibility requirement** adds no new component or file — it's `aria-label`/`<label>` attributes and native interactive elements (`<button>`, `<select>`, `<input>`) already used throughout `FilterCondition.tsx`/`FilterGroup.tsx`, which are keyboard-operable by default with no custom key-handling code needed (research.md §22). This is data (label strings) added to existing markup, not new branching logic (Principle VI is not implicated).
- No previously-specified behavior changes (the amendment is additive/relaxing, not restructuring); no new violations introduced; Complexity Tracking remains empty.

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
├── hooks/
│   ├── index.ts                          # module public API: re-exports useDebouncedCommit only (Article VIII, FR-033)
│   └── useDebouncedCommit.ts             # relocated from filter-builder/useDebouncedValue.ts, renamed; generic (value, onCommit, delayMs) hook with no filter-specific reference (FR-034, research.md §19)
└── features/
    └── filter-builder/
        ├── index.ts                       # module public API: re-exports FilterBuilder only (Article VIII)
        ├── types.ts                      # Field, Operator, FilterCondition, FilterGroup (discriminated union), FilterNode
        ├── fieldConfig.ts                # per-field operator list + per-operator value-input kind (config map, drives FR-003/FR-004); month-name options for hireDate's month selector
        ├── validation.ts                 # per-field/operator Zod schema map + validateConditionValue(condition) → { valid, parsed | error } (FR-021/FR-022, research.md §10)
        ├── format.ts                     # plain functions: formatSalary, formatHireDate — presentational only, no framework imports (FR-019/FR-020, research.md §11)
        ├── filterEngine.ts               # plain functions: evaluateNode, matchCount, describeFilter (sentence, extended to join any number of nested groups — research.md §21), describeMatchCount (FR-032, research.md §18), createEmptyFilter (FR-036, research.md §20), hireDate component extraction — no framework imports; evaluateNode treats an invalid condition value as vacuous via validation.ts
        ├── urlState.ts                   # plain functions: encodeFilterToParam (drops any condition currently failing validation.ts before encoding, FR-013), decodeFilterFromParam (base64url + JSON, validates against fieldConfig)
        ├── useFilterUrlSync.ts            # hook: reads filter from URL on mount, writes via history.replaceState on every change
        ├── useConditionRow.ts             # hook: owns field-change/operator-change/value-commit handling for one condition, calling useDebouncedCommit (from src/hooks) for debounced valueKinds; returns config/valueKind/displayValue/validation/handlers for FilterCondition.tsx to render (FR-029/FR-030, research.md §16)
        ├── FilterBuilder.tsx             # top-level: pure composition — useFilterUrlSync + filterEmployees, renders sentence (describeMatchCount) + FilterGroup(root) + EmployeeTable + a "Clear All" button wired to createEmptyFilter (FR-036/FR-037, research.md §20), no inline logic (FR-032, research.md §18)
        ├── FilterGroup.tsx               # renders AND/OR toggle, child conditions/any number of sibling nested groups, add-condition/add-group/remove controls (add-group stays available after one nested group exists, FR-007); nested groups get a distinguishing indent/border applied uniformly per instance (FR-024); every control keyboard-operable with an aria-label (FR-038, research.md §22)
        ├── FilterCondition.tsx           # renders one condition's field/operator/value controls in aligned grid columns (FR-023, single-column below `md` / fixed columns at `md`+ for FR-026) from useConditionRow's return value only — no field/operator/valueKind branching of its own (FR-029); every select/input/remove-button carries a visible `<label>` or `aria-label` (FR-038, research.md §22)
        ├── ValueInput.tsx                # ValueKind → input-control lookup map (text/number/select/day/month/year/none), each a small presentational component; FR-031, research.md §17
        └── EmployeeTable.tsx             # renders header + matching rows (salary/hireDate formatted via format.ts), or the "No data matching the filter" state
```

**Structure Decision**: Single existing Vite + React project — no new project or package boundary. A new `src/features/filter-builder/` module holds this feature end to end (types, config, pure engine/URL logic, and components), matching Principle V's separation of plain business-logic functions from rendering components; `src/data/employees.ts` holds the static dataset separately since it's not filter-specific. User Stories 12-13 add a second, sibling module, `src/hooks/`, holding the one hook (`useDebouncedCommit`) that FR-034 requires to live outside `filter-builder` and be reusable by any feature — it gets the same `index.ts`-as-public-API treatment (Article VIII) as `filter-builder` itself, rather than a catch-all `src/lib/`/`src/utils/` directory, since a hook is the only kind of thing being shared today (Principle III: no broader directory than the one concrete need calls for). No `tests/` tree is added — no test runner is configured (see Technical Context → Testing), so `/speckit-tasks` will specify manual repro steps instead.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
