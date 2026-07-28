# Quickstart: Advanced Filter Builder

Validation guide for the feature once implemented. No test runner is configured in this project (see [plan.md](./plan.md) Technical Context → Testing), so this is the manual verification path — run it before calling any implementation task done.

## Prerequisites

- Dependencies installed: `npm install` (no new packages are added by this feature — see [research.md](./research.md)).
- Dev server running: `npm run dev`, then open the printed local URL.

## Setup check

- The page loads with the table showing all 40 employees and an empty filter (root group, no conditions) — confirms FR-016.

## Story 1 — Single rule (P1)

1. Add a condition: field `country`, operator `is`, value `EG`.
2. **Expect**: table shows only `EG` employees; the match count shown matches the row count. ([spec.md](./spec.md) Story 1, Scenario 1)
3. Change the condition's field from `country` to `name`.
4. **Expect**: operator resets to `name`'s first operator (`contains`), value is cleared. (Scenario 2)
5. Set field to `isActive`, operator `is_true`.
6. **Expect**: no value input is rendered for this condition. (Scenario 3)
7. Change any condition's value.
8. **Expect**: table and count update immediately, no extra "apply" action. (Scenario 4)
9. Add a `salary` condition and type several digits quickly (e.g. `8`, `0`, `0`, `0`).
10. **Expect**: the input reflects every keystroke immediately, but the table/count only update once, shortly after typing pauses — not after every digit. (Scenario 5, FR-025)

## Story 2 — Combine rules in a group (P2)

1. With one condition on the root group, add a second condition (e.g., `salary` `gt` `5000`).
2. **Expect**: both conditions evaluated together per the group's current AND/OR. (Scenario 1)
3. Toggle the root group from AND to OR.
4. **Expect**: result set grows to match either condition. (Scenario 2)
5. Remove one condition.
6. **Expect**: remaining condition still evaluated correctly, table updates. (Scenario 3)

## Story 3 — Nested group (P3)

1. Add a nested group inside the root group; give it its own AND/OR and at least one condition (e.g., root AND: `country is EG`; nested OR: `salary gt 8000`, `isActive is_true`).
2. **Expect**: nested group renders with its own AND/OR toggle. (Scenario 1)
3. Look for an "add group" control inside the nested group.
4. **Expect**: none is available — nesting stops at two levels. (Scenario 2)
5. Read the plain-language sentence above the table.
6. **Expect**: it correctly states the combined logic across both levels, e.g. "country is EG AND (salary > 8000 OR isActive is true)". (Scenario 3)
7. Remove every condition from the nested group.
8. **Expect**: filter tree stays valid, table doesn't error (empty nested group is vacuously true). (Scenario 4)

## Story 4 — Share via link (P4)

1. Build any filter (flat or nested, per Stories 1–3).
2. Copy the current page URL.
3. **Expect**: the URL contains an `f=` query parameter that changed after the most recent edit. (Scenario 1) — see [contracts/filter-url-schema.md](./contracts/filter-url-schema.md).
4. Open that URL in a fresh tab/window.
5. **Expect**: the same filter tree, sentence, and matching rows reappear exactly. (Scenario 2)
6. Hand-edit the `f` value in the URL to garbage (e.g., truncate it, or change a valid character) and load the page.
7. **Expect**: page loads with an empty filter (all 40 rows visible), no error shown anywhere. (Scenario 3, and Edge Cases: unrecognized field/operator in the URL)

## Story 5 — Hire date components (P5)

1. Add a condition: field `hireDate`, operator `month is`, value `December` (picked from a dropdown, not typed).
2. **Expect**: table shows only employees hired in December, in any year. (Scenario 1)
3. Add a second `hireDate` condition in the same group: operator `year is`, value `2021`.
4. **Expect**: with the group set to AND, only employees hired in December 2021 show. (Scenario 4)
5. Replace the operator with `day is`, value `15`.
6. **Expect**: only employees hired on the 15th of any month, any year, show. (Scenario 3)
7. Check the `month is` value input.
8. **Expect**: it is a selector, not a free-text/number field — no invalid month value can be entered. (Scenario 5)

## Story 6 — Trust the filter's input (P6)

1. Add a condition: field `salary`, operator `greater than`, and type a non-numeric value (e.g. `abc`).
2. **Expect**: an inline error appears next to the value field, and the table behaves as though this condition were unset (all rows still shown, no crash). (Scenario 1)
3. Add a `hireDate` condition with operator `year is` and type a value that isn't a valid 4-digit year (e.g. `12`).
4. **Expect**: an inline error appears, and the condition does not narrow the table until corrected. (Scenario 2)
5. Correct the invalid value to a valid one (e.g. `85000` for salary, or `2021` for year).
6. **Expect**: the error disappears and the table/match count update to reflect the now-valid condition. (Scenario 3)

## Story 7 — Scan a complex filter at a glance (P7)

1. Build a root group with three or more conditions using a mix of value-input kinds (e.g. `name`, `salary`, `country`).
2. **Expect**: each condition's field/operator/value controls line up in the same columns across all rows in the group, regardless of which input type each row renders. (Scenario 1)
3. Add a nested group inside the root group.
4. **Expect**: the nested group is visually indented and/or bordered, reading as clearly distinct from the root group's own conditions. (Scenario 2)

## Story 8 — Mobile remove-control placement (P8)

1. Resize the browser (or use device emulation) to a width below 768px (Tailwind's `md` breakpoint).
2. Add a condition.
3. **Expect**: the remove control appears outside the field/operator/value row (e.g., on its own line below them), not squeezed alongside them. (Scenario 1)
4. Tap/click the remove control.
5. **Expect**: the condition is removed, exactly as on desktop. (Scenario 2)
6. Resize back to a desktop width (≥768px).
7. **Expect**: the remove control returns to its existing inline placement in the field/operator/value row, unchanged from before this story. (Scenario 3)

## Story 9 — Debounce mechanism as one hook (P9)

This story is verified by reading code, not by UI interaction — it's a maintainability refactor with no user-visible change.

1. Open `src/features/filter-builder/useDebouncedValue.ts`.
2. **Expect**: the immediate-display / delayed-commit / external-resync behavior is expressed in this one hook, not spread across separate state variables and effects in `FilterCondition.tsx`. (Scenario 1, FR-027)
3. Re-run Story 1, Scenario 5 (type several digits into a `salary` value quickly) and Story 8 (mobile remove-control placement).
4. **Expect**: both behave exactly as before this refactor — no regression to typing feedback, delay timing, or non-debounced fields. (Scenario 2, FR-028)
5. In the browser, start typing into a debounced field (e.g. `name`, `contains`), then switch the condition's field to something else before the debounce delay elapses.
6. **Expect**: the value input clears to match the new field with no stale or flickering leftover text from the in-flight edit. (Scenario 3)

## Story 10 — Condition-row logic as one hook, value input as a lookup map (P10)

This story is verified by reading code, not by UI interaction — it's a maintainability refactor with no user-visible change.

1. Open `src/features/filter-builder/FilterCondition.tsx`.
2. **Expect**: the component's body renders from values and handlers returned by one hook call (`useConditionRow`) — no field-change, operator-change, or value-commit logic computed inline, and no `if`/`switch` branching on a field name, operator name, or value kind. (Scenario 1, FR-029)
3. Open `src/features/filter-builder/ValueInput.tsx`.
4. **Expect**: the value-kind-to-input-control decision is a lookup map (`inputsByValueKind`), not a conditional; the decision of whether an edit commits immediately or is staged/debounced comes from `fieldConfig.ts`'s `isDebouncedValueKind`, not a hardcoded field/operator name check. (Scenario 2, FR-030/FR-031)
5. Re-run Story 1 (Scenarios 1-5), Story 6 (inline validation), and Story 9 (debounce) in the browser.
6. **Expect**: every behavior works exactly as before this refactor — no regression. (Scenario 3, FR-035)

## Story 11 — Top-level filter page as pure composition (P11)

This story is verified by reading code, not by UI interaction.

1. Open `src/features/filter-builder/FilterBuilder.tsx`.
2. **Expect**: every line either renders a child component or calls a hook/function defined elsewhere (`useFilterUrlSync`, `filterEmployees`, `describeMatchCount`) — no inline string formatting (e.g. the pluralized match-count message) or other derivation in the component body. (Scenario 1, FR-032)
3. In the browser, confirm the match-count sentence, table filtering, and URL sync still work exactly as before (re-run Story 1 Scenario 1 and Story 4 Scenario 1). (Scenario 2, FR-035)

## Story 12 — One entry point per module (P12)

1. Search the codebase (outside `src/features/filter-builder/`) for any import reaching into a file nested inside that feature (e.g. `from '../features/filter-builder/FilterBuilder'` or `.../fieldConfig`).
2. **Expect**: no such import exists — `src/App.tsx` and any other outside consumer import only from `src/features/filter-builder` (its `index.ts`). (Scenario 1, FR-033)
3. Open every file inside `src/features/filter-builder/` and inside `src/hooks/`.
4. **Expect**: no file imports from its own module's `index.ts` (no re-entry), and neither `index.ts` uses a wildcard `export *`. (Scenario 2, FR-033)

## Story 13 — Debounce hook reusable outside this feature (P13)

1. Open `src/hooks/useDebouncedCommit.ts` (and its `src/hooks/index.ts`).
2. **Expect**: the hook's signature and implementation reference no filter-specific concept (no `Field`, `Operator`, `FilterCondition` import) — it takes an arbitrary value, a commit callback, and a delay. (Scenario 1, FR-034)
3. In the browser, re-run Story 1 Scenario 5 (`salary`) and the `name`/`hireDate` day/year debounced inputs.
4. **Expect**: all continue to debounce exactly as before the relocation — typed value shown immediately, committed once after the pause, no dangling timer after switching fields or unmounting. (Scenario 2, FR-034/FR-035)

## Zero-match edge case

1. Build a filter that matches no employees (e.g., `salary gt 999999`).
2. **Expect**: table header stays visible, no data rows render, and a message like "No data matching the filter" is shown in its place. (Edge Cases; FR-017)

## Regression watch

- After any edit, re-check the browser back button does **not** step through prior filter states (URL updates use `replaceState`, not `pushState` — clarified requirement).
- Run `npm run build` (type-check + build) and `npm run lint` — both must pass per the constitution's quality gates.
