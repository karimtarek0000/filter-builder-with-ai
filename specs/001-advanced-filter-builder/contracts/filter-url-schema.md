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
| nested group `.kind`      | `"group"`, only legal directly inside the root's `children`           |
| nested group `.children[]`| Condition objects only — no group-inside-group                        |

`id` values are round-tripped as opaque strings; a decoder does not need to validate their format beyond "present and a string" (a decoder MAY regenerate fresh ids instead — the tree's structure and content is the part of the contract, not id stability).

A condition's `value` is encoded exactly as entered, even if it currently fails the field/operator's Zod validation (FR-021) — condition-value validity (FR-022, [data-model.md](../data-model.md) → FilterCondition validation rules) is a derived, render-time concern, not part of this wire format, so an in-progress invalid value round-trips unchanged and is re-validated (and re-shown as an inline error, if still invalid) on load rather than being stripped from the URL.

## Encoding rule

`encodeFilterToParam(root: FilterGroup): string`:
1. `JSON.stringify(root)`
2. base64-encode the UTF-8 bytes
3. Make URL-safe: `+` → `-`, `/` → `_`, and strip trailing `=` padding

## Decoding rule (must never throw)

`decodeFilterFromParam(raw: string | null): FilterGroup | null`:

1. If `raw` is `null`/empty → return `null` (no filter param present).
2. Reverse the URL-safe substitution, base64-decode, `JSON.parse`. Any failure at this stage → return `null`.
3. Structurally validate the parsed `unknown` value against the shape above:
   - Root must be an object with `kind === "group"`, `logic` one of `"AND"/"OR"`, `children` an array.
   - Every child must be a condition or a group, per the discriminant `kind`.
   - A group nested inside another nested group (depth > 2) is invalid.
   - More than one nested group directly inside the root is invalid.
   - Every condition's `field` must be a known `Field`, and its `operator` must be in that field's valid operator list from `fieldConfig.ts`.
   - Any structural mismatch at any depth → return `null` for the **whole tree** (no partial/best-effort reconstruction — FR-015 explicitly rejects a "partial/incorrect filter").
4. On success, return the validated, typed `FilterGroup` (ids may be reused as-is or regenerated).

## Caller contract

- `useFilterUrlSync` calls `decodeFilterFromParam` once on mount. A `null` result initializes the filter tree as an empty root group (`{ kind: "group", logic: "AND", children: [] }`), which per FR-016 shows all 40 rows with no error surfaced to the user.
- After every state change to the filter tree, `useFilterUrlSync` calls `encodeFilterToParam` and applies it via `history.replaceState` — never `pushState` (clarified requirement, no new history entries per edit).
