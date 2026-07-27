---

description: "Task list for Advanced Filter Builder"
---

# Tasks: Advanced Filter Builder

**Input**: Design documents from `/specs/001-advanced-filter-builder/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/filter-url-schema.md, quickstart.md

**Tests**: No test runner is configured in this project (see plan.md → Technical Context → Testing). No test tasks are included; each user story instead references its manual repro steps in [quickstart.md](./quickstart.md), per the constitution's "manual repro step instead" rule.

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P8) so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to US1–US7 from spec.md
- File paths are exact, per plan.md's Project Structure

## Path Conventions

Single Vite + React project (existing scaffold). All new code lives under `src/data/` and `src/features/filter-builder/`, per plan.md.

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
- [X] T016 [US4] Add `decodeFilterFromParam(raw)` to `urlState.ts`: reverse the URL-safe substitution, base64-decode, `JSON.parse` on an `unknown` value, then structurally validate against `fieldConfig` (unknown field/operator, depth > 2, more than one root-level nested group, or any shape mismatch → return `null` for the whole tree); never throws — per contracts/filter-url-schema.md → Decoding rule, research.md §5, implements FR-015 (depends on T015, T004)
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

Unlike a typical backend feature, US2–US7 here are not fully independent of US1's files — they extend the same small set of components rather than adding disjoint ones, per the plan's single-page, single-module design (data-model.md, research.md §1). Each story is still independently *testable* per its Independent Test above.

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

### Parallel Opportunities

- Foundational: T002 (`employees.ts`) and T003 (`types.ts`) can run in parallel
- US1: T006 (`EmployeeTable.tsx`) and T007 (`FilterCondition.tsx`) can run in parallel
- US5: T021 (`employees.ts`) and T022 (`types.ts`) can run in parallel; once T023 lands, T025 (`FilterCondition.tsx`) and T026 (`EmployeeTable.tsx`) can run in parallel
- US6: once T030 (`validation.ts`) lands, T031 (`filterEngine.ts`) and T032 (`FilterCondition.tsx`) touch different files and can run in parallel
- US7: T034 (`format.ts`), T036 (`FilterCondition.tsx` grid), and T037 (`FilterGroup.tsx` border) touch three different files and can all run in parallel; T035 needs T034 first
- No other tasks are marked [P] — the remaining chain is a sequence of edits to a small, shared set of files

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

---

## Notes

- [P] tasks touch different files with no dependency on an incomplete task
- [Story] labels map tasks to spec.md's US1–US8 for traceability
- No test runner is configured; every story's independent test is a manual quickstart.md walkthrough instead of automated tests
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before moving on
</content>
