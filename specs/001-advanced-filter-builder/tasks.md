---
description: 'Task list for Advanced Filter Builder'
---

# Tasks: Advanced Filter Builder

**Input**: Design documents from `/specs/001-advanced-filter-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/filter-url-schema.md, quickstart.md

**Tests**: Vitest, React Testing Library, and Playwright are now installed and configured (see plan.md → Technical Context → Testing; `npm run test`/`test:watch`/`e2e`). Phases 1-26 below (User Stories 1-18) were generated and completed while no test runner existed, so each of those stories still references its manual repro steps in [quickstart.md](./quickstart.md) only. User Story 19 (Phase 27) adds the automated test tasks (FR-045–FR-048) retroactively covering every one of those stories, per the constitution's Article IX gate now that a runner exists.

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P19) so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1–US19 from spec.md
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single Vite + React project (existing scaffold). Feature code lives under `src/data/` and `src/features/filter-builder/`; User Stories 12-13 add a second, sibling module at `src/hooks/` for the relocated debounce hook, and User Stories 15-16 further split `filter-builder/` into `hooks/`/`components/` subfolders and move every Employee-specific file into `src/data/`, per plan.md.

## Status Note (2026-07-28)

Phases 1-11 (User Stories 1-8) below were generated and completed against an earlier version of plan.md/spec.md. Phases 12-16 (User Stories 9-13) were added in this pass to cover the maintainability-refactor requirements (FR-027–FR-035) added to spec.md/plan.md since. A codebase check while generating Phases 12-16 found two things worth confirming before implementing:

- `src/features/filter-builder/ValueInput.tsx` and `src/features/filter-builder/index.ts` already exist and already satisfy most of User Story 10 (value-kind lookup map) and User Story 12 (module entry point) — their tasks below are phrased as verification, not creation.
- `src/features/filter-builder/filterEngine.ts` currently has **no** `describeFilter` function and `FilterBuilder.tsx` renders no plain-language sentence at all, even though Phase 5 (User Story 3, T014) is marked complete and research.md §18 assumes `describeFilter` already exists as `describeMatchCount`'s sibling. This looks like a pre-existing gap (FR-012) unrelated to Stories 9-13 — flagged in T053 below rather than silently folded into Story 11's scope.

## Status Note (2026-07-28, second update)

spec.md/plan.md picked up two amendments since Phase 17 was completed: Story 3's nested-group cap relaxed from "at most one" to "any number" (FR-007/FR-008 revised), a new Story 14 "Clear All" (FR-036/FR-037), and a new cross-cutting accessibility requirement (FR-038/SC-018). A codebase check while generating Phases 18-20 below confirmed the T053 gap flagged above was never resolved and found further drift from what Phases 1-17 claim as complete:

- `src/features/filter-builder/filterEngine.ts` still has no `describeFilter` — `FilterBuilder.tsx` renders a static `"Showing all employees (…)"` string, not a derived sentence. This directly blocks Story 3 (revised) Scenario 4, so Phase 18 below implements it rather than deferring further.
- `src/features/filter-builder/FilterGroup.tsx`'s "Add group" button is still gated by `isRoot && !hasNestedGroup`, i.e. it still enforces the superseded "at most one nested group" rule.
- No "Clear All" control exists anywhere in the codebase.
- No control in `FilterCondition.tsx`, `ValueInput.tsx`, or `FilterGroup.tsx` carries an `aria-label` or associated `<label>` beyond its own visible button text (e.g. the field/operator `<select>`s and every value-input control are unlabeled).

## Status Note (2026-07-28, third update)

spec.md/plan.md picked up a third amendment since Phase 21 was completed: Stories 15-18 (FR-039–FR-044) generalize the engine/components to a caller-supplied `FilterFieldConfig<TRow>`, reorganize `filter-builder` into `hooks/`/`components/` subfolders, route every value kind through one wrapped debounce call, and give each new subfolder its own entry file. A codebase check while generating Phases 22-26 below confirmed none of this work exists yet:

- `src/features/filter-builder/types.ts` still hardcodes `Field`/`Operator` as fixed string-literal unions (not `string`, not validated against a caller-supplied config); `fieldConfig.ts` and `validation.ts` still contain Employee-specific entries (country/salary/hireDate rules) directly inside the feature.
- `src/features/filter-builder/EmployeeTable.tsx` and `format.ts` still live inside the feature and import `Employee` directly; no `src/data/employeeFieldConfig.ts` exists.
- `FilterBuilder.tsx` still hardcodes `employees` from `../../data/employees` and renders `<EmployeeTable>` directly — it is not generic over `TRow`, and `App.tsx` still calls `<FilterBuilder />` with no props.
- There is no `hooks/` or `components/` subfolder inside `src/features/filter-builder/` — every file (`useConditionRow.ts`, `useFilterUrlSync.ts`, `FilterBuilder.tsx`, `FilterGroup.tsx`, `FilterCondition.tsx`, `ValueInput.tsx`) is still flat at the feature's top level, and there is no per-subfolder `index.ts`.
- `useConditionRow.ts`'s `handleValueChange` still branches `if (debounced) { setLocalValue(value) } else { onChange(...) }`, and `fieldConfig.ts` still exposes `isDebouncedValueKind` as a `boolean` map (`DEBOUNCE_BY_VALUE_KIND`), not the `debounceMsForValueKind` numeric-delay map FR-042/FR-043 require.
- `urlState.ts`'s `encodeFilterToParam(root)` does not currently drop a condition whose value is failing validation before encoding, despite this being required by FR-013's 2026-07-28 clarification and documented in [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) → Encoding rule step 1 — a pre-existing gap, unrelated to Stories 15-18 on its own, but one that must be fixed correctly while this function is rewritten to take a `fieldConfig` parameter (T080 below), rather than carried forward.

## Status Note (2026-07-29)

spec.md/plan.md picked up a fourth addition since Phase 26 was completed: a new Story 19 "Trust the feature through automated tests" (FR-045–FR-048, SC-023/SC-024), now that Vitest, React Testing Library, and Playwright are installed and configured (`package.json`'s `test`/`test:watch`/`e2e` scripts, `vitest.config.ts`, `src/test/setup.ts`, `playwright.config.ts`). A codebase check while generating Phase 27 below confirmed no automated coverage exists yet beyond the pre-existing smoke test:

- The only file under `e2e/` is `app.spec.ts` (renders the employee table) — none of `filtering.spec.ts`, `nested-groups.spec.ts`, `url-sharing.spec.ts`, `hire-date.spec.ts`, `validation.spec.ts`, `mobile-layout.spec.ts`, or `clear-all.spec.ts` exist yet.
- No `*.test.ts`/`*.test.tsx` file exists anywhere under `src/` — `filterEngine.ts`, `validation.ts`, `urlState.ts`, `src/data/employeeFieldConfig.ts`, `src/data/format.ts`, `src/hooks/useDebouncedCommit.ts`, and every hook/component under `src/features/filter-builder/hooks/`/`components/` are all currently untested.
- Per plan.md's Assumptions and this project's convention, unit/component tests are authored via the `unit-test-writer` subagent and end-to-end tests via the `e2e-test-writer` subagent — tasks below note this explicitly since it changes who/what performs the task, not just what file it touches.

---

## Phase 1: Setup

**Purpose**: Establish the feature's module boundary. No new dependencies — the feature uses only the existing React 19 + Tailwind v4 stack (research.md).

- [x] T001 Create the `src/features/filter-builder/` directory (holds all feature code per plan.md's Project Structure); no new npm packages required

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data, types, per-field config, and pure evaluation/sentence functions every user story builds on.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [x] T002 [P] Create `src/data/employees.ts` with the `Employee` type (`id`, `name`, `country: "EG"|"SA"|"AE"|"US"|"DE"`, `salary: number`, `isActive: boolean`) and a static 40-row mock dataset covering a mix of all 5 countries, salary ranges, and active/inactive values, per data-model.md → Employee
- [x] T003 [P] Create `src/features/filter-builder/types.ts` with the `Field`, `Operator`, `FilterCondition`, `FilterGroup`, and `FilterNode` (discriminated union on `kind`) types per data-model.md → Field & Operator / FilterCondition / FilterGroup
- [x] T004 Create `src/features/filter-builder/fieldConfig.ts`: a config map keyed by `Field` giving its valid `Operator[]`, `valueKind` (`"text"|"number"|"select"|"none"`), the fixed `country` option list, and the default (first) operator per field — implements FR-003, FR-004, FR-005 as data, not branching (depends on T003)
- [x] T005 Create `src/features/filter-builder/filterEngine.ts` with three framework-free functions: `evaluateNode(node, employee)` (condition → operator match, vacuous on undefined value; group → `every`/`some` over children per `logic`, vacuous on empty children), `matchCount`/filtered-rows helper, and `describeFilter(tree)` (recursive plain-language sentence, parenthesizing any nested group) — per data-model.md → Filter tree evaluation and research.md §6, implements FR-011/FR-012 (depends on T002, T003, T004)

**Checkpoint**: Data, types, config, and pure logic exist — user story UI work can begin.

---

## Phase 3: User Story 1 - Filter the table with a single rule (Priority: P1) 🎯 MVP

**Goal**: Show all 40 employees with an empty filter; let the user add one condition and see the table and match count narrow immediately, with field-change reset and boolean-operator value-hiding working correctly.

**Independent Test**: Load the page, add a single condition (e.g., `country is EG`), confirm the table and count narrow correctly — see [quickstart.md](./quickstart.md) → Story 1.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `src/features/filter-builder/EmployeeTable.tsx`: renders the table header (name, country, salary, active) plus the matching rows it's given as props, or a "No data matching the filter" message in place of rows when the list is empty — implements FR-001, FR-017 (depends on T002)
- [x] T007 [P] [US1] Create `src/features/filter-builder/FilterCondition.tsx`: renders field/operator/value controls driven entirely by `fieldConfig` (dropdown for `country`, number input for `salary`, text input for `name`, no value input for `isActive` operators); changing the field resets the operator to that field's default and clears the value — implements FR-002–FR-005 (depends on T004)
- [x] T008 [US1] Create `src/features/filter-builder/FilterGroup.tsx`: renders the group's AND/OR toggle and its list of child `FilterCondition`s, with add-condition and remove-condition controls — implements FR-006 (toggle), FR-009, FR-010 for conditions (depends on T007)
- [x] T009 [US1] Create `src/features/filter-builder/FilterBuilder.tsx`: owns the root `FilterGroup` state (`useState`/`useReducer`, initialized to an empty root group), derives the visible rows/match count and the sentence via `filterEngine` on every render, and renders the sentence + `FilterGroup` (root) + `EmployeeTable` — implements FR-011, FR-012, FR-016 (depends on T005, T006, T008)
- [x] T010 [US1] Wire `src/App.tsx` to render `<FilterBuilder />` (depends on T009)
- [x] T041 [US1] Add local debounce (~300ms) for `text`/`number`/`day`/`year` `valueKind` edits in `src/features/filter-builder/FilterCondition.tsx`: hold the in-progress value in local state so the input reflects every keystroke immediately, but only call the parent's `onChange` (committing to the filter tree) after a pause in typing; `select`/`month`/`none` kinds continue to call `onChange` synchronously, unchanged — per research.md §13, implements FR-025 (depends on T010)
- [x] T042 [US1] Validate the debounce behavior end-to-end per quickstart.md → Story 1, Scenario 5 (type several digits into a `salary` value quickly; confirm the input updates every keystroke but the table/count update only once, after the pause) (depends on T041)

**Checkpoint**: User Story 1 is fully functional and independently testable via quickstart.md → Story 1.

---

## Phase 4: User Story 2 - Combine multiple rules in a group (Priority: P2)

**Goal**: Let the user add a second condition to the root group and toggle it between AND/OR, changing the result set accordingly.

**Independent Test**: Starting from one condition, add a second, toggle AND/OR, remove one — confirm the result set updates correctly each time — see [quickstart.md](./quickstart.md) → Story 2.

### Implementation for User Story 2

- [x] T011 [US2] Validate multi-condition + AND/OR behavior end-to-end per quickstart.md → Story 2. No new files: `FilterGroup.tsx` (T008) already renders add/remove-condition and the AND/OR toggle generically over the group's `children` array, and `filterEngine.ts`'s `evaluateNode` (T005) already combines any number of children with `every`/`some` per `logic` — this is FR-006 delivered as one generic implementation rather than a first-condition special case, per Constitution VI. If any gap is found while validating (e.g., toggle not re-rendering, remove not preserving remaining conditions), fix it directly in `src/features/filter-builder/FilterGroup.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Nest a group for more complex logic (Priority: P3)

**Goal**: Let the user add one nested group inside the root group, each with its own AND/OR and conditions, with no way to nest a third level or a second root-level nested group — and have the plain-language sentence correctly describe the combined logic.

**Independent Test**: Add a nested group with its own conditions, confirm no "add group" control appears inside it, and confirm the sentence reflects both levels correctly — see [quickstart.md](./quickstart.md) → Story 3.

### Implementation for User Story 3

- [x] T012 [US3] Add an `isRoot` prop to `src/features/filter-builder/FilterGroup.tsx` that gates a new add-nested-group control: rendered only when `isRoot` is true and the group's `children` contains no group yet; never rendered when `isRoot` is false — implements FR-007, FR-008 (depends on T008)
- [x] T013 [US3] In `src/features/filter-builder/FilterBuilder.tsx`, pass `isRoot={true}` when rendering the root `FilterGroup` (and `false` for the nested one), and ensure the remove-group handler deletes the nested group and its entire subtree — implements FR-007, FR-010 (depends on T012, T009)
- [x] T014 [US3] Validate that `describeFilter` (`src/features/filter-builder/filterEngine.ts`, built in T005) parenthesizes the nested group's AND/OR phrase correctly against the root's logic, e.g. "country is EG and (salary > 8000 or isActive is true)" — see quickstart.md → Story 3, step 6; implements FR-012, SC-003 (depends on T013)

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Share a filter via link (Priority: P4)

**Goal**: Reflect the filter tree in the URL's `f` query parameter on every change (via `replaceState`), restore it on fresh page load, and fall back silently to an empty filter on any decode/validation failure.

**Independent Test**: Build a filter (including a nested group), copy the URL, reload it fresh, and confirm the same filter/sentence/rows reappear; then hand-edit the URL to garbage and confirm it falls back to an empty filter with no error — see [quickstart.md](./quickstart.md) → Story 4.

### Implementation for User Story 4

- [x] T015 [US4] Create `src/features/filter-builder/urlState.ts` with `encodeFilterToParam(root)`: `JSON.stringify` → base64-encode → URL-safe substitution (`+`→`-`, `/`→`_`, strip `=` padding), per contracts/filter-url-schema.md → Encoding rule (depends on T003)
- [x] T016 [US4] Add `decodeFilterFromParam(raw)` to `urlState.ts`: reverse the URL-safe substitution, base64-decode, `JSON.parse` on an `unknown` value, then structurally validate against `fieldConfig` (unknown field/operator, a group nested inside another nested group (depth > 2), or any shape mismatch → return `null` for the whole tree); never throws — per contracts/filter-url-schema.md → Decoding rule, research.md §5, implements FR-015 (depends on T015, T004). **2026-07-28 correction**: this task's original wording ("more than one root-level nested group... → return null") encoded the pre-amendment single-nested-group cap; Phase 18 relaxed FR-007/FR-008 to allow any number of root-level nested groups but never revisited this task or its implementation, leaving `decodeFilterFromParam` rejecting (and silently discarding) any URL with 2+ nested groups — including ones `encodeFilterToParam` itself produces, violating FR-014/SC-004. Fixed directly in `urlState.ts`'s `parseGroup`: the nested-group _count_ check is removed, the depth (`!== 1`) check — the still-valid "no third level" rule — is kept.
- [x] T017 [US4] Create `src/features/filter-builder/useFilterUrlSync.ts`: on mount, read `window.location.search`, call `decodeFilterFromParam`, and expose the result (or an empty root group on `null`) as initial filter state; on every filter-tree change, call `encodeFilterToParam` and apply it with `window.history.replaceState` (never `pushState`) — per research.md §4, implements FR-013, FR-014 (depends on T016)
- [x] T018 [US4] Wire `useFilterUrlSync` into `src/features/filter-builder/FilterBuilder.tsx`, replacing the plain `useState` initializer from T009 with the hook's initial value and change-sync behavior — implements FR-013–FR-015 (depends on T017, T009)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: User Story 5 - Filter by hire date components (Priority: P5)

**Goal**: Add a `hireDate` field with three independent-component operators (`day_is`/`month_is`/`year_is`), each matching only its own component of the employee's hire date regardless of the other two, with a month value entered via a selector (never free-typed).

**Independent Test**: Add a `hireDate` condition with `month_is` = a chosen month, confirm the table shows only employees hired in that month across any year; combine with a `year_is` condition in the same group and confirm both narrow together — see [quickstart.md](./quickstart.md) → Story 5.

### Implementation for User Story 5

- [x] T021 [P] [US5] Add `hireDate: string` (`"YYYY-MM-DD"`) to the `Employee` interface in `src/data/employees.ts` and populate a hire date for each of the 40 existing rows, varied enough across months, years, and days-of-month that component filtering is meaningful to test — per data-model.md → Employee, spec.md Assumptions; implements FR-001
- [x] T022 [P] [US5] Add `"hireDate"` to the `Field` union and `"day_is" | "month_is" | "year_is"` to the `Operator` union in `src/features/filter-builder/types.ts` — per data-model.md → Field & Operator
- [x] T023 [US5] Restructure `src/features/filter-builder/fieldConfig.ts` so `valueKind` is resolved per-_operator_ rather than per-field (research.md §7): change each field's config to map its operators to their value-input kind, add a `"day" | "month" | "year"` kind alongside the existing `"text"|"number"|"select"|"none"`, add a `hireDate` entry (`day_is`→`"day"`, `month_is`→`"month"`, `year_is`→`"year"`) with its own `describe` phrasing, and add a small `MONTH_OPTIONS` constant (`"January"`…`"December"` mapped to `1`-`12`) colocated in this file — implements FR-003, FR-004, FR-012 (depends on T022)
- [x] T024 [US5] Update `evaluateCondition` in `src/features/filter-builder/filterEngine.ts` to handle `day_is`/`month_is`/`year_is` by slicing the relevant component directly from `employee.hireDate` (`.slice(8, 10)`, `.slice(5, 7)`, `.slice(0, 4)` — string slicing, not `Date` parsing, per research.md §8) and comparing it as a number, never reading the other two components — implements FR-018 (depends on T021, T022)
- [x] T025 [P] [US5] Update `src/features/filter-builder/FilterCondition.tsx` to resolve `valueKind` from the selected _operator_ (via the restructured `fieldConfig`, T023) instead of the field, and render the three new input kinds: a number input constrained to 1-31 for `"day"`, a `<select>` of month names (backed by `MONTH_OPTIONS`) for `"month"`, and a plain number input for `"year"` — implements FR-004, Story 5 Scenario 5 (depends on T023)
- [x] T026 [P] [US5] Add a "Hire Date" column to the header and each row in `src/features/filter-builder/EmployeeTable.tsx`, displaying `employee.hireDate` — implements FR-001 (depends on T021)
- [x] T027 [US5] Validate hire-date filtering end-to-end per quickstart.md → Story 5 (`month_is`, `year_is`, `day_is` individually, then `month_is` + `year_is` combined via AND, then confirm the month input is a selector not free entry) — no new files; exercises T023–T026 together (depends on T024, T025, T026)

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: User Story 6 - Trust the filter's input (Priority: P6)

**Goal**: Validate a condition's entered value against its field/operator's schema before applying it to the filter; show an inline error and treat the condition as unset (vacuous) while the value is invalid.

**Independent Test**: Add a `salary` condition and type a non-numeric value; confirm an inline error appears and the table behaves as if the condition were unset until corrected — see [quickstart.md](./quickstart.md) → Story 6.

### Implementation for User Story 6

- [x] T030 [P] [US6] Create `src/features/filter-builder/validation.ts` with a Zod schema per `(field, operator)` pair, keyed the same way `fieldConfig.ts` keys `valueKindByOperator` (`salary`'s `gt`/`lt`/`eq` → `z.coerce.number().nonnegative()`; `hireDate`'s `year_is` → a 4-digit-integer schema, `day_is` → 1-31 integer, `month_is` → 1-12 integer; `name`/`country` → non-empty string/enum; `is_true`/`is_false` → always valid), and export `validateConditionValue(condition): { valid: true } | { valid: false; error: string }` — per research.md §10, implements FR-021 (depends on T003, T004)
- [x] T031 [P] [US6] Update `evaluateNode` in `src/features/filter-builder/filterEngine.ts` to call `validateConditionValue` and treat a failing value the same as an `undefined` value (vacuous — never excludes a row) — implements FR-022, Edge Cases (depends on T030, T005)
- [x] T032 [P] [US6] Update `src/features/filter-builder/FilterCondition.tsx` to call `validateConditionValue` on the current value and render an inline, field-level error message beneath the value control when it fails — implements FR-022 (depends on T030)
- [x] T033 [US6] Validate invalid-value inline errors (non-numeric salary, malformed `hireDate` year) and vacuous-match behavior end-to-end per [quickstart.md](./quickstart.md) → Story 6 (depends on T031, T032)

**Checkpoint**: User Stories 1-6 are all independently functional.

---

## Phase 9: User Story 7 - Scan a complex filter at a glance (Priority: P7)

**Goal**: Align every condition's field/operator/value controls into consistent columns within a group, visually distinguish a nested group from the root, and give salary/hire-date table cells consistent, legible formatting.

**Independent Test**: Build a group with three or more conditions plus a nested group; confirm the controls line up in consistent columns and the nested group is visually distinguishable from the root — see [quickstart.md](./quickstart.md) → Story 7.

### Implementation for User Story 7

- [x] T034 [P] [US7] Create `src/features/filter-builder/format.ts` with `formatSalary(salary: number): string` (`Intl.NumberFormat`, `maximumFractionDigits: 0`, thousands separators, no currency symbol) and `formatHireDate(hireDate: string): string` (`"D MMM YYYY"` built via string slicing of `"YYYY-MM-DD"`, never a `Date` object) — per research.md §11, implements FR-019/FR-020 (depends on T002)
- [x] T035 [US7] Update `src/features/filter-builder/EmployeeTable.tsx` to render the `salary` and `hireDate` cells through `formatSalary`/`formatHireDate` instead of the raw values, without changing the underlying data used for filtering — implements FR-019/FR-020, SC-009 (depends on T034)
- [x] T036 [P] [US7] Apply a fixed-width Tailwind grid (`grid grid-cols-[...]`) to `src/features/filter-builder/FilterCondition.tsx`'s field/operator/value/remove controls, identical across every condition row regardless of `valueKind`, so a group's rows align into consistent columns — per research.md §12, implements FR-023 (depends on T025)
- [x] T037 [P] [US7] Add a left border + indentation (e.g. `border-l-2 pl-4 ml-2`) to nested-group rendering in `src/features/filter-builder/FilterGroup.tsx` (`isRoot={false}`) so it reads as visually distinct from the root group — per research.md §12, implements FR-024 (depends on T012)
- [x] T038 [US7] Validate column alignment, nested-group visual distinction, and salary/hire-date formatting end-to-end per [quickstart.md](./quickstart.md) → Story 7 (depends on T035, T036, T037)

**Checkpoint**: All seven user stories are independently functional.

---

## Phase 10: User Story 8 - Manage filters comfortably on a mobile screen (Priority: P8)

**Goal**: On viewports narrower than Tailwind's `md` breakpoint (768px), a condition's remove control renders outside the field/operator/value row while staying reachable with one tap; the existing inline placement at `md` and above is unchanged.

**Independent Test**: View the filter builder at a mobile viewport width, add a condition, and confirm the remove control sits outside the field/operator/value row while remaining tappable; confirm the desktop layout (≥768px) is unchanged — see [quickstart.md](./quickstart.md) → Story 8.

### Implementation for User Story 8

- [x] T043 [US8] Change the condition-row grid in `src/features/filter-builder/FilterCondition.tsx` (the fixed `grid grid-cols-[10rem_8rem_12rem_5rem]` from T036) to a single-column stack below Tailwind's `md` breakpoint (`grid-cols-1 md:grid-cols-[10rem_8rem_12rem_5rem]`), so the remove control lands on its own row on narrow viewports with no new markup or JS-based viewport detection; the existing fixed-column grid (and the remove control's inline placement within it) is unchanged at `md` and above — per research.md §14, implements FR-026 (depends on T036)
- [x] T044 [US8] Validate mobile remove-control placement end-to-end per [quickstart.md](./quickstart.md) → Story 8 (resize below 768px, confirm the remove control is outside the input row and still removes the condition on tap; resize back to desktop width and confirm the inline placement is unchanged) (depends on T043)

**Checkpoint**: All eight user stories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide quality gates and full manual validation.

- [x] T019 [P] Run `npm run build` (type-check + production build) and `npm run lint`; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T020 Run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end (setup check, Stories 1–4, zero-match edge case, regression watch on the back button) and confirm every expectation holds
- [x] T028 [P] Re-run `npm run build` and `npm run lint` after the User Story 5 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T029 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Story 5 and the zero-match edge case, and confirm every expectation still holds
- [x] T039 [P] Re-run `npm run build` and `npm run lint` after the User Story 6/7 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T040 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Stories 6-7 and the zero-match edge case, and confirm every expectation still holds
- [x] T045 [P] Re-run `npm run build` and `npm run lint` after the debounce (T041) and mobile layout (T043) changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T046 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Story 1 Scenario 5 (debounce), Story 8 (mobile remove control), and the zero-match edge case, and confirm every expectation still holds

---

## Phase 12: User Story 9 - Maintain debounced value editing confidently (Priority: P9)

**Goal**: The debounce mechanism behind FR-025 (immediate typing feedback, delayed filter commit, correct re-sync on external value changes) lives in one clearly-named hook, not spread across several pieces of component state — with no change to any previously-specified behavior.

**Independent Test**: Read `useDebouncedValue.ts` and confirm the mechanism is one cohesive unit; in the browser, start typing into a debounced field, switch the condition's field before the delay elapses, and confirm the value resets cleanly with no stale leftover text — see [quickstart.md](./quickstart.md) → Story 9.

### Implementation for User Story 9

- [x] T047 [US9] In `src/features/filter-builder/useDebouncedValue.ts`, add re-sync behavior: when the externally-committed `value` changes for a reason other than this hook's own `onCommit` call (e.g., the condition's field is switched and its value is cleared), `localValue` MUST adopt the new external value rather than keep showing the stale in-flight edit — the hook's current `useState(value)` initializer only seeds `localValue` once and never re-adopts a later external change, which is Scenario 3's gap. Keep the existing immediate-display/delayed-commit behavior for `FilterCondition.tsx`'s own edits unchanged — implements FR-027 Scenario 3, FR-028 (depends on the existing hook; no new file)
- [x] T048 [US9] Validate per [quickstart.md](./quickstart.md) → Story 9: confirm the debounce mechanism reads as one named unit when the hook file is opened (Scenario 1), re-run Story 1 Scenario 5 (salary debounce) and Story 8 (mobile remove control) to confirm no regression (Scenario 2, FR-028), and confirm switching a debounced field mid-edit clears cleanly with no stale/duplicate state (Scenario 3) (depends on T047)

**Checkpoint**: User Story 9's debounce hook is self-contained and behavior-preserving.

---

## Phase 13: User Story 10 - Understand a condition row's code without tracing branches (Priority: P10)

**Goal**: `FilterCondition.tsx`'s field-change, operator-change, and value-commit handling are owned by one custom hook; the component renders only from that hook's return value, with no field/operator/value-kind branching of its own, and the debounced-or-not decision comes from `fieldConfig`, not a hardcoded check.

**Independent Test**: Read `FilterCondition.tsx` and confirm it contains no conditional logic keyed on a field, operator, or value-kind name — only rendering from a single hook call's return value — see [quickstart.md](./quickstart.md) → Story 10.

### Implementation for User Story 10

- [x] T049 [US10] Create `src/features/filter-builder/useConditionRow.ts`: a hook taking `(condition, onChange)` that resolves `config`/`valueKind` from `fieldConfig`, calls `useDebouncedValue` for debounced value kinds, runs `validateConditionValue`, and owns `handleFieldChange`/`handleOperatorChange`/`handleValueChange` — including FR-005's reset-operator-and-clear-value-on-field-change rule and the clear-value-on-hireDate-operator-change rule — returning `{ config, valueKind, displayValue, validation, handleFieldChange, handleOperatorChange, handleValueChange }`; the debounced-vs-immediate commit decision inside `handleValueChange` MUST read `isDebouncedValueKind(valueKind)` from `fieldConfig` rather than compare against a field/operator name directly — per data-model.md → "Condition-row hook and shared debounce hook", research.md §16, implements FR-029, FR-030 (depends on the existing `fieldConfig.ts`, `validation.ts`, `useDebouncedValue.ts`)
- [x] T050 [US10] Update `src/features/filter-builder/FilterCondition.tsx` to call `useConditionRow(condition, onChange)` once and render solely from its returned values and handlers, removing the component's own `fieldConfig`/`valueKindForOperator`/`isDebouncedValueKind`/`useDebouncedValue`/`validateConditionValue` calls and its inline `handleFieldChange`/`handleOperatorChange`/`handleValueChange` — implements FR-029 (depends on T049)
- [x] T051 [US10] Confirm `src/features/filter-builder/ValueInput.tsx`'s `inputsByValueKind` lookup map (already implemented) and `FilterCondition.tsx`'s `<ValueInput valueKind={...} />` usage together leave no per-field/per-value-kind conditional rendering in the component body — implements FR-031, SC-015 (depends on T050; no new file expected)
- [x] T052 [US10] Validate per [quickstart.md](./quickstart.md) → Story 10: confirm `FilterCondition.tsx` has no field/operator/value-kind branching (Scenario 1), confirm the debounce decision is config-driven via `isDebouncedValueKind` (Scenario 2), and re-run Story 1, Story 6 (validation), and Story 9 (debounce) in the browser to confirm no regression (Scenario 3, FR-035) (depends on T051)

**Checkpoint**: `FilterCondition.tsx` is a pure renderer over `useConditionRow`'s output.

---

## Phase 14: User Story 11 - Understand the filter page's code as pure composition (Priority: P11)

**Goal**: `FilterBuilder.tsx` contains no logic beyond composing `useFilterUrlSync`, `filterEmployees`, and its child components — the pluralized match-count text is derived elsewhere and simply rendered.

**Independent Test**: Read `FilterBuilder.tsx` and confirm every line either renders a child component or calls a hook/function defined elsewhere — see [quickstart.md](./quickstart.md) → Story 11.

### Implementation for User Story 11

- [x] T053 [US11] Add `describeMatchCount(count: number): string` to `src/features/filter-builder/filterEngine.ts`, returning the pluralized match text (e.g. `"1 match"`, `"40 matches"`) — per research.md §18, implements FR-032. **Before starting**: `filterEngine.ts` currently has no `describeFilter` function and `FilterBuilder.tsx` renders no plain-language filter sentence (see Status Note above) even though research.md §18 describes `describeMatchCount` as sitting "alongside the existing `describeFilter`." Confirm with the user whether FR-012/Story 3's sentence needs to be (re)implemented as part of this pass, or tracked separately, before assuming this task's scope is match-count text only (depends on the existing `filterEngine.ts`)
- [x] T054 [US11] Update `src/features/filter-builder/FilterBuilder.tsx` to call `describeMatchCount(visibleEmployees.length)` in place of its inline pluralized match-count string, so the component's body is limited to `useFilterUrlSync` (state), `filterEmployees` (derivation), and rendering `describeMatchCount`'s result plus `FilterGroup`/`EmployeeTable` — implements FR-032 (depends on T053)
- [x] T055 [US11] Validate per [quickstart.md](./quickstart.md) → Story 11: confirm every line in `FilterBuilder.tsx` either renders a child component or calls a hook/function defined elsewhere (Scenario 1), and re-run Story 1 Scenario 1 and Story 4 Scenario 1 in the browser to confirm no regression (Scenario 2, FR-035) (depends on T054)

**Checkpoint**: `FilterBuilder.tsx` reads as pure composition.

---

## Phase 15: User Story 12 - Import the feature through one stable entry point (Priority: P12)

**Goal**: Everything `filter-builder` exposes to the rest of the app is importable from its `index.ts` alone, and no file inside the feature imports back from that same entry file.

**Independent Test**: From outside `filter-builder`, confirm every consumed symbol imports from the feature's entry file only; confirm no internal file re-imports it — see [quickstart.md](./quickstart.md) → Story 12.

### Implementation for User Story 12

- [x] T056 [US12] Audit `src/features/filter-builder/index.ts` (already exists, exporting `FilterBuilder` only): confirm `src/App.tsx` imports exclusively from `./features/filter-builder` (never a nested file such as `./features/filter-builder/FilterBuilder`), and confirm no file inside `src/features/filter-builder/` imports from its own `index.ts` — per plan.md Constitution Check → Article VIII, implements FR-033 (depends on the existing `index.ts`; no new file expected)
- [x] T057 [US12] Validate per [quickstart.md](./quickstart.md) → Story 12: search the codebase outside `filter-builder` for any deep import into the feature (Scenario 1), and confirm no internal file imports from that feature's own entry file and neither `index.ts` in the project uses a wildcard `export *` (Scenario 2) (depends on T056)

**Checkpoint**: `filter-builder` has exactly one public entry point.

---

## Phase 16: User Story 13 - Reuse debounced editing outside this feature (Priority: P13)

**Goal**: The debounce hook lives outside `filter-builder`, in its own `src/hooks/` module with its own entry point, under a name that carries no filter-specific meaning, and is importable by any feature.

**Independent Test**: From outside `filter-builder`, import the hook from `src/hooks` and use it to delay an arbitrary callback with no filter concept involved — see [quickstart.md](./quickstart.md) → Story 13.

### Implementation for User Story 13

- [x] T058 [US13] Create `src/hooks/useDebouncedCommit.ts`: relocate `src/features/filter-builder/useDebouncedValue.ts`'s implementation here (including T047's re-sync fix), renamed to describe what it does generically (`(value, onCommit, delayMs) → [localValue, setLocalValue]`), with no `Field`/`Operator`/`FilterCondition` reference — per research.md §19, implements FR-034 (depends on T047)
- [x] T059 [US13] Create `src/hooks/index.ts` exporting `useDebouncedCommit` as this module's sole public symbol, mirroring `filter-builder/index.ts`'s convention — implements FR-033 (second module boundary) (depends on T058)
- [x] T060 [US13] Update `src/features/filter-builder/useConditionRow.ts` to import `useDebouncedCommit` from `../../hooks` (the new module's entry file) instead of the local `useDebouncedValue.ts`, then delete `src/features/filter-builder/useDebouncedValue.ts` — implements FR-033, FR-034 (depends on T059, T049)
- [x] T061 [US13] Validate per [quickstart.md](./quickstart.md) → Story 13: confirm `src/hooks/useDebouncedCommit.ts` and `src/hooks/index.ts` reference no filter-specific concept (Scenario 1), and re-run Story 1 Scenario 5 plus the `name`/`hireDate` day/year debounced inputs in the browser to confirm debounce behavior is unchanged (Scenario 2, FR-034/FR-035) (depends on T060)

**Checkpoint**: All thirteen user stories are independently functional; the debounce hook is reusable outside `filter-builder`.

---

## Phase 17: Polish & Cross-Cutting Concerns (User Stories 9-13)

**Purpose**: Repo-wide quality gates and full manual validation after the maintainability refactor.

- [x] T062 [P] Run `npm run build` (type-check + production build) and `npm run lint` after the Stories 9-13 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T063 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — Stories 1-13, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

---

## Phase 18: User Story 3 (Revised) - Multiple nested groups + plain-language sentence (Priority: P3)

**Goal**: The root group's "Add group" control stays available after any number of nested groups already exist (the 2026-07-27 "exactly one" cap is superseded), and the plain-language sentence (FR-012) — required to read Scenario 4's combined logic and never actually implemented despite being marked complete in Phase 5 — exists and is rendered above the table.

**Independent Test**: Add a nested group, then add a second independent nested group alongside it, confirm the "add group" control remains available at the root and unavailable inside either nested group, and confirm the sentence above the table correctly states the combined AND/OR logic across the root condition and both nested groups — see [quickstart.md](./quickstart.md) → Story 3.

### Implementation for User Story 3 (Revised)

- [x] T064 [US3] Remove the `!hasNestedGroup` restriction from the "Add group" control's gating in `src/features/filter-builder/FilterGroup.tsx` (currently `isRoot && !hasNestedGroup`) so it renders whenever `isRoot` is true, unconditionally, allowing any number of sibling nested groups at the root; delete the now-unused `hasNestedGroup` local — per research.md §21, implements FR-007 (revised), FR-008, Story 3 Scenario 2 (depends on existing `FilterGroup.tsx`)
- [x] T065 [US3] Add `describeFilter(node: FilterNode): string` to `src/features/filter-builder/filterEngine.ts`: for a condition, call `fieldConfig[condition.field].describe(condition.operator, condition.value)`; for a group, join its children's descriptions with `" and "`/`" or "` per the group's `logic`, parenthesizing a nested group's joined phrase, and returning a fixed placeholder (e.g. `"No filter applied"`) when the root has no children — per research.md §6, implements FR-012 (this function does not currently exist in the codebase, despite being flagged as a gap in the Status Note above and assumed to exist by research.md §18's `describeMatchCount`) (depends on existing `filterEngine.ts`, `fieldConfig.ts`'s per-field `describe`)
- [x] T066 [US3] Wire `describeFilter(root)` into `src/features/filter-builder/FilterBuilder.tsx`, replacing the static `"Showing all employees (…)"` text with the derived sentence rendered above the table (still composed alongside `describeMatchCount`, not merged into one string) — implements FR-012, FR-032 (pure composition — no formatting logic inline in `FilterBuilder.tsx`) (depends on T065)
- [x] T067 [US3] Validate per [quickstart.md](./quickstart.md) → Story 3: add a second nested group alongside the first and confirm both combine independently with the root and each other, with "add group" still available at the root (Scenario 2); confirm no "add group" control appears inside either nested group (Scenario 3); confirm the sentence correctly states the combined AND/OR logic across the root condition and every nested group (Scenario 4) (depends on T064, T066)

**Checkpoint**: The root group supports any number of nested groups, and the plain-language sentence (FR-012) is implemented and visible.

---

## Phase 19: User Story 14 - Clear the entire filter in one action (Priority: P14)

**Goal**: One always-visible "Clear All" control resets the whole tree — every condition in the root group, every nested group, and every condition within each nested group — back to a single empty root group in one action, with no confirmation step, immediately updating rows/count/sentence/URL; clicking it when the filter is already empty is a no-op.

**Independent Test**: Build a filter with multiple root-level conditions and at least one nested group, click "Clear All", and confirm the table returns to showing all employees with an empty root group and no nested groups remaining — see [quickstart.md](./quickstart.md) → Story 14.

### Implementation for User Story 14

- [x] T068 [US14] Add `createEmptyFilter(): FilterGroup` to `src/features/filter-builder/filterEngine.ts`, returning `{ id: crypto.randomUUID(), kind: "group", logic: "AND", children: [] }` — the same shape used to seed a freshly-created group elsewhere in the module — per research.md §20, implements FR-036 (depends on existing `filterEngine.ts`)
- [x] T069 [US14] Add an always-visible "Clear All" `<button>` to `src/features/filter-builder/FilterBuilder.tsx`, wired to call the existing `setRoot` (from `useFilterUrlSync`) with `createEmptyFilter()` — the same state-update path every other edit already goes through, so rows/count/sentence/URL update immediately with no new effect or state; give it `aria-label="Clear all filters"` — per research.md §20, implements FR-036, FR-037, FR-038 (depends on T068)
- [x] T070 [US14] Validate per [quickstart.md](./quickstart.md) → Story 14: build a filter with at least two root-level conditions and two nested groups, click Clear All, confirm every condition/group is removed, all 40 rows show, the match count reflects the full dataset, the sentence reflects an empty filter, and the URL's `f` parameter no longer encodes any conditions, with no confirmation prompt (Scenarios 1-2); click Clear All again on an already-empty filter and confirm no visible change and no error (Scenario 3) (depends on T069)

**Checkpoint**: All fourteen user stories are independently functional.

---

## Phase 20: Accessibility hardening (FR-038, SC-018)

**Purpose**: Every interactive control in the filter builder — add/remove condition, add/remove group, field/operator/value inputs, the AND/OR toggle, and Clear All — is operable via keyboard alone (already true for free: every control is a native `<button>`/`<select>`/`<input>`, per research.md §22) and carries a clear, programmatic label for assistive technology (not yet true for most controls). No live/spoken announcements of dynamic changes are required or added (FR-038 explicitly excludes them).

**Independent Test**: Using only the keyboard, add a condition, add a nested group, remove a condition, toggle a group's AND/OR, edit a value, and use Clear All; then inspect every control in the browser's accessibility tree and confirm each has a non-empty accessible name — see [quickstart.md](./quickstart.md) → Accessibility spot-check.

### Implementation for Accessibility

- [x] T071 [P] Add `aria-label`s to `src/features/filter-builder/FilterCondition.tsx`'s field `<select>` (e.g. `"Field"`) and operator `<select>` (e.g. `"Operator"`), and to each control in `src/features/filter-builder/ValueInput.tsx` (`TextInput`, `NumberInput`, `NumericInput`, `SelectInput`, `MonthInput`, e.g. `"Value"`) — per research.md §22, implements FR-038 (depends on existing `FilterCondition.tsx`, `ValueInput.tsx`)
- [x] T072 [P] Add a distinct `aria-label` (e.g. `"Remove condition"`) to `FilterCondition.tsx`'s "Remove" button so it reads unambiguously to a screen reader outside the visual context of its row — implements FR-038 (depends on existing `FilterCondition.tsx`)
- [x] T073 [P] Add `aria-label`s to `src/features/filter-builder/FilterGroup.tsx`'s AND/OR toggle button (e.g. `` `Group logic: ${group.logic}, click to toggle` ``), "Remove group" button (e.g. `"Remove nested group"`), "Add condition" button (e.g. `"Add condition"`), and "Add group" button (e.g. `"Add nested group"`) — per research.md §22, implements FR-038 (depends on existing `FilterGroup.tsx`)
- [x] T074 Validate per [quickstart.md](./quickstart.md) → Accessibility spot-check: using only the keyboard (Tab/Shift+Tab, Enter/Space, arrow keys inside a `<select>`), add a condition, add a nested group, remove a condition, toggle a group's AND/OR, edit a value, and click Clear All (SC-018); inspect every select/input/button in the browser's accessibility tree and confirm each has a non-empty accessible name (SC-018) (depends on T071, T072, T073, T069)

**Checkpoint**: Every control in the filter builder is keyboard-operable with a programmatic label.

---

## Phase 21: Polish & Cross-Cutting Concerns (User Story 3 revision, User Story 14, Accessibility)

**Purpose**: Repo-wide quality gates and full manual validation after the 2026-07-28 amendments.

- [x] T075 [P] Run `npm run build` (type-check + production build) and `npm run lint` after the Phase 18-20 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T076 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — all 14 stories, the accessibility spot-check, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

---

## Phase 22: User Story 15 - Plug the filter builder into a different table (Priority: P15)

**Goal**: The feature's engine, condition/group components, and validation operate against a `FilterFieldConfig<TRow>` and dataset supplied by the caller via props/generics; no file inside `src/features/filter-builder/` references Employee-specific field names, operators, or value-kind mappings. The Employee table's own behavior continues to work unchanged, now driven by an Employee-specific config passed in from `src/App.tsx`.

**Independent Test**: Wire a throwaway field configuration for a different shape of data through the exported `FilterBuilder` and confirm filtering/grouping/nesting/URL sync all work using only that configuration, with no edits inside the feature — see [quickstart.md](./quickstart.md) → Story 15.

### Implementation for User Story 15

- [x] T077 [US15] Rewrite `src/features/filter-builder/types.ts`: replace the hardcoded `Field`/`Operator` string-literal unions with `OperatorConfig<TRow>` (`{ label; valueKind; options?; schema?; match: (row: TRow, value: unknown) => boolean; describe: (value: unknown) => string }`), `FieldDef<TRow>` (`{ label; operators: Record<string, OperatorConfig<TRow>> }`), and `FilterFieldConfig<TRow> = Record<string, FieldDef<TRow>>`; `FilterCondition.field`/`.operator` become `string` — per data-model.md → Field & Operator, research.md §23, implements FR-039 (depends on existing `types.ts`)
- [x] T078 [US15] Update `src/features/filter-builder/filterEngine.ts` to take `fieldConfig: FilterFieldConfig<TRow>` as a parameter: `evaluateNode<TRow>(node, row, fieldConfig)`'s condition branch calls `fieldConfig[condition.field].operators[condition.operator].match(row, condition.value)` instead of the current hardcoded `switch (operator)`; `describeFilter<TRow>(node, fieldConfig)`'s condition branch calls `.describe(condition.value)` instead of `fieldConfig[node.field].describe(...)`; `describeMatchCount` and `createEmptyFilter`/`createEmptyRoot`-equivalent stay untyped by `TRow` (no field lookup needed) — implements FR-039 (depends on T077)
- [x] T079 [US15] Update `src/features/filter-builder/validation.ts` so `validateConditionValue<TRow>(condition, fieldConfig)` looks up `fieldConfig[condition.field]?.operators[condition.operator]?.schema` and runs it (absent schema = always valid), replacing the current hardcoded `schemasByField` map — implements FR-039 (depends on T077)
- [x] T080 [US15] Update `src/features/filter-builder/urlState.ts`: `encodeFilterToParam<TRow>(root, fieldConfig)` first recursively drops any condition whose value currently fails `validateConditionValue(condition, fieldConfig)` from its parent group's `children` (the currently-missing behavior flagged in the Status Note above, required by [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) → Encoding rule step 1 / FR-013) before `JSON.stringify`-ing; `decodeFilterFromParam<TRow>(raw, fieldConfig)`'s `isField`/operator checks validate against `fieldConfig`'s own keys (`field in fieldConfig`, `operator in fieldConfig[field].operators`) instead of the removed hardcoded `fieldConfig.ts` import — implements FR-039, FR-013 (depends on T077, T079)
- [x] T081 [US15] Create `src/data/employeeFieldConfig.ts` exporting `employeeFieldConfig: FilterFieldConfig<Employee>`: merge the current `fieldConfig.ts` Employee entries (operator lists, `describe` phrases, `COUNTRY_OPTIONS`/`MONTH_OPTIONS`) and `validation.ts`'s Employee Zod schemas into one object per field, moving each operator's comparison logic (currently `evaluateCondition`'s `switch` in `filterEngine.ts` — `contains`/`equals`/`is`/`is_not`/`gt`/`lt`/`eq`/`is_true`/`is_false`/`day_is`/`month_is`/`year_is`, including the `hireDate` string-slicing) into that operator's own `match: (employee, value) => boolean` — per research.md §23/§24, implements FR-039, FR-040 (depends on T077-T080)
- [x] T082 [P] [US15] Move `EmployeeTable.tsx` and `format.ts` from `src/features/filter-builder/` to `src/data/EmployeeTable.tsx` and `src/data/format.ts`, updating their now-local `Employee`/`formatSalary`/`formatHireDate` import paths — per research.md §24, implements FR-039 (depends on existing files)
- [x] T083 [US15] Rewrite `src/features/filter-builder/FilterBuilder.tsx` to be generic: `FilterBuilder<TRow>({ fieldConfig, data, children }: { fieldConfig: FilterFieldConfig<TRow>; data: TRow[]; children: (matchingRows: TRow[]) => ReactNode })`, replacing the hardcoded `employees` import and `<EmployeeTable>` call with `data`/`children(visibleRows)`, and threading `fieldConfig` into `useFilterUrlSync`/`filterEmployees`/`describeFilter`/`FilterGroup` — still pure composition (FR-032 unaffected) — implements FR-039 (depends on T078, T082)
- [x] T084 [US15] Update `FilterGroup.tsx`, `FilterCondition.tsx`, and `ValueInput.tsx` to receive `fieldConfig`/be generic over `TRow` instead of importing the hardcoded `fieldConfig.ts` map directly (e.g. `FilterGroup`'s `createCondition` needs a field key and default operator from the passed-in `fieldConfig`, not `defaultOperatorForField('name')`); reduce `src/features/filter-builder/fieldConfig.ts` to generic, Employee-agnostic helpers only (`defaultOperatorForField(fieldConfig, field)`, `valueKindForOperator(fieldConfig, field, operator)`), deleting every Employee-specific entry (`COUNTRY_OPTIONS`, `MONTH_OPTIONS`, the `fieldConfig` object literal) now that they live in `employeeFieldConfig.ts` — implements FR-039 (depends on T081, T083)
- [x] T085 [US15] Update `useConditionRow.ts` and `useFilterUrlSync.ts` to accept/thread `fieldConfig: FilterFieldConfig<TRow>` as a parameter instead of importing the module-level `fieldConfig.ts` object, so both hooks are generic over `TRow` — implements FR-039 (depends on T084)
- [x] T086 [US15] Wire `src/App.tsx`: `<FilterBuilder fieldConfig={employeeFieldConfig} data={employees}>{(matchingRows) => <EmployeeTable employees={matchingRows} />}</FilterBuilder>`, importing `employeeFieldConfig`/`EmployeeTable` from `src/data/` and `employees` from `src/data/employees` — implements FR-040 (depends on T081, T082, T083)
- [x] T087 [US15] Validate per [quickstart.md](./quickstart.md) → Story 15: in a scratch (uncommitted) file, define a small `FilterFieldConfig<TRow>` for a different shape of data (e.g. a `Product` type with `sku`/`inStock`) and render `<FilterBuilder fieldConfig={...} data={...}>{...}</FilterBuilder>`, confirming add/remove condition/group, AND/OR, and the URL `f` param all work with no edits inside `src/features/filter-builder/` (Scenario 1); grep `src/features/filter-builder/` for `Employee`, `country`, `salary`, `isActive`, `hireDate` and confirm no matches (Scenario 2); re-run Story 1 Scenario 1 and Story 4 Scenario 1 against the real app and confirm the Employee table's filtering/URL sync still work exactly as before (Scenario 3, FR-040) (depends on T086)

**Checkpoint**: `filter-builder` is generic over `TRow`; Employee is its one live consumer via `src/data/employeeFieldConfig.ts`.

---

## Phase 23: User Story 16 - Organize feature files by kind (Priority: P16)

**Goal**: Every hook file inside `filter-builder` lives under a `hooks` subfolder and every component file lives under a `components` subfolder; the feature's own `index.ts` stays at the top level.

**Independent Test**: Open the `filter-builder` folder and confirm every hook lives under `hooks/`, every component lives under `components/`, and the entry file stays at the top — see [quickstart.md](./quickstart.md) → Story 16.

### Implementation for User Story 16

- [x] T088 [US16] Create `src/features/filter-builder/hooks/` and move `useConditionRow.ts`, `useFilterUrlSync.ts` into it; create `src/features/filter-builder/components/` and move `FilterBuilder.tsx`, `FilterGroup.tsx`, `FilterCondition.tsx`, `ValueInput.tsx` into it; `types.ts`, `fieldConfig.ts`, `filterEngine.ts`, `validation.ts`, and `urlState.ts` stay directly under `filter-builder/` alongside the feature's `index.ts` — update every relative import broken by the move (e.g. `components/FilterCondition.tsx`'s `import { useConditionRow } from '../hooks/useConditionRow'`, `hooks/useConditionRow.ts`'s `import { fieldConfig } from '../fieldConfig'`) — per research.md §25, implements FR-041 (depends on T085, since the hooks/components must already be generic before or as part of this move)
- [x] T089 [US16] Validate per [quickstart.md](./quickstart.md) → Story 16: confirm every hook file lives inside `hooks/` (Scenario 1) and every component file lives inside `components/` (Scenario 2); re-run Story 1 Scenario 1 and Story 4 Scenario 1 and confirm both work exactly as before — only import paths changed (Scenario 3, FR-041) (depends on T088)

**Checkpoint**: `filter-builder`'s files are grouped by kind into `hooks/`/`components/`.

---

## Phase 24: User Story 17 - Commit debounced edits through one wrapped handler (Priority: P17)

**Goal**: `useConditionRow`'s value-change handling routes every value kind — debounced and non-debounced alike — through the same single `useDebouncedCommit` call, with the delay supplied as per-`valueKind` configuration rather than an inline `if (debounced)`/`else` branch.

**Independent Test**: Read `useConditionRow.ts`'s value-change handling and confirm it calls `useDebouncedCommit` once, unconditionally, for every value kind, with the delay sourced from `fieldConfig.ts` — see [quickstart.md](./quickstart.md) → Story 17.

### Implementation for User Story 17

- [x] T090 [US17] In `src/features/filter-builder/fieldConfig.ts`, replace `DEBOUNCE_BY_VALUE_KIND: Record<ValueKind, boolean>`/`isDebouncedValueKind` with `DEBOUNCE_MS_BY_VALUE_KIND: Record<ValueKind, number>` (`text`/`number`/`day`/`year` → `700`, `select`/`month`/`none` → `0`) exposed as `debounceMsForValueKind(kind: ValueKind): number` — per research.md §26, implements FR-042 (depends on T088)
- [x] T091 [US17] Update `src/features/filter-builder/hooks/useConditionRow.ts`: remove the local `DEBOUNCE_MS` constant and the `debounced`/`isDebouncedValueKind` check; call `useDebouncedCommit(condition.value, commit, debounceMsForValueKind(valueKind))` unconditionally for every `valueKind`; `handleValueChange` becomes exactly the hook's own `setLocalValue`, and `displayValue` becomes exactly the hook's own `localValue`, with no `if (debounced) {...} else {...}` left — implements FR-043 (depends on T090)
- [x] T092 [US17] Validate per [quickstart.md](./quickstart.md) → Story 17: confirm `handleValueChange` and `displayValue` are the identical call/value for every `valueKind`, with no debounced/non-debounced branch (Scenarios 1-2); re-run Story 1 Scenario 5 (`salary`, debounced — still waits ~700ms after the last keystroke) and Story 5 Scenario 1 (`hireDate` month, non-debounced — still updates with no perceptible delay) and confirm both behave exactly as before (Scenario 3, FR-025/FR-027) (depends on T091)

**Checkpoint**: `useConditionRow` routes every value kind through one wrapped debounce call.

---

## Phase 25: User Story 18 - Import each part of the feature through one file per kind (Priority: P18)

**Goal**: `hooks/` and `components/` each expose their own single entry file; every cross-subfolder import — inside or outside the feature, including the feature's own top-level `index.ts` and single-item imports — goes through that entry file rather than a direct nested-file import.

**Independent Test**: Pick any file using more than one hook or component from `filter-builder` and confirm it imports all of them through the relevant subfolder's entry file in one statement — see [quickstart.md](./quickstart.md) → Story 18.

### Implementation for User Story 18

- [x] T093 [P] [US18] Create `src/features/filter-builder/hooks/index.ts` re-exporting `useConditionRow` and `useFilterUrlSync` as the subfolder's sole entry point — implements FR-044 (depends on T088)
- [x] T094 [P] [US18] Create `src/features/filter-builder/components/index.ts` re-exporting `FilterBuilder`, `FilterGroup`, `FilterCondition`, and `ValueInput` as the subfolder's sole entry point — implements FR-044 (depends on T088)
- [x] T095 [US18] Update `src/features/filter-builder/index.ts` to import `FilterBuilder` from `./components` (not `./components/FilterBuilder`) and any re-exported types from `./types`; update every cross-subfolder import inside the feature (e.g. `components/FilterCondition.tsx`'s `useConditionRow` import) to go through `../hooks`/`../components` rather than a direct nested-file path, including imports that currently need only one item — implements FR-044 (depends on T093, T094)
- [x] T096 [US18] Validate per [quickstart.md](./quickstart.md) → Story 18: confirm `src/features/filter-builder/index.ts` imports `FilterBuilder` from `./components` (Scenario 3); confirm `components/FilterCondition.tsx` imports `useConditionRow` from `../hooks`, not `../hooks/useConditionRow` (Scenarios 1-2) (depends on T095)

**Checkpoint**: All eighteen user stories are independently functional; every subfolder inside `filter-builder` has one entry file that every cross-subfolder import goes through.

---

## Phase 26: Polish & Cross-Cutting Concerns (User Stories 15-18)

**Purpose**: Repo-wide quality gates and full manual validation after the generalization/reorganization pass.

- [x] T097 [P] Run `npm run build` (type-check + production build) and `npm run lint` after the Stories 15-18 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [x] T098 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — all 18 stories, the accessibility spot-check, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

---

## Phase 27: User Story 19 - Trust the feature through automated tests (Priority: P19)

**Goal**: The filter-matching engine, condition-value validation, and URL encode/decode each have unit tests run without rendering any component; the condition row, filter group, top-level filter builder, and both debounce/URL-sync hooks each have component tests exercising rendered output and simulated interaction; every user story (US1-US18) has at least one automated test tracing back to its acceptance scenarios; none of this introduces a test-only code path into the feature's runtime code.

**Independent Test**: Run `npm run test` and confirm it exercises the filter engine, validation, URL encode/decode, and the condition/group components and hooks in isolation; separately, run `npm run e2e` and confirm it drives a real browser through the filtering, grouping, nesting, sharing, clearing, and validation flows against the running app — see [quickstart.md](./quickstart.md) → Story 19.

### Implementation for User Story 19

- [x] T099 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/filterEngine.test.ts` covering `evaluateNode` (per-operator single-condition match/no-match, AND/OR group evaluation, evaluation across multiple sibling nested groups, vacuous match on an empty group and on an undefined condition value), `matchCount`, `describeFilter` (sentence for a flat group and for a root with one or more nested groups), `describeMatchCount` (pluralization), and `createEmptyFilter` (shape) — implements FR-045, FR-003, FR-006, FR-007, FR-012, FR-018, FR-032, FR-036 (depends on the existing `filterEngine.ts`)
- [x] T100 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/validation.test.ts` covering `validateConditionValue` for every field/operator's Zod schema (valid and invalid `salary`, `hireDate` day/month/year bounds, `name`, `country`), and confirming an undefined value is treated as vacuously valid — implements FR-045, FR-021, FR-022 (depends on the existing `validation.ts`)
- [x] T101 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/urlState.test.ts` covering `encodeFilterToParam`/`decodeFilterFromParam` round-tripping a valid flat tree and a tree with multiple nested groups, confirming a condition currently failing validation is dropped before encoding (FR-013), and confirming a malformed, undecodable, or unrecognized field/operator URL value decodes to a null/empty result (FR-014/FR-015) — implements FR-045, FR-013, FR-014, FR-015 (depends on the existing `urlState.ts`)
- [x] T102 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/data/employeeFieldConfig.test.ts` covering each field's operator list, `describe`, `match`, and Zod `schema`, plus `hireDate`'s independent day/month/year slicing — implements FR-045 (data-model.md → Automated test coverage) (depends on the existing `employeeFieldConfig.ts`)
- [x] T103 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/data/format.test.ts` covering `formatSalary` (thousands separator, no decimals, no currency symbol) and `formatHireDate` ("D MMM YYYY") output shape — implements FR-045, FR-019, FR-020 (depends on the existing `format.ts`)
- [x] T104 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/hooks/useDebouncedCommit.test.ts` using `renderHook` and `vi.useFakeTimers()`, covering commit-after-pause, several rapid changes before the delay collapsing to one final commit, immediate local-value display while pending, external value re-sync, and no dangling timer after unmount — implements FR-046, FR-027, FR-028, FR-034 (depends on the existing `useDebouncedCommit.ts`)
- [x] T105 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/hooks/useFilterUrlSync.test.tsx` covering initial decode from a seeded URL, `history.replaceState` (not `pushState`) called after a tree change, and a malformed URL falling back to an empty filter — implements FR-046, FR-013, FR-014, FR-015 (depends on the existing `useFilterUrlSync.ts`)
- [x] T106 [P] [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/hooks/useConditionRow.test.tsx` covering field-change reset (operator and value), `hireDate` operator-change value reset, and debounced-vs-immediate value-commit paths using fake timers — implements FR-046, FR-005, FR-025, FR-029, FR-030, FR-043 (depends on the existing `useConditionRow.ts`)
- [x] T107 [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/components/FilterCondition.test.tsx` covering the value-input control swapping on field/operator change and the remove control — implements FR-046 (depends on T106, the existing `FilterCondition.tsx`)
- [x] T108 [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/components/FilterGroup.test.tsx` covering the AND/OR toggle, add/remove condition, add/remove nested group, and the add-group control's absence inside a nested group — implements FR-046, FR-006, FR-007, FR-008, FR-009, FR-010 (depends on T107, the existing `FilterGroup.tsx`)
- [x] T109 [US19] Delegate to the `unit-test-writer` subagent: write `src/features/filter-builder/components/FilterBuilder.test.tsx` using a throwaway non-Employee `FilterFieldConfig`/dataset pair, covering initial render and Clear All resetting to an empty root group (including the no-op case when already empty) — implements FR-046, FR-036, FR-037, FR-039 (depends on T108, the existing `FilterBuilder.tsx`)
- [x] T110 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/filtering.spec.ts` covering User Story 1 (single condition narrows the table and count, field-change reset, boolean operator hides the value input, debounced typing) and User Story 2 (second condition in the same group, AND/OR toggle, remove condition) — implements FR-047 (US1, US2)
- [x] T111 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/nested-groups.spec.ts` covering User Story 3: add a nested group, add a second independent nested group alongside it, confirm "add group" is unavailable inside a nested group, and confirm the plain-language sentence reflects the combined AND/OR logic — implements FR-047 (US3)
- [x] T112 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/url-sharing.spec.ts` covering User Story 4: the URL updates after a filter edit via `replaceState`, a fresh page load restores the same tree/sentence/rows from a seeded URL, and a malformed/unrecognized URL falls back to an empty filter with no error shown — implements FR-047 (US4)
- [x] T113 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/hire-date.spec.ts` covering User Story 5: `hireDate` "month is", "year is", and "day is" conditions each narrow independently, and combining two `hireDate` conditions in one AND group — implements FR-047 (US5)
- [x] T114 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/validation.spec.ts` covering User Story 6: an inline error appears for a non-numeric `salary`/invalid `hireDate` year value, the table treats the condition as unset while the error is visible, and the error clears once the value is corrected — implements FR-047 (US6)
- [x] T115 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/mobile-layout.spec.ts` covering User Story 8: at a mobile-width viewport a condition's remove control renders outside the field/operator/value row and stays reachable with one tap, removal still works, and the desktop-width layout keeps its existing inline placement — implements FR-047 (US8)
- [x] T116 [P] [US19] Delegate to the `e2e-test-writer` subagent: write `e2e/clear-all.spec.ts` covering User Story 14: build a filter with multiple root-level conditions and at least one nested group, click Clear All, confirm a full reset (rows, count, sentence, URL) with no confirmation step, and confirm clicking Clear All again on an already-empty filter is a no-op — implements FR-047 (US14)
- [x] T117 [US19] Validate per [quickstart.md](./quickstart.md) → Story 19: run `npm run test` and confirm it passes, covering `filterEngine.ts`/`validation.ts`/`urlState.ts`/`employeeFieldConfig.ts`/`format.ts` and every hook/component under `hooks/`/`components/` in both `filter-builder/` and `src/hooks/` (Scenarios 1-3, FR-045/FR-046); run `npm run e2e` and confirm all eight specs (the seven new ones plus the existing `app.spec.ts` smoke test) pass against a real browser (Scenarios 4-5, FR-047); deliberately break a previously-specified behavior (e.g. comment out the vacuous-match check for an undefined condition value in `evaluateNode`), re-run `npm run test`, confirm the corresponding test fails and identifies the regressed behavior, then revert the change (Scenario 6, SC-024) (depends on T099-T116)

**Checkpoint**: All nineteen user stories are independently functional, and every one of them (US1-US18) has at least one automated test tracing back to its acceptance scenarios.

---

## Phase 28: Polish & Cross-Cutting Concerns (User Story 19)

**Purpose**: Repo-wide quality gates after automated test coverage is added.

- [x] T118 [P] Run `npm run build` (type-check + production build), `npm run lint`, `npm run test`, and `npm run e2e` — all four must pass per CLAUDE.md's and quickstart.md's regression-watch quality gates
- [x] T119 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — all 19 stories, the accessibility spot-check, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on User Story 1 (extends the same `FilterGroup.tsx`); not a new file set
- **User Story 3 (Phase 5)**: Depends on User Story 1 (extends `FilterGroup.tsx`/`FilterBuilder.tsx`)
- **User Story 4 (Phase 6)**: Depends on User Story 1 (`FilterBuilder.tsx` to wire into) and Foundational (`types.ts`, `fieldConfig.ts`)
- **User Story 5 (Phase 7)**: Depends on Foundational (`types.ts`, `fieldConfig.ts`, `employees.ts`) and User Story 1 (`FilterCondition.tsx`, `EmployeeTable.tsx` to extend); independent of US2–US4's own changes
- **User Story 6 (Phase 8)**: Depends on Foundational (`types.ts`, `fieldConfig.ts`) and User Story 1 (`FilterCondition.tsx`, `filterEngine.ts` to extend); independent of US2–US5's own changes
- **User Story 7 (Phase 9)**: Depends on User Story 1 (`EmployeeTable.tsx` to extend) and User Story 3/5 (`FilterGroup.tsx`'s `isRoot` prop from T012, `FilterCondition.tsx`'s per-operator `valueKind` from T025); independent of US6's own changes
- **User Story 8 (Phase 10)**: Depends on User Story 7 (extends the fixed-column grid `FilterCondition.tsx` from T036); independent of US2–US6's own changes
- **Polish (Phase 11)**: Depends on all eight user stories
- **User Story 9 (Phase 12)**: Depends on the existing `useDebouncedValue.ts` (from US1's T041); independent of US2–US8
- **User Story 10 (Phase 13)**: Depends on User Story 9 (`useConditionRow.ts` calls `useDebouncedValue`, so T047's re-sync fix should land first) and the existing `fieldConfig.ts`/`validation.ts`/`ValueInput.tsx`
- **User Story 11 (Phase 14)**: Depends on the existing `filterEngine.ts`/`FilterBuilder.tsx`; independent of US9-US10's own changes
- **User Story 12 (Phase 15)**: Depends on the existing `filter-builder/index.ts`; independent of US9-US11's own changes
- **User Story 13 (Phase 16)**: Depends on User Story 9 (T047's re-sync fix, relocated in T058) and User Story 10 (`useConditionRow.ts` from T049, updated in T060)
- **Polish (Phase 17)**: Depends on User Stories 9-13
- **User Story 3 Revised (Phase 18)**: Depends on the existing `FilterGroup.tsx` (T012) and `filterEngine.ts`/`fieldConfig.ts` (T005, T004); independent of US9-US13
- **User Story 14 (Phase 19)**: Depends on the existing `filterEngine.ts` and `FilterBuilder.tsx`/`useFilterUrlSync.ts` (T009, T017-T018); independent of Phase 18's own changes
- **Accessibility (Phase 20)**: Depends on the existing `FilterCondition.tsx`, `ValueInput.tsx`, `FilterGroup.tsx`, and Phase 19's Clear All button (T069, for its own `aria-label`)
- **Polish (Phase 21)**: Depends on Phases 18-20
- **User Story 15 (Phase 22)**: Depends on the existing `types.ts`/`fieldConfig.ts`/`validation.ts`/`filterEngine.ts`/`urlState.ts`/`FilterBuilder.tsx`/`EmployeeTable.tsx`/`format.ts`/`App.tsx` (from Phases 2-21); independent of Phase 18-20's own changes
- **User Story 16 (Phase 23)**: Depends on User Story 15 (Phase 22) — the files being moved into `hooks/`/`components/` must already be generic
- **User Story 17 (Phase 24)**: Depends on User Story 16 (Phase 23) — `useConditionRow.ts` and `fieldConfig.ts` must already be at their `hooks/`/top-level post-move locations
- **User Story 18 (Phase 25)**: Depends on User Story 16 (Phase 23) — the `hooks/`/`components/` subfolders must exist before they can get entry files; independent of Phase 24's own changes
- **Polish (Phase 26)**: Depends on Phases 22-25
- **User Story 19 (Phase 27)**: Depends on the completed, generalized implementations of every prior phase (Phases 2-26) — it writes tests against the current shape of `filterEngine.ts`, `validation.ts`, `urlState.ts`, `src/data/employeeFieldConfig.ts`/`format.ts`, `src/hooks/useDebouncedCommit.ts`, and every hook/component under `filter-builder/hooks/`/`components/`
- **Polish (Phase 28)**: Depends on Phase 27

Unlike a typical backend feature, US2–US7 here are not fully independent of US1's files — they extend the same small set of components rather than adding disjoint ones, per the plan's single-page, single-module design (data-model.md, research.md §1). Each story is still independently _testable_ per its Independent Test above. The same is true of US9–US13: each is a maintainability refactor of files already built by US1/US6/US7, not a disjoint file set. Phases 18-20 follow the same pattern: Phase 18 revises `FilterGroup.tsx`'s existing gating rule and finally implements the long-flagged `describeFilter` gap, Phase 19 adds one function plus one button to already-existing files, and Phase 20 only adds `aria-label` attributes to controls that already exist.

### Within Each Phase

- Foundational: T002 and T003 are independent of each other; T004 needs T003; T005 needs T002–T004
- US1: T006 and T007 are independent of each other; T008 needs T007; T009 needs T005, T006, T008; T010 needs T009
- US3: T012 needs T008; T013 needs T012 and T009; T014 needs T013
- US4: T015 needs T003; T016 needs T015 and T004; T017 needs T016; T018 needs T017 and T009
- US5: T021 and T022 are independent of each other; T023 needs T022; T024 needs T021 and T022; T025 needs T023; T026 needs T021; T027 needs T024, T025, T026
- US6: T030 needs T003, T004; T031 needs T030, T005 (parallel with T032); T032 needs T030 (parallel with T031); T033 needs T031, T032
- US7: T034 needs T002; T035 needs T034; T036 needs T025; T037 needs T012; T038 needs T035, T036, T037
- US1 (debounce addition): T041 needs T010; T042 needs T041
- US8: T043 needs T036; T044 needs T043
- US9: T047 needs the existing `useDebouncedValue.ts`; T048 needs T047
- US10: T049 needs T047 (and the existing `fieldConfig.ts`/`validation.ts`); T050 needs T049; T051 needs T050; T052 needs T051
- US11: T053 needs the existing `filterEngine.ts`; T054 needs T053; T055 needs T054
- US12: T056 needs the existing `index.ts`; T057 needs T056
- US13: T058 needs T047; T059 needs T058; T060 needs T059 and T049; T061 needs T060
- US3 (revised): T064 needs the existing `FilterGroup.tsx`; T065 needs the existing `filterEngine.ts`/`fieldConfig.ts` (parallel with T064); T066 needs T065; T067 needs T064 and T066
- US14: T068 needs the existing `filterEngine.ts`; T069 needs T068; T070 needs T069
- Accessibility: T071, T072, T073 are independent of each other; T074 needs T071, T072, T073, and T069
- US15: T077 needs the existing `types.ts`; T078 and T079 each need T077 (parallel with each other); T080 needs T077 and T079; T081 needs T077-T080; T082 is independent of T077-T081; T083 needs T078 and T082; T084 needs T081 and T083; T085 needs T084; T086 needs T081, T082, T083; T087 needs T086
- US16: T088 needs T085 (everything being moved must already be generic); T089 needs T088
- US17: T090 needs T088; T091 needs T090; T092 needs T091
- US18: T093 and T094 each need T088 (parallel with each other); T095 needs T093 and T094; T096 needs T095
- US19: T099-T106 each need only their own already-existing target file, so all eight run in parallel; T107 needs T106 (both touch `useConditionRow`-adjacent behavior conceptually, and component tests are easiest authored condition-row-first); T108 needs T107; T109 needs T108; T110-T116 each need only the fully-built app (Phases 2-26 complete), so all seven run in parallel; T117 needs T099-T116

### Parallel Opportunities

- Foundational: T002 (`employees.ts`) and T003 (`types.ts`) can run in parallel
- US1: T006 (`EmployeeTable.tsx`) and T007 (`FilterCondition.tsx`) can run in parallel
- US5: T021 (`employees.ts`) and T022 (`types.ts`) can run in parallel; once T023 lands, T025 (`FilterCondition.tsx`) and T026 (`EmployeeTable.tsx`) can run in parallel
- US6: once T030 (`validation.ts`) lands, T031 (`filterEngine.ts`) and T032 (`FilterCondition.tsx`) touch different files and can run in parallel
- US7: T034 (`format.ts`), T036 (`FilterCondition.tsx` grid), and T037 (`FilterGroup.tsx` border) touch three different files and can all run in parallel; T035 needs T034 first
- Polish (Phase 17): T062 is marked [P] (independent of T063)
- No other tasks in Phases 12-16 are marked [P] — each user story's tasks are a sequence of edits to the same one or two files
- US3 (revised): T064 (`FilterGroup.tsx`) and T065 (`filterEngine.ts`) touch different files and can run in parallel
- Accessibility (Phase 20): T071 (`FilterCondition.tsx`/`ValueInput.tsx`), T072 (`FilterCondition.tsx`'s Remove button), and T073 (`FilterGroup.tsx`) can all run in parallel
- Polish (Phase 21): T075 is marked [P] (independent of T076)
- US15: T078 (`filterEngine.ts`) and T079 (`validation.ts`) touch different files and can run in parallel once T077 lands; T082 (`EmployeeTable.tsx`/`format.ts` move) is independent of T077-T081 and can run any time before T086
- US18: T093 (`hooks/index.ts`) and T094 (`components/index.ts`) touch different files and can run in parallel once T088 lands
- Polish (Phase 26): T097 is marked [P] (independent of T098)
- US19: T099-T106 are all marked [P] (eight independent unit/hook-test files); T110-T116 are all marked [P] (seven independent e2e specs, each a different flow); T107-T109 are not marked [P] since component tests for `FilterCondition`/`FilterGroup`/`FilterBuilder` are most reliably written in that nesting order (see research.md §28's co-location rationale)
- Polish (Phase 28): T118 is marked [P] (a quality-gate check independent of T119's manual walkthrough)

---

## Parallel Example: Foundational

```bash
Task: "Create src/data/employees.ts with Employee type and 40-row mock dataset"
Task: "Create src/features/filter-builder/types.ts with Field/Operator/FilterCondition/FilterGroup/FilterNode types"
```

## Parallel Example: User Story 1

```bash
Task: "Create src/features/filter-builder/EmployeeTable.tsx"
Task: "Create src/features/filter-builder/FilterCondition.tsx"
```

## Parallel Example: User Story 5

```bash
Task: "Add hireDate to Employee interface and populate 40 rows in src/data/employees.ts"
Task: "Add hireDate Field and day_is/month_is/year_is Operator variants in src/features/filter-builder/types.ts"
```

## Parallel Example: User Story 6

```bash
Task: "Update evaluateNode in src/features/filter-builder/filterEngine.ts to treat an invalid value as vacuous"
Task: "Update src/features/filter-builder/FilterCondition.tsx to show an inline validation error"
```

## Parallel Example: User Story 7

```bash
Task: "Create src/features/filter-builder/format.ts with formatSalary/formatHireDate"
Task: "Apply a fixed-width Tailwind grid to src/features/filter-builder/FilterCondition.tsx"
Task: "Add a left border + indentation for nested groups in src/features/filter-builder/FilterGroup.tsx"
```

## Parallel Example: Accessibility (Phase 20)

```bash
Task: "Add aria-labels to FilterCondition.tsx's field/operator selects and ValueInput.tsx's value controls"
Task: "Add an aria-label to FilterCondition.tsx's Remove button"
Task: "Add aria-labels to FilterGroup.tsx's AND/OR toggle, Remove group, Add condition, and Add group buttons"
```

## Parallel Example: User Story 15

```bash
Task: "Update filterEngine.ts's evaluateNode/describeFilter to take a fieldConfig parameter"
Task: "Update validation.ts's validateConditionValue to look up its schema from a fieldConfig parameter"
```

## Parallel Example: User Story 18

```bash
Task: "Create src/features/filter-builder/hooks/index.ts re-exporting useConditionRow and useFilterUrlSync"
Task: "Create src/features/filter-builder/components/index.ts re-exporting FilterBuilder, FilterGroup, FilterCondition, ValueInput"
```

## Parallel Example: User Story 19

```bash
Task: "Write src/features/filter-builder/filterEngine.test.ts (unit-test-writer)"
Task: "Write src/features/filter-builder/validation.test.ts (unit-test-writer)"
Task: "Write src/features/filter-builder/urlState.test.ts (unit-test-writer)"
Task: "Write src/data/employeeFieldConfig.test.ts (unit-test-writer)"
Task: "Write src/data/format.test.ts (unit-test-writer)"
Task: "Write src/hooks/useDebouncedCommit.test.ts (unit-test-writer)"
Task: "Write src/features/filter-builder/hooks/useFilterUrlSync.test.tsx (unit-test-writer)"
Task: "Write src/features/filter-builder/hooks/useConditionRow.test.tsx (unit-test-writer)"
```

```bash
Task: "Write e2e/filtering.spec.ts (e2e-test-writer)"
Task: "Write e2e/nested-groups.spec.ts (e2e-test-writer)"
Task: "Write e2e/url-sharing.spec.ts (e2e-test-writer)"
Task: "Write e2e/hire-date.spec.ts (e2e-test-writer)"
Task: "Write e2e/validation.spec.ts (e2e-test-writer)"
Task: "Write e2e/mobile-layout.spec.ts (e2e-test-writer)"
Task: "Write e2e/clear-all.spec.ts (e2e-test-writer)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (single-condition filtering)
4. **STOP and VALIDATE** against quickstart.md → Story 1
5. Demo if ready — this alone proves the core mechanic (SC-001)

### Incremental Delivery

1. Setup + Foundational → data/types/config/engine ready
2. User Story 1 → validate → demo (MVP)
3. User Story 2 → validate multi-condition + AND/OR (mostly already delivered by US1's generic `FilterGroup`) → demo
4. User Story 3 → add nested-group support → validate sentence + depth limits → demo
5. User Story 4 → add URL share/restore/fallback → validate → demo
6. User Story 5 → add `hireDate` field, operators, and component-matching → validate day/month/year filtering → demo
7. User Story 6 → add schema-based condition-value validation → validate inline errors + vacuous matching → demo
8. User Story 7 → add table formatting, column alignment, and nested-group distinction → validate at-a-glance readability → demo
9. User Story 1 debounce addition → add ~300ms debounce for text/number/day/year value edits → validate keystroke behavior → demo
10. User Story 8 → add mobile remove-control placement below the `md` breakpoint → validate mobile/desktop layouts → demo
11. Polish → build/lint clean, full quickstart pass
12. User Story 9 → harden the debounce hook's external re-sync → validate no regression → demo (code-review only)
13. User Story 10 → consolidate condition-row logic into `useConditionRow` → validate no regression → demo (code-review only)
14. User Story 11 → make `FilterBuilder.tsx` pure composition via `describeMatchCount` → validate no regression → demo (code-review only)
15. User Story 12 → audit the feature's single entry point → validate import boundaries → demo (code-review only)
16. User Story 13 → relocate the debounce hook to `src/hooks/` → validate reusability + no regression → demo
17. Polish → build/lint clean, full quickstart pass (Stories 1-13)
18. User Story 3 (revised) → allow any number of nested groups + implement the long-missing `describeFilter` sentence → validate combined-logic sentence → demo
19. User Story 14 → add Clear All → validate full-reset + no-op-when-empty → demo
20. Accessibility → add `aria-label`s across all existing controls → validate keyboard-only + accessible-name spot-check → demo
21. Polish → build/lint clean, full quickstart pass (Stories 1-14 + accessibility)
22. User Story 15 → generalize `types.ts`/`filterEngine.ts`/`validation.ts`/`urlState.ts`/components to a caller-supplied `FilterFieldConfig<TRow>`, relocate Employee-specific config/table/formatting to `src/data/` → validate a throwaway config wires through with no Employee reference left inside the feature → demo (code-review only)
23. User Story 16 → move hook files into `hooks/` and component files into `components/` → validate only import paths changed → demo (code-review only)
24. User Story 17 → replace `useConditionRow`'s debounced/immediate branch with one wrapped `useDebouncedCommit` call configured by a per-`valueKind` delay → validate no regression to debounce timing → demo (code-review only)
25. User Story 18 → add `hooks/index.ts` and `components/index.ts`, route every cross-subfolder import through them → validate no direct nested-file imports remain → demo (code-review only)
26. Polish → build/lint clean, full quickstart pass (Stories 1-18 + accessibility)
27. User Story 19 → add unit tests for the engine/validation/URL/config/format modules and the debounce/URL-sync hooks, component tests for the condition row/filter group/filter builder, and e2e specs for Stories 1-6, 8, 14 → validate `npm run test`/`npm run e2e` pass and a deliberate regression is caught → demo (test-coverage only, no new user-facing behavior)
28. Polish → build/lint/test/e2e all clean, full quickstart pass (Stories 1-19 + accessibility)

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task
- [Story] labels map tasks to spec.md's US1–US19 for traceability
- Phases 1-26 (User Stories 1-18) predate this project's test runner; their own "Independent Test" stayed a manual quickstart.md walkthrough. Phase 27 (User Story 19) retroactively adds automated coverage for all of them, per FR-045–FR-048
- Stories 9-13 and 15-18 are read-the-code / audit-only user stories — their "Independent Test" is a code review plus a browser regression check, not new user-visible behavior
- Story 19's unit/component tests are authored via the `unit-test-writer` subagent and its end-to-end specs via the `e2e-test-writer` subagent, per plan.md's Assumptions and this project's testing convention (CLAUDE.md)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
- T053's flagged question about the missing `describeFilter`/FR-012 sentence was never resolved during Phases 13-17 (confirmed still missing when generating Phase 18) — Phase 18 (T065) now implements it directly, since Story 3 (revised)'s Scenario 4 makes it a hard blocker rather than an optional follow-up
- Phase 20 (Accessibility) has no dedicated user story number in spec.md — FR-038/SC-018 are a cross-cutting constraint introduced by the 2026-07-28 Amendment 2, so its tasks carry no `[Story]` label, consistent with the Setup/Foundational/Polish phases above
- Phases 22-25 (Stories 15-18, Amendment 3) are the first pass over `filter-builder` since it was built entirely hardcoded to `Employee` — the Status Note above this section records every place that hardcoding currently lives (`types.ts`'s fixed `Field`/`Operator` unions, `fieldConfig.ts`/`validation.ts`'s Employee entries, `EmployeeTable.tsx`/`format.ts` inside the feature folder); T080 also folds in the FR-013 encode-time invalid-condition-drop behavior, found missing from `urlState.ts` while auditing the exact function T080 already has to touch for genericization
  </content>
