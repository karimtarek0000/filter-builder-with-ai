# I built this feature from scratch with Claude Code + Spec-kit, skills, subagents and MCPs

> `filter-builder-advanced` feature in this repo was designed and implemented end-to-end with [Claude Code](https://claude.com/claude-code), using **spec-kit** for spec-driven planning, **Skills** and **Subagents** for focused implementation/testing steps, and **MCP servers** for live docs and browser-driven verification.

## Feature: Advanced Filter Builder

A Notion/Linear-style filter builder for the employee data table: users compose a tree of **conditions** (field + operator + value) inside **groups** (AND/OR), two levels deep, and the table narrows live to the matching rows.

**Filter Builder Features**

- Build filter rules by field, operator, and value
- Group rules with AND / OR logic, including nested groups
- Combine multiple rules and groups into one overall filter
- Table updates live as the filter changes, with a running match count
- Active filter is summarized as a plain-English sentence
- Share a filter by URL — reopening the link restores the same filter
- Inline validation with immediate feedback on invalid values
- One-click "Clear All" to reset the filter
- Fully usable by keyboard and screen readers
- Works with any dataset/field configuration, not just one table

**Built with**

- **[spec-kit](specs/001-advanced-filter-builder/)** — `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, and `contracts/` drove the feature from requirements to implementation
- **Skills** — `speckit-specify` → `speckit-plan` → `speckit-tasks` → `speckit-implement` for the spec-driven workflow
- **Subagents** — `unit-test-writer` (Vitest/RTL coverage per component/hook/engine) and `e2e-test-writer` (Playwright flows) for test authoring
- **MCPs** — Context7 for up-to-date library docs, Playwright for browser-driven E2E verification

### Feature structure

```
src/features/filter-builder/
├── index.ts                        # public entry point (exports FilterBuilder + types)
├── types.ts                        # FilterCondition / FilterGroup / field config types
├── fieldConfig.ts                  # per-field type + operator configuration
├── filterEngine.ts                 # evaluates the condition/group tree against rows
├── filterEngine.test.ts
├── validation.ts                   # per-field value validation
├── validation.test.ts
├── urlState.ts                     # encode/decode filter tree to/from the URL query param
├── urlState.test.ts
├── format.ts                       # renders the filter tree as a plain-English sentence
├── components/
│   ├── index.ts
│   ├── FilterBuilder.tsx           # root component (Clear All, match count, sentence)
│   ├── FilterBuilder.test.tsx
│   ├── FilterGroup.tsx             # AND/OR group, nested groups
│   ├── FilterGroup.test.tsx
│   ├── FilterCondition.tsx         # single field/operator/value row
│   ├── FilterCondition.test.tsx
│   └── ValueInput.tsx              # value control that adapts to the field's type
└── hooks/
    ├── index.ts
    ├── useConditionRow.ts          # per-condition field/operator/value state + reset rules
    ├── useConditionRow.test.tsx
    ├── useFilterUrlSync.ts         # syncs filter state with the URL (replace, not push)
    └── useFilterUrlSync.test.tsx
```

```
e2e/                                 # Playwright end-to-end coverage for the feature
├── app.spec.ts                     # base table + filter builder rendering
├── filtering.spec.ts               # single-condition filtering (US1)
├── nested-groups.spec.ts           # AND/OR groups and nesting
├── hire-date.spec.ts               # day/month/year date-part matching
├── validation.spec.ts              # inline per-keystroke validation
├── clear-all.spec.ts               # Clear All reset behavior
├── url-sharing.spec.ts             # URL encode/decode + graceful degradation
├── mobile-layout.spec.ts           # responsive/mobile layout
└── support/
    └── decodeFilterParam.ts        # shared helper to decode the URL filter param in tests
```
