---

description: "Task list for Advanced Filter Builder"
---

# Tasks: Advanced Filter Builder

**Input**: Design documents from `/specs/001-advanced-filter-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/filter-url-schema.md, quickstart.md

**Tests**: No test runner is configured in this project (see plan.md → Technical Context → Testing). No test tasks are included; each user story instead references its manual repro steps in [quickstart.md](./quickstart.md), per the constitution's "manual repro step instead" rule.

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P14) so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1–US14 from spec.md
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single Vite + React project (existing scaffold). Feature code lives under `src/data/` and `src/features/filter-builder/`; User Stories 12-13 add a second, sibling module at `src/hooks/` for the relocated debounce hook, per plan.md.

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

---

## Phase 1: Setup

**Purpose**: Establish the feature's module boundary. No new dependencies — the feature uses only the existing React 19 + Tailwind v4 stack (research.md).

- [X] T001 Create the `src/features/filter-builder/` directory (holds all feature code per plan.md's Project Structure); no new npm packages required

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data, types, per-field config, and pure evaluation/sentence functions every user story builds on.

**⚠️ CRITICAL**: No user story can start until this phase is complete.

- [X] T002 [P] Create `src/data/employees.ts` with the `Employee` type (`id`, `name`, `country: "EG"|"SA"|"AE"|"US"|"DE"`, `salary: number`, `isActive: boolean`) and a static 40-row mock dataset covering a mix of all 5 countries, salary ranges, and active/inactive values, per data-model.md → Employee
- [X] T003 [P] Create `src/features/filter-builder/types.ts` with the `Field`, `Operator`, `FilterCondition`, `FilterGroup`, and `FilterNode` (discriminated union on `kind`) types per data-model.md → Field & Operator / FilterCondition / FilterGroup
- [X] T004 Create `src/features/filter-builder/fieldConfig.ts`: a config map keyed by `Field` giving its valid `Operator[]`, `valueKind` (`"text"|"number"|"select"|"none"`), the fixed `country` option list, and the default (first) operator per field — implements FR-003, FR-004, FR-005 as data, not branching (depends on T003)
- [X] T005 Create `src/features/filter-builder/filterEngine.ts` with three framework-free functions: `evaluateNode(node, employee)` (condition → operator match, vacuous on undefined value; group → `every`/`some` over children per `logic`, vacuous on empty children), `matchCount`/filtered-rows helper, and `describeFilter(tree)` (recursive plain-language sentence, parenthesizing any nested group) — per data-model.md → Filter tree evaluation and research.md §6, implements FR-011/FR-012 (depends on T002, T003, T004)

**Checkpoint**: Data, types, config, and pure logic exist — user story UI work can begin.

---

## Phase 3: User Story 1 - Filter the table with a single rule (Priority: P1) 🎯 MVP

**Goal**: Show all 40 employees with an empty filter; let the user add one condition and see the table and match count narrow immediately, with field-change reset and boolean-operator value-hiding working correctly.

**Independent Test**: Load the page, add a single condition (e.g., `country is EG`), confirm the table and count narrow correctly — see [quickstart.md](./quickstart.md) → Story 1.

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `src/features/filter-builder/EmployeeTable.tsx`: renders the table header (name, country, salary, active) plus the matching rows it's given as props, or a "No data matching the filter" message in place of rows when the list is empty — implements FR-001, FR-017 (depends on T002)
- [X] T007 [P] [US1] Create `src/features/filter-builder/FilterCondition.tsx`: renders field/operator/value controls driven entirely by `fieldConfig` (dropdown for `country`, number input for `salary`, text input for `name`, no value input for `isActive` operators); changing the field resets the operator to that field's default and clears the value — implements FR-002–FR-005 (depends on T004)
- [X] T008 [US1] Create `src/features/filter-builder/FilterGroup.tsx`: renders the group's AND/OR toggle and its list of child `FilterCondition`s, with add-condition and remove-condition controls — implements FR-006 (toggle), FR-009, FR-010 for conditions (depends on T007)
- [X] T009 [US1] Create `src/features/filter-builder/FilterBuilder.tsx`: owns the root `FilterGroup` state (`useState`/`useReducer`, initialized to an empty root group), derives the visible rows/match count and the sentence via `filterEngine` on every render, and renders the sentence + `FilterGroup` (root) + `EmployeeTable` — implements FR-011, FR-012, FR-016 (depends on T005, T006, T008)
- [X] T010 [US1] Wire `src/App.tsx` to render `<FilterBuilder />` (depends on T009)
- [X] T041 [US1] Add local debounce (~300ms) for `text`/`number`/`day`/`year` `valueKind` edits in `src/features/filter-builder/FilterCondition.tsx`: hold the in-progress value in local state so the input reflects every keystroke immediately, but only call the parent's `onChange` (committing to the filter tree) after a pause in typing; `select`/`month`/`none` kinds continue to call `onChange` synchronously, unchanged — per research.md §13, implements FR-025 (depends on T010)
- [X] T042 [US1] Validate the debounce behavior end-to-end per quickstart.md → Story 1, Scenario 5 (type several digits into a `salary` value quickly; confirm the input updates every keystroke but the table/count update only once, after the pause) (depends on T041)

**Checkpoint**: User Story 1 is fully functional and independently testable via quickstart.md → Story 1.

---

## Phase 4: User Story 2 - Combine multiple rules in a group (Priority: P2)

**Goal**: Let the user add a second condition to the root group and toggle it between AND/OR, changing the result set accordingly.

**Independent Test**: Starting from one condition, add a second, toggle AND/OR, remove one — confirm the result set updates correctly each time — see [quickstart.md](./quickstart.md) → Story 2.

### Implementation for User Story 2

- [X] T011 [US2] Validate multi-condition + AND/OR behavior end-to-end per quickstart.md → Story 2. No new files: `FilterGroup.tsx` (T008) already renders add/remove-condition and the AND/OR toggle generically over the group's `children` array, and `filterEngine.ts`'s `evaluateNode` (T005) already combines any number of children with `every`/`some` per `logic` — this is FR-006 delivered as one generic implementation rather than a first-condition special case, per Constitution VI. If any gap is found while validating (e.g., toggle not re-rendering, remove not preserving remaining conditions), fix it directly in `src/features/filter-builder/FilterGroup.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 3 - Nest a group for more complex logic (Priority: P3)

**Goal**: Let the user add one nested group inside the root group, each with its own AND/OR and conditions, with no way to nest a third level or a second root-level nested group — and have the plain-language sentence correctly describe the combined logic.

**Independent Test**: Add a nested group with its own conditions, confirm no "add group" control appears inside it, and confirm the sentence reflects both levels correctly — see [quickstart.md](./quickstart.md) → Story 3.

### Implementation for User Story 3

- [X] T012 [US3] Add an `isRoot` prop to `src/features/filter-builder/FilterGroup.tsx` that gates a new add-nested-group control: rendered only when `isRoot` is true and the group's `children` contains no group yet; never rendered when `isRoot` is false — implements FR-007, FR-008 (depends on T008)
- [X] T013 [US3] In `src/features/filter-builder/FilterBuilder.tsx`, pass `isRoot={true}` when rendering the root `FilterGroup` (and `false` for the nested one), and ensure the remove-group handler deletes the nested group and its entire subtree — implements FR-007, FR-010 (depends on T012, T009)
- [X] T014 [US3] Validate that `describeFilter` (`src/features/filter-builder/filterEngine.ts`, built in T005) parenthesizes the nested group's AND/OR phrase correctly against the root's logic, e.g. "country is EG and (salary > 8000 or isActive is true)" — see quickstart.md → Story 3, step 6; implements FR-012, SC-003 (depends on T013)

**Checkpoint**: User Stories 1, 2, and 3 all work independently.

---

## Phase 6: User Story 4 - Share a filter via link (Priority: P4)

**Goal**: Reflect the filter tree in the URL's `f` query parameter on every change (via `replaceState`), restore it on fresh page load, and fall back silently to an empty filter on any decode/validation failure.

**Independent Test**: Build a filter (including a nested group), copy the URL, reload it fresh, and confirm the same filter/sentence/rows reappear; then hand-edit the URL to garbage and confirm it falls back to an empty filter with no error — see [quickstart.md](./quickstart.md) → Story 4.

### Implementation for User Story 4

- [X] T015 [US4] Create `src/features/filter-builder/urlState.ts` with `encodeFilterToParam(root)`: `JSON.stringify` → base64-encode → URL-safe substitution (`+`→`-`, `/`→`_`, strip `=` padding), per contracts/filter-url-schema.md → Encoding rule (depends on T003)
- [X] T016 [US4] Add `decodeFilterFromParam(raw)` to `urlState.ts`: reverse the URL-safe substitution, base64-decode, `JSON.parse` on an `unknown` value, then structurally validate against `fieldConfig` (unknown field/operator, a group nested inside another nested group (depth > 2), or any shape mismatch → return `null` for the whole tree); never throws — per contracts/filter-url-schema.md → Decoding rule, research.md §5, implements FR-015 (depends on T015, T004). **2026-07-28 correction**: this task's original wording ("more than one root-level nested group... → return null") encoded the pre-amendment single-nested-group cap; Phase 18 relaxed FR-007/FR-008 to allow any number of root-level nested groups but never revisited this task or its implementation, leaving `decodeFilterFromParam` rejecting (and silently discarding) any URL with 2+ nested groups — including ones `encodeFilterToParam` itself produces, violating FR-014/SC-004. Fixed directly in `urlState.ts`'s `parseGroup`: the nested-group *count* check is removed, the depth (`!== 1`) check — the still-valid "no third level" rule — is kept.
- [X] T017 [US4] Create `src/features/filter-builder/useFilterUrlSync.ts`: on mount, read `window.location.search`, call `decodeFilterFromParam`, and expose the result (or an empty root group on `null`) as initial filter state; on every filter-tree change, call `encodeFilterToParam` and apply it with `window.history.replaceState` (never `pushState`) — per research.md §4, implements FR-013, FR-014 (depends on T016)
- [X] T018 [US4] Wire `useFilterUrlSync` into `src/features/filter-builder/FilterBuilder.tsx`, replacing the plain `useState` initializer from T009 with the hook's initial value and change-sync behavior — implements FR-013–FR-015 (depends on T017, T009)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: User Story 5 - Filter by hire date components (Priority: P5)

**Goal**: Add a `hireDate` field with three independent-component operators (`day_is`/`month_is`/`year_is`), each matching only its own component of the employee's hire date regardless of the other two, with a month value entered via a selector (never free-typed).

**Independent Test**: Add a `hireDate` condition with `month_is` = a chosen month, confirm the table shows only employees hired in that month across any year; combine with a `year_is` condition in the same group and confirm both narrow together — see [quickstart.md](./quickstart.md) → Story 5.

### Implementation for User Story 5

- [X] T021 [P] [US5] Add `hireDate: string` (`"YYYY-MM-DD"`) to the `Employee` interface in `src/data/employees.ts` and populate a hire date for each of the 40 existing rows, varied enough across months, years, and days-of-month that component filtering is meaningful to test — per data-model.md → Employee, spec.md Assumptions; implements FR-001
- [X] T022 [P] [US5] Add `"hireDate"` to the `Field` union and `"day_is" | "month_is" | "year_is"` to the `Operator` union in `src/features/filter-builder/types.ts` — per data-model.md → Field & Operator
- [X] T023 [US5] Restructure `src/features/filter-builder/fieldConfig.ts` so `valueKind` is resolved per-*operator* rather than per-field (research.md §7): change each field's config to map its operators to their value-input kind, add a `"day" | "month" | "year"` kind alongside the existing `"text"|"number"|"select"|"none"`, add a `hireDate` entry (`day_is`→`"day"`, `month_is`→`"month"`, `year_is`→`"year"`) with its own `describe` phrasing, and add a small `MONTH_OPTIONS` constant (`"January"`…`"December"` mapped to `1`-`12`) colocated in this file — implements FR-003, FR-004, FR-012 (depends on T022)
- [X] T024 [US5] Update `evaluateCondition` in `src/features/filter-builder/filterEngine.ts` to handle `day_is`/`month_is`/`year_is` by slicing the relevant component directly from `employee.hireDate` (`.slice(8, 10)`, `.slice(5, 7)`, `.slice(0, 4)` — string slicing, not `Date` parsing, per research.md §8) and comparing it as a number, never reading the other two components — implements FR-018 (depends on T021, T022)
- [X] T025 [P] [US5] Update `src/features/filter-builder/FilterCondition.tsx` to resolve `valueKind` from the selected *operator* (via the restructured `fieldConfig`, T023) instead of the field, and render the three new input kinds: a number input constrained to 1-31 for `"day"`, a `<select>` of month names (backed by `MONTH_OPTIONS`) for `"month"`, and a plain number input for `"year"` — implements FR-004, Story 5 Scenario 5 (depends on T023)
- [X] T026 [P] [US5] Add a "Hire Date" column to the header and each row in `src/features/filter-builder/EmployeeTable.tsx`, displaying `employee.hireDate` — implements FR-001 (depends on T021)
- [X] T027 [US5] Validate hire-date filtering end-to-end per quickstart.md → Story 5 (`month_is`, `year_is`, `day_is` individually, then `month_is` + `year_is` combined via AND, then confirm the month input is a selector not free entry) — no new files; exercises T023–T026 together (depends on T024, T025, T026)

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: User Story 6 - Trust the filter's input (Priority: P6)

**Goal**: Validate a condition's entered value against its field/operator's schema before applying it to the filter; show an inline error and treat the condition as unset (vacuous) while the value is invalid.

**Independent Test**: Add a `salary` condition and type a non-numeric value; confirm an inline error appears and the table behaves as if the condition were unset until corrected — see [quickstart.md](./quickstart.md) → Story 6.

### Implementation for User Story 6

- [X] T030 [P] [US6] Create `src/features/filter-builder/validation.ts` with a Zod schema per `(field, operator)` pair, keyed the same way `fieldConfig.ts` keys `valueKindByOperator` (`salary`'s `gt`/`lt`/`eq` → `z.coerce.number().nonnegative()`; `hireDate`'s `year_is` → a 4-digit-integer schema, `day_is` → 1-31 integer, `month_is` → 1-12 integer; `name`/`country` → non-empty string/enum; `is_true`/`is_false` → always valid), and export `validateConditionValue(condition): { valid: true } | { valid: false; error: string }` — per research.md §10, implements FR-021 (depends on T003, T004)
- [X] T031 [P] [US6] Update `evaluateNode` in `src/features/filter-builder/filterEngine.ts` to call `validateConditionValue` and treat a failing value the same as an `undefined` value (vacuous — never excludes a row) — implements FR-022, Edge Cases (depends on T030, T005)
- [X] T032 [P] [US6] Update `src/features/filter-builder/FilterCondition.tsx` to call `validateConditionValue` on the current value and render an inline, field-level error message beneath the value control when it fails — implements FR-022 (depends on T030)
- [X] T033 [US6] Validate invalid-value inline errors (non-numeric salary, malformed `hireDate` year) and vacuous-match behavior end-to-end per [quickstart.md](./quickstart.md) → Story 6 (depends on T031, T032)

**Checkpoint**: User Stories 1-6 are all independently functional.

---

## Phase 9: User Story 7 - Scan a complex filter at a glance (Priority: P7)

**Goal**: Align every condition's field/operator/value controls into consistent columns within a group, visually distinguish a nested group from the root, and give salary/hire-date table cells consistent, legible formatting.

**Independent Test**: Build a group with three or more conditions plus a nested group; confirm the controls line up in consistent columns and the nested group is visually distinguishable from the root — see [quickstart.md](./quickstart.md) → Story 7.

### Implementation for User Story 7

- [X] T034 [P] [US7] Create `src/features/filter-builder/format.ts` with `formatSalary(salary: number): string` (`Intl.NumberFormat`, `maximumFractionDigits: 0`, thousands separators, no currency symbol) and `formatHireDate(hireDate: string): string` (`"D MMM YYYY"` built via string slicing of `"YYYY-MM-DD"`, never a `Date` object) — per research.md §11, implements FR-019/FR-020 (depends on T002)
- [X] T035 [US7] Update `src/features/filter-builder/EmployeeTable.tsx` to render the `salary` and `hireDate` cells through `formatSalary`/`formatHireDate` instead of the raw values, without changing the underlying data used for filtering — implements FR-019/FR-020, SC-009 (depends on T034)
- [X] T036 [P] [US7] Apply a fixed-width Tailwind grid (`grid grid-cols-[...]`) to `src/features/filter-builder/FilterCondition.tsx`'s field/operator/value/remove controls, identical across every condition row regardless of `valueKind`, so a group's rows align into consistent columns — per research.md §12, implements FR-023 (depends on T025)
- [X] T037 [P] [US7] Add a left border + indentation (e.g. `border-l-2 pl-4 ml-2`) to nested-group rendering in `src/features/filter-builder/FilterGroup.tsx` (`isRoot={false}`) so it reads as visually distinct from the root group — per research.md §12, implements FR-024 (depends on T012)
- [X] T038 [US7] Validate column alignment, nested-group visual distinction, and salary/hire-date formatting end-to-end per [quickstart.md](./quickstart.md) → Story 7 (depends on T035, T036, T037)

**Checkpoint**: All seven user stories are independently functional.

---

## Phase 10: User Story 8 - Manage filters comfortably on a mobile screen (Priority: P8)

**Goal**: On viewports narrower than Tailwind's `md` breakpoint (768px), a condition's remove control renders outside the field/operator/value row while staying reachable with one tap; the existing inline placement at `md` and above is unchanged.

**Independent Test**: View the filter builder at a mobile viewport width, add a condition, and confirm the remove control sits outside the field/operator/value row while remaining tappable; confirm the desktop layout (≥768px) is unchanged — see [quickstart.md](./quickstart.md) → Story 8.

### Implementation for User Story 8

- [X] T043 [US8] Change the condition-row grid in `src/features/filter-builder/FilterCondition.tsx` (the fixed `grid grid-cols-[10rem_8rem_12rem_5rem]` from T036) to a single-column stack below Tailwind's `md` breakpoint (`grid-cols-1 md:grid-cols-[10rem_8rem_12rem_5rem]`), so the remove control lands on its own row on narrow viewports with no new markup or JS-based viewport detection; the existing fixed-column grid (and the remove control's inline placement within it) is unchanged at `md` and above — per research.md §14, implements FR-026 (depends on T036)
- [X] T044 [US8] Validate mobile remove-control placement end-to-end per [quickstart.md](./quickstart.md) → Story 8 (resize below 768px, confirm the remove control is outside the input row and still removes the condition on tap; resize back to desktop width and confirm the inline placement is unchanged) (depends on T043)

**Checkpoint**: All eight user stories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide quality gates and full manual validation.

- [X] T019 [P] Run `npm run build` (type-check + production build) and `npm run lint`; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T020 Run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end (setup check, Stories 1–4, zero-match edge case, regression watch on the back button) and confirm every expectation holds
- [X] T028 [P] Re-run `npm run build` and `npm run lint` after the User Story 5 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T029 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Story 5 and the zero-match edge case, and confirm every expectation still holds
- [X] T039 [P] Re-run `npm run build` and `npm run lint` after the User Story 6/7 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T040 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Stories 6-7 and the zero-match edge case, and confirm every expectation still holds
- [X] T045 [P] Re-run `npm run build` and `npm run lint` after the debounce (T041) and mobile layout (T043) changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T046 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end, including Story 1 Scenario 5 (debounce), Story 8 (mobile remove control), and the zero-match edge case, and confirm every expectation still holds

---

## Phase 12: User Story 9 - Maintain debounced value editing confidently (Priority: P9)

**Goal**: The debounce mechanism behind FR-025 (immediate typing feedback, delayed filter commit, correct re-sync on external value changes) lives in one clearly-named hook, not spread across several pieces of component state — with no change to any previously-specified behavior.

**Independent Test**: Read `useDebouncedValue.ts` and confirm the mechanism is one cohesive unit; in the browser, start typing into a debounced field, switch the condition's field before the delay elapses, and confirm the value resets cleanly with no stale leftover text — see [quickstart.md](./quickstart.md) → Story 9.

### Implementation for User Story 9

- [X] T047 [US9] In `src/features/filter-builder/useDebouncedValue.ts`, add re-sync behavior: when the externally-committed `value` changes for a reason other than this hook's own `onCommit` call (e.g., the condition's field is switched and its value is cleared), `localValue` MUST adopt the new external value rather than keep showing the stale in-flight edit — the hook's current `useState(value)` initializer only seeds `localValue` once and never re-adopts a later external change, which is Scenario 3's gap. Keep the existing immediate-display/delayed-commit behavior for `FilterCondition.tsx`'s own edits unchanged — implements FR-027 Scenario 3, FR-028 (depends on the existing hook; no new file)
- [X] T048 [US9] Validate per [quickstart.md](./quickstart.md) → Story 9: confirm the debounce mechanism reads as one named unit when the hook file is opened (Scenario 1), re-run Story 1 Scenario 5 (salary debounce) and Story 8 (mobile remove control) to confirm no regression (Scenario 2, FR-028), and confirm switching a debounced field mid-edit clears cleanly with no stale/duplicate state (Scenario 3) (depends on T047)

**Checkpoint**: User Story 9's debounce hook is self-contained and behavior-preserving.

---

## Phase 13: User Story 10 - Understand a condition row's code without tracing branches (Priority: P10)

**Goal**: `FilterCondition.tsx`'s field-change, operator-change, and value-commit handling are owned by one custom hook; the component renders only from that hook's return value, with no field/operator/value-kind branching of its own, and the debounced-or-not decision comes from `fieldConfig`, not a hardcoded check.

**Independent Test**: Read `FilterCondition.tsx` and confirm it contains no conditional logic keyed on a field, operator, or value-kind name — only rendering from a single hook call's return value — see [quickstart.md](./quickstart.md) → Story 10.

### Implementation for User Story 10

- [X] T049 [US10] Create `src/features/filter-builder/useConditionRow.ts`: a hook taking `(condition, onChange)` that resolves `config`/`valueKind` from `fieldConfig`, calls `useDebouncedValue` for debounced value kinds, runs `validateConditionValue`, and owns `handleFieldChange`/`handleOperatorChange`/`handleValueChange` — including FR-005's reset-operator-and-clear-value-on-field-change rule and the clear-value-on-hireDate-operator-change rule — returning `{ config, valueKind, displayValue, validation, handleFieldChange, handleOperatorChange, handleValueChange }`; the debounced-vs-immediate commit decision inside `handleValueChange` MUST read `isDebouncedValueKind(valueKind)` from `fieldConfig` rather than compare against a field/operator name directly — per data-model.md → "Condition-row hook and shared debounce hook", research.md §16, implements FR-029, FR-030 (depends on the existing `fieldConfig.ts`, `validation.ts`, `useDebouncedValue.ts`)
- [X] T050 [US10] Update `src/features/filter-builder/FilterCondition.tsx` to call `useConditionRow(condition, onChange)` once and render solely from its returned values and handlers, removing the component's own `fieldConfig`/`valueKindForOperator`/`isDebouncedValueKind`/`useDebouncedValue`/`validateConditionValue` calls and its inline `handleFieldChange`/`handleOperatorChange`/`handleValueChange` — implements FR-029 (depends on T049)
- [X] T051 [US10] Confirm `src/features/filter-builder/ValueInput.tsx`'s `inputsByValueKind` lookup map (already implemented) and `FilterCondition.tsx`'s `<ValueInput valueKind={...} />` usage together leave no per-field/per-value-kind conditional rendering in the component body — implements FR-031, SC-015 (depends on T050; no new file expected)
- [X] T052 [US10] Validate per [quickstart.md](./quickstart.md) → Story 10: confirm `FilterCondition.tsx` has no field/operator/value-kind branching (Scenario 1), confirm the debounce decision is config-driven via `isDebouncedValueKind` (Scenario 2), and re-run Story 1, Story 6 (validation), and Story 9 (debounce) in the browser to confirm no regression (Scenario 3, FR-035) (depends on T051)

**Checkpoint**: `FilterCondition.tsx` is a pure renderer over `useConditionRow`'s output.

---

## Phase 14: User Story 11 - Understand the filter page's code as pure composition (Priority: P11)

**Goal**: `FilterBuilder.tsx` contains no logic beyond composing `useFilterUrlSync`, `filterEmployees`, and its child components — the pluralized match-count text is derived elsewhere and simply rendered.

**Independent Test**: Read `FilterBuilder.tsx` and confirm every line either renders a child component or calls a hook/function defined elsewhere — see [quickstart.md](./quickstart.md) → Story 11.

### Implementation for User Story 11

- [X] T053 [US11] Add `describeMatchCount(count: number): string` to `src/features/filter-builder/filterEngine.ts`, returning the pluralized match text (e.g. `"1 match"`, `"40 matches"`) — per research.md §18, implements FR-032. **Before starting**: `filterEngine.ts` currently has no `describeFilter` function and `FilterBuilder.tsx` renders no plain-language filter sentence (see Status Note above) even though research.md §18 describes `describeMatchCount` as sitting "alongside the existing `describeFilter`." Confirm with the user whether FR-012/Story 3's sentence needs to be (re)implemented as part of this pass, or tracked separately, before assuming this task's scope is match-count text only (depends on the existing `filterEngine.ts`)
- [X] T054 [US11] Update `src/features/filter-builder/FilterBuilder.tsx` to call `describeMatchCount(visibleEmployees.length)` in place of its inline pluralized match-count string, so the component's body is limited to `useFilterUrlSync` (state), `filterEmployees` (derivation), and rendering `describeMatchCount`'s result plus `FilterGroup`/`EmployeeTable` — implements FR-032 (depends on T053)
- [X] T055 [US11] Validate per [quickstart.md](./quickstart.md) → Story 11: confirm every line in `FilterBuilder.tsx` either renders a child component or calls a hook/function defined elsewhere (Scenario 1), and re-run Story 1 Scenario 1 and Story 4 Scenario 1 in the browser to confirm no regression (Scenario 2, FR-035) (depends on T054)

**Checkpoint**: `FilterBuilder.tsx` reads as pure composition.

---

## Phase 15: User Story 12 - Import the feature through one stable entry point (Priority: P12)

**Goal**: Everything `filter-builder` exposes to the rest of the app is importable from its `index.ts` alone, and no file inside the feature imports back from that same entry file.

**Independent Test**: From outside `filter-builder`, confirm every consumed symbol imports from the feature's entry file only; confirm no internal file re-imports it — see [quickstart.md](./quickstart.md) → Story 12.

### Implementation for User Story 12

- [X] T056 [US12] Audit `src/features/filter-builder/index.ts` (already exists, exporting `FilterBuilder` only): confirm `src/App.tsx` imports exclusively from `./features/filter-builder` (never a nested file such as `./features/filter-builder/FilterBuilder`), and confirm no file inside `src/features/filter-builder/` imports from its own `index.ts` — per plan.md Constitution Check → Article VIII, implements FR-033 (depends on the existing `index.ts`; no new file expected)
- [X] T057 [US12] Validate per [quickstart.md](./quickstart.md) → Story 12: search the codebase outside `filter-builder` for any deep import into the feature (Scenario 1), and confirm no internal file imports from that feature's own entry file and neither `index.ts` in the project uses a wildcard `export *` (Scenario 2) (depends on T056)

**Checkpoint**: `filter-builder` has exactly one public entry point.

---

## Phase 16: User Story 13 - Reuse debounced editing outside this feature (Priority: P13)

**Goal**: The debounce hook lives outside `filter-builder`, in its own `src/hooks/` module with its own entry point, under a name that carries no filter-specific meaning, and is importable by any feature.

**Independent Test**: From outside `filter-builder`, import the hook from `src/hooks` and use it to delay an arbitrary callback with no filter concept involved — see [quickstart.md](./quickstart.md) → Story 13.

### Implementation for User Story 13

- [X] T058 [US13] Create `src/hooks/useDebouncedCommit.ts`: relocate `src/features/filter-builder/useDebouncedValue.ts`'s implementation here (including T047's re-sync fix), renamed to describe what it does generically (`(value, onCommit, delayMs) → [localValue, setLocalValue]`), with no `Field`/`Operator`/`FilterCondition` reference — per research.md §19, implements FR-034 (depends on T047)
- [X] T059 [US13] Create `src/hooks/index.ts` exporting `useDebouncedCommit` as this module's sole public symbol, mirroring `filter-builder/index.ts`'s convention — implements FR-033 (second module boundary) (depends on T058)
- [X] T060 [US13] Update `src/features/filter-builder/useConditionRow.ts` to import `useDebouncedCommit` from `../../hooks` (the new module's entry file) instead of the local `useDebouncedValue.ts`, then delete `src/features/filter-builder/useDebouncedValue.ts` — implements FR-033, FR-034 (depends on T059, T049)
- [X] T061 [US13] Validate per [quickstart.md](./quickstart.md) → Story 13: confirm `src/hooks/useDebouncedCommit.ts` and `src/hooks/index.ts` reference no filter-specific concept (Scenario 1), and re-run Story 1 Scenario 5 plus the `name`/`hireDate` day/year debounced inputs in the browser to confirm debounce behavior is unchanged (Scenario 2, FR-034/FR-035) (depends on T060)

**Checkpoint**: All thirteen user stories are independently functional; the debounce hook is reusable outside `filter-builder`.

---

## Phase 17: Polish & Cross-Cutting Concerns (User Stories 9-13)

**Purpose**: Repo-wide quality gates and full manual validation after the maintainability refactor.

- [X] T062 [P] Run `npm run build` (type-check + production build) and `npm run lint` after the Stories 9-13 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T063 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — Stories 1-13, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

---

## Phase 18: User Story 3 (Revised) - Multiple nested groups + plain-language sentence (Priority: P3)

**Goal**: The root group's "Add group" control stays available after any number of nested groups already exist (the 2026-07-27 "exactly one" cap is superseded), and the plain-language sentence (FR-012) — required to read Scenario 4's combined logic and never actually implemented despite being marked complete in Phase 5 — exists and is rendered above the table.

**Independent Test**: Add a nested group, then add a second independent nested group alongside it, confirm the "add group" control remains available at the root and unavailable inside either nested group, and confirm the sentence above the table correctly states the combined AND/OR logic across the root condition and both nested groups — see [quickstart.md](./quickstart.md) → Story 3.

### Implementation for User Story 3 (Revised)

- [X] T064 [US3] Remove the `!hasNestedGroup` restriction from the "Add group" control's gating in `src/features/filter-builder/FilterGroup.tsx` (currently `isRoot && !hasNestedGroup`) so it renders whenever `isRoot` is true, unconditionally, allowing any number of sibling nested groups at the root; delete the now-unused `hasNestedGroup` local — per research.md §21, implements FR-007 (revised), FR-008, Story 3 Scenario 2 (depends on existing `FilterGroup.tsx`)
- [X] T065 [US3] Add `describeFilter(node: FilterNode): string` to `src/features/filter-builder/filterEngine.ts`: for a condition, call `fieldConfig[condition.field].describe(condition.operator, condition.value)`; for a group, join its children's descriptions with `" and "`/`" or "` per the group's `logic`, parenthesizing a nested group's joined phrase, and returning a fixed placeholder (e.g. `"No filter applied"`) when the root has no children — per research.md §6, implements FR-012 (this function does not currently exist in the codebase, despite being flagged as a gap in the Status Note above and assumed to exist by research.md §18's `describeMatchCount`) (depends on existing `filterEngine.ts`, `fieldConfig.ts`'s per-field `describe`)
- [X] T066 [US3] Wire `describeFilter(root)` into `src/features/filter-builder/FilterBuilder.tsx`, replacing the static `"Showing all employees (…)"` text with the derived sentence rendered above the table (still composed alongside `describeMatchCount`, not merged into one string) — implements FR-012, FR-032 (pure composition — no formatting logic inline in `FilterBuilder.tsx`) (depends on T065)
- [X] T067 [US3] Validate per [quickstart.md](./quickstart.md) → Story 3: add a second nested group alongside the first and confirm both combine independently with the root and each other, with "add group" still available at the root (Scenario 2); confirm no "add group" control appears inside either nested group (Scenario 3); confirm the sentence correctly states the combined AND/OR logic across the root condition and every nested group (Scenario 4) (depends on T064, T066)

**Checkpoint**: The root group supports any number of nested groups, and the plain-language sentence (FR-012) is implemented and visible.

---

## Phase 19: User Story 14 - Clear the entire filter in one action (Priority: P14)

**Goal**: One always-visible "Clear All" control resets the whole tree — every condition in the root group, every nested group, and every condition within each nested group — back to a single empty root group in one action, with no confirmation step, immediately updating rows/count/sentence/URL; clicking it when the filter is already empty is a no-op.

**Independent Test**: Build a filter with multiple root-level conditions and at least one nested group, click "Clear All", and confirm the table returns to showing all employees with an empty root group and no nested groups remaining — see [quickstart.md](./quickstart.md) → Story 14.

### Implementation for User Story 14

- [X] T068 [US14] Add `createEmptyFilter(): FilterGroup` to `src/features/filter-builder/filterEngine.ts`, returning `{ id: crypto.randomUUID(), kind: "group", logic: "AND", children: [] }` — the same shape used to seed a freshly-created group elsewhere in the module — per research.md §20, implements FR-036 (depends on existing `filterEngine.ts`)
- [X] T069 [US14] Add an always-visible "Clear All" `<button>` to `src/features/filter-builder/FilterBuilder.tsx`, wired to call the existing `setRoot` (from `useFilterUrlSync`) with `createEmptyFilter()` — the same state-update path every other edit already goes through, so rows/count/sentence/URL update immediately with no new effect or state; give it `aria-label="Clear all filters"` — per research.md §20, implements FR-036, FR-037, FR-038 (depends on T068)
- [X] T070 [US14] Validate per [quickstart.md](./quickstart.md) → Story 14: build a filter with at least two root-level conditions and two nested groups, click Clear All, confirm every condition/group is removed, all 40 rows show, the match count reflects the full dataset, the sentence reflects an empty filter, and the URL's `f` parameter no longer encodes any conditions, with no confirmation prompt (Scenarios 1-2); click Clear All again on an already-empty filter and confirm no visible change and no error (Scenario 3) (depends on T069)

**Checkpoint**: All fourteen user stories are independently functional.

---

## Phase 20: Accessibility hardening (FR-038, SC-018)

**Purpose**: Every interactive control in the filter builder — add/remove condition, add/remove group, field/operator/value inputs, the AND/OR toggle, and Clear All — is operable via keyboard alone (already true for free: every control is a native `<button>`/`<select>`/`<input>`, per research.md §22) and carries a clear, programmatic label for assistive technology (not yet true for most controls). No live/spoken announcements of dynamic changes are required or added (FR-038 explicitly excludes them).

**Independent Test**: Using only the keyboard, add a condition, add a nested group, remove a condition, toggle a group's AND/OR, edit a value, and use Clear All; then inspect every control in the browser's accessibility tree and confirm each has a non-empty accessible name — see [quickstart.md](./quickstart.md) → Accessibility spot-check.

### Implementation for Accessibility

- [X] T071 [P] Add `aria-label`s to `src/features/filter-builder/FilterCondition.tsx`'s field `<select>` (e.g. `"Field"`) and operator `<select>` (e.g. `"Operator"`), and to each control in `src/features/filter-builder/ValueInput.tsx` (`TextInput`, `NumberInput`, `NumericInput`, `SelectInput`, `MonthInput`, e.g. `"Value"`) — per research.md §22, implements FR-038 (depends on existing `FilterCondition.tsx`, `ValueInput.tsx`)
- [X] T072 [P] Add a distinct `aria-label` (e.g. `"Remove condition"`) to `FilterCondition.tsx`'s "Remove" button so it reads unambiguously to a screen reader outside the visual context of its row — implements FR-038 (depends on existing `FilterCondition.tsx`)
- [X] T073 [P] Add `aria-label`s to `src/features/filter-builder/FilterGroup.tsx`'s AND/OR toggle button (e.g. `` `Group logic: ${group.logic}, click to toggle` ``), "Remove group" button (e.g. `"Remove nested group"`), "Add condition" button (e.g. `"Add condition"`), and "Add group" button (e.g. `"Add nested group"`) — per research.md §22, implements FR-038 (depends on existing `FilterGroup.tsx`)
- [X] T074 Validate per [quickstart.md](./quickstart.md) → Accessibility spot-check: using only the keyboard (Tab/Shift+Tab, Enter/Space, arrow keys inside a `<select>`), add a condition, add a nested group, remove a condition, toggle a group's AND/OR, edit a value, and click Clear All (SC-018); inspect every select/input/button in the browser's accessibility tree and confirm each has a non-empty accessible name (SC-018) (depends on T071, T072, T073, T069)

**Checkpoint**: Every control in the filter builder is keyboard-operable with a programmatic label.

---

## Phase 21: Polish & Cross-Cutting Concerns (User Story 3 revision, User Story 14, Accessibility)

**Purpose**: Repo-wide quality gates and full manual validation after the 2026-07-28 amendments.

- [X] T075 [P] Run `npm run build` (type-check + production build) and `npm run lint` after the Phase 18-20 changes; fix any errors surfaced, per CLAUDE.md's quality gates
- [X] T076 Re-run the complete [quickstart.md](./quickstart.md) walkthrough end-to-end — all 14 stories, the accessibility spot-check, the zero-match edge case, and the back-button regression watch — and confirm every expectation still holds

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

Unlike a typical backend feature, US2–US7 here are not fully independent of US1's files — they extend the same small set of components rather than adding disjoint ones, per the plan's single-page, single-module design (data-model.md, research.md §1). Each story is still independently *testable* per its Independent Test above. The same is true of US9–US13: each is a maintainability refactor of files already built by US1/US6/US7, not a disjoint file set. Phases 18-20 follow the same pattern: Phase 18 revises `FilterGroup.tsx`'s existing gating rule and finally implements the long-flagged `describeFilter` gap, Phase 19 adds one function plus one button to already-existing files, and Phase 20 only adds `aria-label` attributes to controls that already exist.

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

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task
- [Story] labels map tasks to spec.md's US1–US14 for traceability
- No test runner is configured; every story's independent test is a manual quickstart.md walkthrough instead of automated tests
- Stories 9-11 and 12 are read-the-code / audit-only user stories — their "Independent Test" is a code review plus a browser regression check, not new user-visible behavior
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
- T053's flagged question about the missing `describeFilter`/FR-012 sentence was never resolved during Phases 13-17 (confirmed still missing when generating Phase 18) — Phase 18 (T065) now implements it directly, since Story 3 (revised)'s Scenario 4 makes it a hard blocker rather than an optional follow-up
- Phase 20 (Accessibility) has no dedicated user story number in spec.md — FR-038/SC-018 are a cross-cutting constraint introduced by the 2026-07-28 Amendment 2, so its tasks carry no `[Story]` label, consistent with the Setup/Foundational/Polish phases above
</content>
