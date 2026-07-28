# Contract: Shareable Filter URL

This is the one external interface this feature exposes: a URL that a user copies out of the browser and someone else (or their future self) opens fresh. It must round-trip a filter tree exactly (FR-013/FR-014, SC-004) and must degrade to an empty filter on anything it doesn't recognize (FR-015, SC-005).

## Query parameter

- **Name**: `f`
- **Location**: query string of the app's single page, e.g. `https://<host>/?f=<encoded>`
- **Value**: the filter tree, JSON-serialized, then base64url-encoded (no `+`, `/`, `=` — see encoding rule below).

## JSON shape (before encoding)

The encoded payload is always a single root `FilterGroup` object:

```json
{
  "id": "string",
  "kind": "group",
  "logic": "AND",
  "children": [
    {
      "id": "string",
      "kind": "condition",
      "field": "country",
      "operator": "is",
      "value": "EG"
    },
    {
      "id": "string",
      "kind": "group",
      "logic": "OR",
      "children": [
        { "id": "string", "kind": "condition", "field": "salary", "operator": "gt", "value": 8000 },
        { "id": "string", "kind": "condition", "field": "isActive", "operator": "is_true" },
        { "id": "string", "kind": "condition", "field": "hireDate", "operator": "month_is", "value": 12 }
      ]
    }
  ]
}
```

Field definitions match [data-model.md](../data-model.md) exactly:

| Path                     | Type                                                                 |
|---------------------------|-----------------------------------------------------------------------|
| `.kind`                   | `"group"` (always, at the root)                                       |
| `.logic`                  | `"AND" \| "OR"`                                                        |
| `.children[]`             | Array of condition or nested-group objects (see depth rule below)     |
| condition `.kind`         | `"condition"`                                                          |
| condition `.field`        | `"name" \| "country" \| "salary" \| "isActive" \| "hireDate"`          |
| condition `.operator`     | Must be one of the operators valid for `.field` (see `fieldConfig.ts`) |
| condition `.value`        | `string` (name/country), `number` (salary; hireDate day/month/year), or absent (isActive) |
| nested group `.kind`      | `"group"`, only legal directly inside the root's `children`; the root's `children` may hold any number of nested-group objects (2026-07-28 Amendment) |
| nested group `.children[]`| Condition objects only — no group-inside-group                        |

"Clear All" (FR-036/FR-037) encodes as the same empty-root shape as a freshly-loaded page: `{ "id": "string", "kind": "group", "logic": "AND", "children": [] }` — no distinct wire representation.

`id` values are round-tripped as opaque strings; a decoder does not need to validate their format beyond "present and a string" (a decoder MAY regenerate fresh ids instead — the tree's structure and content is the part of the contract, not id stability).

A condition whose value currently fails the field/operator's Zod validation (FR-021/FR-022) is **excluded** from the encoded tree — it is dropped from the `children` array of its parent group before encoding, the same way it's excluded from matching (FR-013, clarified 2026-07-28; [data-model.md](../data-model.md) → FilterCondition validation rules). This is a filter step applied immediately before step 1 of the encoding rule below, not a property of the stored tree itself: the in-progress invalid value stays in local component/hook state (so the user keeps seeing what they typed and its inline error) and reappears in the URL automatically once it becomes valid. A group that loses all its children this way still encodes as an empty group (vacuously satisfied, same as any other empty group).

## Encoding rule

`encodeFilterToParam(root: FilterGroup): string`:
1. Recursively drop any condition whose value currently fails `validateConditionValue` (see previous paragraph) from every group's `children`.
2. `JSON.stringify` the resulting tree.
3. base64-encode the UTF-8 bytes.
4. Make URL-safe: `+` → `-`, `/` → `_`, and strip trailing `=` padding.

## Decoding rule (must never throw)

`decodeFilterFromParam(raw: string | null): FilterGroup | null`:

1. If `raw` is `null`/empty → return `null` (no filter param present).
2. Reverse the URL-safe substitution, base64-decode, `JSON.parse`. Any failure at this stage → return `null`.
3. Structurally validate the parsed `unknown` value against the shape above:
   - Root must be an object with `kind === "group"`, `logic` one of `"AND"/"OR"`, `children` an array.
   - Every child must be a condition or a group, per the discriminant `kind`.
   - A group nested inside another nested group (depth > 2) is invalid — the root may hold any number of nested groups (2026-07-28 Amendment), but a nested group's own `children` must contain only conditions, never a group.
   - Every condition's `field` must be a key present in the caller-supplied `FilterFieldConfig<TRow>` passed into `decodeFilterFromParam(raw, fieldConfig)`, and its `operator` must be a key present in that field's `operators` map (FR-039, [research.md](../research.md) §23) — no longer a hardcoded Employee field/operator list; the Employee page passes `employeeFieldConfig` (`src/data/employeeFieldConfig.ts`) for this check.
   - Any structural mismatch at any depth → return `null` for the **whole tree** (no partial/best-effort reconstruction — FR-015 explicitly rejects a "partial/incorrect filter").
4. On success, return the validated, typed `FilterGroup` (ids may be reused as-is or regenerated).

## Caller contract

- `useFilterUrlSync` calls `decodeFilterFromParam` once on mount. A `null` result initializes the filter tree as an empty root group (`{ kind: "group", logic: "AND", children: [] }`), which per FR-016 shows all 40 rows with no error surfaced to the user.
- After every state change to the filter tree, `useFilterUrlSync` calls `encodeFilterToParam` and applies it via `history.replaceState` — never `pushState` (clarified requirement, no new history entries per edit).
