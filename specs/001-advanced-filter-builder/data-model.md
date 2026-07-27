# Phase 1 Data Model: Advanced Filter Builder

Derived from the spec's Key Entities section and FR-001–FR-018 (plus FR-025/FR-026, which are timing/layout behavior, not new entities — see the note below). All types are TypeScript, strict, no `any` (Constitution VII).

## Employee

Static, bundled mock data (`src/data/employees.ts`). Not created/edited/deleted by this feature.

| Field      | Type                                          | Notes                                  |
|------------|------------------------------------------------|-----------------------------------------|
| `id`       | `string`                                       | Unique per employee, stable across reloads (it's static data). |
| `name`     | `string`                                       | Free text.                              |
| `country`  | `"EG" \| "SA" \| "AE" \| "US" \| "DE"`         | Closed set — matches the fixed country list (Assumptions). |
| `salary`   | `number`                                       | Positive integer, stored value carries no currency formatting. |
| `isActive` | `boolean`                                      |                                          |
| `hireDate` | `string` (`"YYYY-MM-DD"`)                      | ISO calendar date; day/month/year read via string slicing, not `Date` parsing (see [research.md](./research.md) §8, avoids timezone drift). |

Dataset size is fixed at 40 rows (FR-001).

**Display formatting (FR-019/FR-020, presentational only)**: `EmployeeTable.tsx` renders `salary` through `formatSalary` (thousands-separated, no decimals, no currency symbol — e.g. `85,000`) and `hireDate` through `formatHireDate` (`"D MMM YYYY"` — e.g. `2 Jun 2026`), both pure functions in `format.ts` (see [research.md](./research.md) §11). Neither function changes the underlying `Employee.salary`/`Employee.hireDate` value used by `filterEngine.ts` or `urlState.ts` — formatting is a render-time transform only.

## Field & Operator

```ts
type Field = "name" | "country" | "salary" | "isActive" | "hireDate";

type Operator =
  | "contains" | "equals"              // name
  | "is" | "is_not"                    // country
  | "gt" | "lt" | "eq"                 // salary
  | "is_true" | "is_false"             // isActive
  | "day_is" | "month_is" | "year_is"; // hireDate
```

The valid `Operator[]` per `Field` live in `fieldConfig.ts`, keyed by field; each operator's value-input kind is resolved per-*operator* within that entry (not per-field), because `hireDate`'s three operators each need a different input kind (`day_is` → `"day"`, `month_is` → `"month"`, `year_is` → `"year"`), unlike every other field where one `valueKind` covers all its operators (see [research.md](./research.md) §7). This is still config data, not a second type-level relation, per Constitution VI.

## FilterCondition

One leaf rule (FR-002).

| Field      | Type                          | Notes |
|------------|--------------------------------|-------|
| `id`       | `string`                       | `crypto.randomUUID()`, stable identity for edit/remove and React `key`. |
| `kind`     | `"condition"`                  | Discriminant for the `FilterNode` union. |
| `field`    | `Field`                        | |
| `operator` | `Operator`                     | Must be valid for `field` per `fieldConfig` (FR-003). |
| `value`    | `string \| number \| undefined`| `undefined` for `is_true`/`is_false` (FR-004) and for a not-yet-entered value (Edge Cases — doesn't exclude rows until provided). For `hireDate`: `day_is`/`year_is` values are numbers (day-of-month 1-31, calendar year); `month_is` is a number 1-12 selected from a month-name dropdown, never free-typed (FR-004, Story 5 Scenario 5). |

**Validation rules**:
- Changing `field` resets `operator` to the first valid operator for the new field and clears `value` (FR-005).
- A condition with `value === undefined` (and an operator that requires a value) is vacuously satisfied — it never excludes a row (Edge Cases, Assumptions).
- A `hireDate` condition matches on only its one specified component and ignores the other two (FR-018) — `day_is 31` matches the 31st of any month in any year, independent of `month_is`/`year_is` conditions elsewhere in the tree.
- A condition's `value` (when required) MUST satisfy the Zod schema registered for its `(field, operator)` pair in `validation.ts` before it is applied to matching — e.g. `salary`'s numeric operators require a non-negative number, `hireDate`'s `year_is` requires a 4-digit integer (FR-021). This is a *derived* check, not a stored field: `FilterCondition` itself carries no `error`/`isValid` property. `validateConditionValue(condition)` is called at render time (to show the inline error, FR-022) and inside `evaluateNode` (to treat a failing value the same as `undefined` — vacuous, never excludes a row) — see [research.md](./research.md) §10.

## FilterGroup

A container of children (FR-006).

| Field       | Type                          | Notes |
|-------------|--------------------------------|-------|
| `id`        | `string`                       | `crypto.randomUUID()`. |
| `kind`      | `"group"`                      | Discriminant for the `FilterNode` union. |
| `logic`     | `"AND" \| "OR"`                 | Defaults to `"AND"` on creation (Assumptions). |
| `children`  | `FilterNode[]`                  | See depth rule below. |

```ts
type FilterNode = FilterCondition | FilterGroup;
```

**Depth rule (FR-007/FR-008)**: enforced structurally, not just by convention:
- The **root** `FilterGroup`'s `children` may contain any number of `FilterCondition`s and **at most one** `FilterGroup` (the "nested group").
- A **nested** `FilterGroup`'s `children` may contain only `FilterCondition`s — never another `FilterGroup`. This is what makes "no add-group control inside a nested group" (Acceptance Scenario, Story 3 #2) trivially true: the UI simply never renders that control when rendering a group that is not the root.
- This asymmetry (root vs. nested capabilities) is why `FilterGroup` is one type with a runtime-enforced rule rather than two type-level variants — introducing `RootFilterGroup`/`NestedFilterGroup` types would be a second implementation with no second consumer beyond this one rule (Constitution VI: no interface without a second implementation).
- An empty `children` array (root or nested) is valid and vacuously satisfied — it doesn't narrow the result set (Edge Cases, Assumptions).

## Filter tree evaluation (behavior, not a stored entity)

`evaluateNode(node: FilterNode, employee: Employee): boolean` in `filterEngine.ts`:
- `FilterCondition` → apply `operator` to `employee[field]` and `value`; a condition with an undefined required value returns `true` (vacuous). For `day_is`/`month_is`/`year_is`, the relevant component is sliced from `employee.hireDate` (see [research.md](./research.md) §8) and compared as a number — the other two components are never read (FR-018).
- `FilterGroup` → combine `children.map(evaluateNode)` with `every` (AND) or `some` (OR); an empty `children` array returns `true` for both (vacuous — `every([]) === true`, and OR of nothing is defined the same way here for consistency).

`matchCount`/the visible rows are derived by filtering all 40 employees through `evaluateNode(root, employee)` — not stored state, recomputed on every render from the current tree (FR-011).

## Debounce and mobile layout (behavior, not stored state)

Neither FR-025 (debounce) nor FR-026 (mobile remove-control placement) adds a field to `FilterCondition`/`FilterGroup` or changes the wire shape in [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) — both are transient UI concerns local to `FilterCondition.tsx`:
- **Debounce (FR-025, mechanism shape FR-027/FR-028)**: whether a condition's edits commit immediately or after a ~300ms pause is a `boolean` fact of its `valueKind` (`text`/`number`/`day`/`year` → debounced; `select`/`month`/`none` → immediate), read from `fieldConfig.ts`. The in-progress keystroke value lives inside a single `useDebouncedValue` hook (`useDebouncedValue.ts`) until committed via `onChange`; the committed `FilterCondition.value` itself is unaffected (see [research.md](./research.md) §13, §15).
- **Mobile placement (FR-026)**: the remove control's position is a Tailwind responsive class on the same grid described in §12 of research.md — a pure CSS breakpoint change with no new prop or state (see [research.md](./research.md) §14).

## URL-encoded representation

Not a new entity — it's the `FilterGroup` tree (root only; it recursively contains any nested group) run through `JSON.stringify` then URL-safe base64. See [contracts/filter-url-schema.md](./contracts/filter-url-schema.md) for the exact wire shape and validation rules applied on decode (FR-013–FR-015).

## State transitions

There is no persisted/backend state machine — the only "transitions" are in-memory tree edits, each producing a new immutable tree and, downstream, a new URL:

```
empty root (children: [])
  → add condition            (FR-002/FR-009)
  → edit condition field/op/value   (FR-005)
  → add second condition      (FR-009)
  → toggle group AND/OR       (FR-006)
  → add nested group (root only, only if none exists)  (FR-007)
  → add/edit/remove conditions inside nested group      (FR-009/FR-010)
  → remove condition or group (removes subtree)          (FR-010)
```

Every transition is followed by: re-evaluate → update table + count (FR-011) → regenerate sentence (FR-012) → re-encode URL via `replaceState` (FR-013).
