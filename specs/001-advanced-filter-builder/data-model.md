# Phase 1 Data Model: Advanced Filter Builder

Derived from the spec's Key Entities section and FR-001–FR-018 (plus FR-025/FR-026, which are timing/layout behavior, and FR-029–FR-034, which are internal-structure refactors — see the notes below; none of these add a new entity or wire-shape field). All types are TypeScript, strict, no `any` (Constitution VII).

## Employee

Static, bundled mock data (`src/data/employees.ts`). Not created/edited/deleted by this feature.

| Field      | Type                                   | Notes                                                                                                                                       |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | `string`                               | Unique per employee, stable across reloads (it's static data).                                                                              |
| `name`     | `string`                               | Free text.                                                                                                                                  |
| `country`  | `"EG" \| "SA" \| "AE" \| "US" \| "DE"` | Closed set — matches the fixed country list (Assumptions).                                                                                  |
| `salary`   | `number`                               | Positive integer, stored value carries no currency formatting.                                                                              |
| `isActive` | `boolean`                              |                                                                                                                                             |
| `hireDate` | `string` (`"YYYY-MM-DD"`)              | ISO calendar date; day/month/year read via string slicing, not `Date` parsing (see [research.md](./research.md) §8, avoids timezone drift). |

Dataset size is fixed at 40 rows (FR-001).

**Display formatting (FR-019/FR-020, presentational only)**: `EmployeeTable.tsx` renders `salary` through `formatSalary` (thousands-separated, no decimals, no currency symbol — e.g. `85,000`) and `hireDate` through `formatHireDate` (`"D MMM YYYY"` — e.g. `2 Jun 2026`), both pure functions in `format.ts` (see [research.md](./research.md) §11). Neither function changes the underlying `Employee.salary`/`Employee.hireDate` value used by `filterEngine.ts` or `urlState.ts` — formatting is a render-time transform only.

## Field & Operator

As of the generalization in FR-039/FR-040 (User Story 15, [research.md](./research.md) §23), `Field` and `Operator` are no longer feature-internal string-literal unions — they are `string`, narrowed at each caller's own config:

```ts
type ValueKind = 'text' | 'number' | 'select' | 'day' | 'month' | 'year' | 'none'

interface OperatorConfig<TRow> {
  label: string
  valueKind: ValueKind
  options?: readonly string[]
  schema?: ZodTypeAny // absent = always valid (e.g. is_true/is_false)
  match: (row: TRow, value: unknown) => boolean
  describe: (value: unknown) => string
}

interface FieldDef<TRow> {
  label: string
  operators: Record<string, OperatorConfig<TRow>>
}

type FilterFieldConfig<TRow> = Record<string, FieldDef<TRow>>
```

`FilterCondition.field`/`.operator` are typed `string`, validated at runtime against the caller-supplied `FilterFieldConfig<TRow>`'s own keys (at condition creation, and at URL decode — see [contracts/filter-url-schema.md](./contracts/filter-url-schema.md)) rather than checked against a fixed compile-time union. Each operator's `match`/`describe`/`schema` now live in the config entry itself — the engine (`evaluateNode`, `describeFilter`, `validateConditionValue`) calls whichever it looks up, instead of switching on a hardcoded field/operator name (Constitution VI: behavior in the map, not in branching — see [research.md](./research.md) §23).

**Employee's own instance**: `src/data/employeeFieldConfig.ts` exports `employeeFieldConfig: FilterFieldConfig<Employee>`, the five fields (`name`, `country`, `salary`, `isActive`, `hireDate`) and their operators/`match`/`describe`/`schema`, including the `hireDate` day/month/year string-slicing logic (previously engine-internal, see [research.md](./research.md) §8) now expressed as that field's `match` functions. This is the "Field Configuration" entity from spec.md's Key Entities — one instance of the generic shape, supplied to `FilterBuilder` from outside the feature (FR-040, [research.md](./research.md) §24).

## FilterCondition

One leaf rule (FR-002).

| Field      | Type                            | Notes                                                                                                                                                                                                                                                                                                                                       |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | `string`                        | `crypto.randomUUID()`, stable identity for edit/remove and React `key`.                                                                                                                                                                                                                                                                     |
| `kind`     | `"condition"`                   | Discriminant for the `FilterNode` union.                                                                                                                                                                                                                                                                                                    |
| `field`    | `Field`                         |                                                                                                                                                                                                                                                                                                                                             |
| `operator` | `Operator`                      | Must be valid for `field` per `fieldConfig` (FR-003).                                                                                                                                                                                                                                                                                       |
| `value`    | `string \| number \| undefined` | `undefined` for `is_true`/`is_false` (FR-004) and for a not-yet-entered value (Edge Cases — doesn't exclude rows until provided). For `hireDate`: `day_is`/`year_is` values are numbers (day-of-month 1-31, calendar year); `month_is` is a number 1-12 selected from a month-name dropdown, never free-typed (FR-004, Story 5 Scenario 5). |

**Validation rules**:

- Changing `field` resets `operator` to the first valid operator for the new field and clears `value` (FR-005).
- A condition with `value === undefined` (and an operator that requires a value) is vacuously satisfied — it never excludes a row (Edge Cases, Assumptions).
- A `hireDate` condition matches on only its one specified component and ignores the other two (FR-018) — `day_is 31` matches the 31st of any month in any year, independent of `month_is`/`year_is` conditions elsewhere in the tree.
- A condition's `value` (when required) MUST satisfy the Zod schema registered for its `(field, operator)` pair in `validation.ts` before it is applied to matching — e.g. `salary`'s numeric operators require a non-negative number, `hireDate`'s `year_is` requires a 4-digit integer (FR-021). This is a _derived_ check, not a stored field: `FilterCondition` itself carries no `error`/`isValid` property. `validateConditionValue(condition)` is called at render time (to show the inline error, FR-022) and inside `evaluateNode` (to treat a failing value the same as `undefined` — vacuous, never excludes a row) — see [research.md](./research.md) §10.

## FilterGroup

A container of children (FR-006).

| Field      | Type            | Notes                                          |
| ---------- | --------------- | ---------------------------------------------- |
| `id`       | `string`        | `crypto.randomUUID()`.                         |
| `kind`     | `"group"`       | Discriminant for the `FilterNode` union.       |
| `logic`    | `"AND" \| "OR"` | Defaults to `"AND"` on creation (Assumptions). |
| `children` | `FilterNode[]`  | See depth rule below.                          |

```ts
type FilterNode = FilterCondition | FilterGroup
```

**Depth rule (FR-007/FR-008, revised 2026-07-28 — root nested-group count is now unbounded)**: enforced structurally, not just by convention:

- The **root** `FilterGroup`'s `children` may contain any number of `FilterCondition`s and **any number** of `FilterGroup`s (nested groups) — the earlier "at most one nested group" cap is superseded (2026-07-28 Amendment); only the _depth_ stays capped at two levels, not the _count_ of nested groups.
- A **nested** `FilterGroup`'s `children` may contain only `FilterCondition`s — never another `FilterGroup`. This is what makes "no add-group control inside a nested group" (Acceptance Scenario, Story 3 #3) trivially true: the UI simply never renders that control when rendering a group that is not the root, regardless of how many nested groups already exist at the root (Story 3 #2).
- This asymmetry (root vs. nested capabilities) is why `FilterGroup` is one type with a runtime-enforced rule rather than two type-level variants — introducing `RootFilterGroup`/`NestedFilterGroup` types would be a second implementation with no second consumer beyond this one rule (Constitution VI: no interface without a second implementation). Removing the "at most one" count cap only loosens that runtime rule; it does not add a new type-level relation (see [research.md](./research.md) §21).
- Every nested group combines with its siblings and with the root group's own conditions via the root's single `logic` (AND/OR) setting — there is no separate combinator between nested groups (spec.md Assumptions).
- An empty `children` array (root or nested) is valid and vacuously satisfied — it doesn't narrow the result set (Edge Cases, Assumptions).

## Filter tree evaluation (behavior, not a stored entity)

`evaluateNode(node: FilterNode, employee: Employee): boolean` in `filterEngine.ts`:

- `FilterCondition` → apply `operator` to `employee[field]` and `value`; a condition with an undefined required value returns `true` (vacuous). For `day_is`/`month_is`/`year_is`, the relevant component is sliced from `employee.hireDate` (see [research.md](./research.md) §8) and compared as a number — the other two components are never read (FR-018).
- `FilterGroup` → combine `children.map(evaluateNode)` with `every` (AND) or `some` (OR); an empty `children` array returns `true` for both (vacuous — `every([]) === true`, and OR of nothing is defined the same way here for consistency).

`matchCount`/the visible rows are derived by filtering all 40 employees through `evaluateNode(root, employee)` — not stored state, recomputed on every render from the current tree (FR-011).

## Debounce and mobile layout (behavior, not stored state)

Neither FR-025 (debounce) nor FR-026 (mobile remove-control placement) adds a field to `FilterCondition`/`FilterGroup` or changes the wire shape in [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) — both are transient UI concerns local to `FilterCondition.tsx`:

- **Debounce (FR-025, mechanism shape FR-027/FR-028)**: whether a condition's edits commit immediately or after a ~300ms pause is a `boolean` fact of its `valueKind` (`text`/`number`/`day`/`year` → debounced; `select`/`month`/`none` → immediate), read from `fieldConfig.ts`. The in-progress keystroke value lives inside a single debounce hook (relocated to `src/hooks/useDebouncedCommit.ts`, see the Condition-row and shared-hook section below) until committed via `onChange`; the committed `FilterCondition.value` itself is unaffected (see [research.md](./research.md) §13, §15, §19).
- **Mobile placement (FR-026)**: the remove control's position is a Tailwind responsive class on the same grid described in §12 of research.md — a pure CSS breakpoint change with no new prop or state (see [research.md](./research.md) §14).

## Condition-row hook and shared debounce hook (behavior, not stored state — FR-029–FR-034, FR-042–FR-043, User Stories 10-13, 17)

None of these add a field to `FilterCondition`/`FilterGroup` or change any wire shape — they restructure where existing logic lives:

- **`useConditionRow(condition, onChange)`** (FR-029/FR-030, [research.md](./research.md) §16) returns `{ config, valueKind, displayValue, validation, handleFieldChange, handleOperatorChange, handleValueChange }`. `FilterCondition.tsx` calls this once and renders only from its return value — no field/operator/value computation of its own.
- **`ValueInput`** (FR-031, [research.md](./research.md) §17) is a `Record<ValueKind, Component>` lookup already implemented in `ValueInput.tsx`; `useConditionRow`'s `valueKind` is the key `FilterCondition.tsx` passes to it.
- **`useDebouncedCommit`** (FR-034, [research.md](./research.md) §19) is the same hook as `useDebouncedValue` (FR-027), relocated to `src/hooks/useDebouncedCommit.ts` and exported from `src/hooks/index.ts` — a second module boundary (Constitution VIII) alongside `filter-builder/index.ts`. Its signature (`(value, onCommit, delayMs) → [localValue, setLocalValue]`) carries no filter/condition concept, so any feature can call it directly.
- **Wrapped-handler simplification** (FR-042/FR-043, [research.md](./research.md) §26): `handleValueChange` and `displayValue` no longer branch on a `boolean` "is this valueKind debounced" fact. `useConditionRow` calls `useDebouncedCommit(condition.value, commit, debounceMsForValueKind(valueKind))` unconditionally — `debounceMsForValueKind` (in `fieldConfig.ts`) returns `700` for `text`/`number`/`day`/`year` and `0` for `select`/`month`/`none` — and both `handleValueChange` (→ the hook's own `setLocalValue`) and `displayValue` (→ the hook's own `localValue`) are the identical call/value for every value kind.
- **`describeMatchCount(count: number): string`** (FR-032, [research.md](./research.md) §18) is a new plain function in `filterEngine.ts`, alongside the existing `describeFilter`. `FilterBuilder.tsx` calls it instead of formatting the pluralized match-count text itself.

## Generic field configuration and dataset (behavior/type shape, not new stored state — FR-039–FR-041, FR-044, User Stories 15-16, 18)

Not a new entity beyond the `Field Configuration` shape already introduced above — this section records where it moves the _rest_ of the feature:

- `evaluateNode`, `describeFilter`, `describeMatchCount`, `createEmptyFilter` (`filterEngine.ts`) and `validateConditionValue` (`validation.ts`) become generic over `TRow`, taking `fieldConfig: FilterFieldConfig<TRow>` as a parameter instead of importing a hardcoded Employee-specific map (FR-039, [research.md](./research.md) §23).
- `FilterBuilder` becomes generic: `FilterBuilder<TRow>(props: { fieldConfig: FilterFieldConfig<TRow>; data: TRow[]; children: (matchingRows: TRow[]) => ReactNode })`. It owns `useFilterUrlSync(fieldConfig)`, the root `FilterGroup` editor, the sentence/match-count text, and the "Clear All" button — all field-config-driven and Employee-agnostic — and hands the caller-rendered rows to `children` for display (FR-032's pure-composition rule still holds: `FilterBuilder.tsx` still contains no logic beyond composing hooks/engine calls and invoking the callback it's given).
- `src/data/employeeFieldConfig.ts`, `src/data/EmployeeTable.tsx` (relocated from `filter-builder/`), and `src/data/format.ts` (relocated from `filter-builder/`) hold everything Employee-specific; `App.tsx` wires them together (FR-040, [research.md](./research.md) §24).
- Inside `filter-builder/`, hook files live under `hooks/` and component files under `components/`, each with its own `index.ts` that every cross-subfolder import (including the feature's own top-level `index.ts`) goes through (FR-041/FR-044, [research.md](./research.md) §25, §27).

## Clear All (behavior, not stored state — FR-036/FR-037, User Story 14)

Not a new entity or field: `createEmptyFilter(): FilterGroup` (a new plain function in `filterEngine.ts`, see [research.md](./research.md) §20) returns the same empty-root shape already used when the feature initializes (`{ id, kind: "group", logic: "AND", children: [] }`). "Clear All" replaces the current tree with a freshly-created one via the same state-update path every other edit already uses — no distinct action/state is introduced, and no confirmation step or dialog exists (spec.md Assumptions).

## Accessibility (behavior, not stored state — FR-038, SC-018)

Not a new entity or field: every interactive element already in the tree (add/remove condition, add/remove group, field/operator/value inputs, the AND/OR toggle, Clear All) is a native HTML control, keyboard-operable by default, and carries a `<label>` or `aria-label` (see [research.md](./research.md) §22). No `aria-live` region is added — dynamic-change announcements are explicitly out of scope for FR-038.

## URL-encoded representation

Not a new entity — it's the `FilterGroup` tree (root only; it recursively contains any nested group) run through `JSON.stringify` then URL-safe base64. A condition currently failing validation (see FilterCondition's validation rule above) is dropped from the tree immediately before encoding — it never appears in the URL until corrected (FR-013, clarified 2026-07-28). `decodeFilterFromParam` now takes the caller's `FilterFieldConfig<TRow>` as a parameter and validates a decoded condition's `field`/`operator` against that config's own keys, rather than a hardcoded Employee field/operator list (FR-039, [research.md](./research.md) §23) — the wire shape itself (field names as strings, operator names as strings) is unchanged. See [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) for the exact wire shape and validation rules applied on decode (FR-013–FR-015).

## Automated test coverage (behavior, not stored state — FR-045–FR-048, User Story 19)

Not a new entity, field, or wire-shape change: tests assert against the types and functions already documented above (`evaluateNode`, `describeFilter`, `describeMatchCount`, `createEmptyFilter`, `validateConditionValue`, `encodeFilterToParam`/`decodeFilterFromParam`) and the components/hooks that consume them, exactly as the app itself calls them (FR-048 — no test-only export, flag, or code path is added). See [research.md](./research.md) §28 for file placement, the fake-timer approach to debounce testing, and how FR-047's end-to-end coverage is distributed across the eighteen prior user stories.

## State transitions

There is no persisted/backend state machine — the only "transitions" are in-memory tree edits, each producing a new immutable tree and, downstream, a new URL:

```
empty root (children: [])
  → add condition            (FR-002/FR-009)
  → edit condition field/op/value   (FR-005)
  → add second condition      (FR-009)
  → toggle group AND/OR       (FR-006)
  → add nested group (root only, any number)  (FR-007)
  → add another nested group alongside the first (root only)  (FR-007)
  → add/edit/remove conditions inside a nested group      (FR-009/FR-010)
  → remove condition or group (removes subtree)          (FR-010)
  → Clear All → back to empty root (children: [])         (FR-036/FR-037)
```

Every transition is followed by: re-evaluate → update table + count (FR-011) → regenerate sentence (FR-012) → re-encode URL via `replaceState` (FR-013).
