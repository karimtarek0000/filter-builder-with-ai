# Advanced Filter Builder

Build a filter builder for a data table. The user builds their own filter
rules from the UI, and the table shows only the rows that match. It works
like the filters in Notion or Linear.

This is one feature, not an app. There is no backend, no auth, and no
router. The data is a local mock file.

## Data

Create a mock file with 40 employees. Each employee has:

- `id` (string)
- `name` (string)
- `country` (one of: EG, SA, AE, US, DE)
- `salary` (number)
- `isActive` (boolean)

I will remove it later

## The filter tree

A filter is a tree with two kinds of nodes.

A **condition** is one rule. It has a field, an operator, and a value.

A **group** holds a list of children and joins them with AND or OR. A group
can hold other groups. Allow 2 levels only: the root group, and one level
of groups inside it. Disable the "add group" button at the second level.

Use a discriminated union for the two node types.

## Operators

The operator list depends on the field:

- `name` (string): contains, equals
- `country` (enum): is, is not
- `salary` (number): greater than, less than, equals
- `isActive` (boolean): is true, is false

The value input also changes:

- an enum field shows a dropdown of its options
- a number field shows a number input
- a string field shows a text input
- `is true` and `is false` show no input at all

When the user changes the field, reset the operator to the first valid one
and reset the value.

## What the user can do

- Change the field, the operator, or the value of any condition
- Switch a group between AND and OR
- Add a condition to any group
- Add a group inside any group (2 levels max)
- Remove any condition or group
- See how many rows match, updated as they type
- Read the filter as a plain sentence above the table
- Share the filter as a link: the whole tree is saved in the URL query
  string, and reading a broken or unknown URL shows an empty filter instead
  of crashing

## Out of scope

Do not build any of these:

- saved presets or localStorage
- date fields
- dark mode, RTL, or translations
- server-side filtering or pagination
- Storybook or end-to-end tests

## Steps

Do these in order. Finish each one and stop before the next.

1. **Logic only.** The node types, the field config, the evaluate function,
   and the tree operations (add, remove, update). No UI, no React imports
   in these files.
2. **UI.** The recursive group component, the condition row, and the value
   input. Connect it to the mock data and render the table.
3. **URL.** Read the filter from the URL on load, write it on every change.

## Done when

- Adding a new field or a new operator means adding data to the config,
  not adding an `if` inside a component
- The evaluate function has no React imports and is covered by tests
- A broken URL loads the page with an empty filter and no error
- `npm run build` passes

Follow the rules in CLAUDE.md for how to work and how to structure the code.

# Task: Advanced Filter Builder

Build a filter builder component for a data table. It works like the
filters in Notion or Linear. The user builds their own filter rules,
and the table shows only the matching rows.

## Tech Stack

- React 19 + TypeScript (strict mode)
- Vite
- Tailwind CSS
- Zod for validation
- Vitest + Testing Library for tests
- No `any` type anywhere

## Data

Create a mock JSON file with 500 employees. Each employee has:

- `name` (string)
- `email` (string)
- `country` (enum: EG, SA, AE, US, DE)
- `department` (enum: Engineering, Design, Sales, HR)
- `salary` (number)
- `startDate` (date)
- `isActive` (boolean)

## What to Build

### 1. The filter tree

A filter is a tree. It has two kinds of nodes:

- **Condition**: one rule. It has a field, an operator, and a value.
- **Group**: a list of children. It uses AND or OR to join them.

A group can contain other groups. Allow 3 levels of nesting maximum.

Use a discriminated union type for these nodes.

### 2. The operators

The operator list changes when the user picks a field:

- string: contains, equals, starts with, is empty
- number: equals, greater than, less than, between
- date: before, after, in the last N days
- enum: is, is not, is any of
- boolean: is true, is false

The value input also changes:

- `between` shows two inputs
- `is any of` shows a multi-select
- `is empty` shows no input at all

If the user changes the field, reset the operator and the value.

### 3. The UI

- Must be use tailwindcss tailwindcss not write any regular css at all
- Each condition is one row: field select, operator select, value input,
  and a delete button.
- Each group has an AND/OR toggle, an "Add condition" button, and an
  "Add group" button.
- Delete an empty group automatically.
- The component that renders a group must call itself for child groups.
- Show a live count of matching rows while the user edits.
- Show the filter as a readable sentence above the table.
- Add a "Clear all" button.

### 4. The evaluator

Write a pure function. It takes the filter tree and one row. It returns
true or false. Keep this function in a separate file. It must not import
anything from React.

### 5. URL sync

- Save the whole filter tree in the URL query string.
- On page load, read the URL and rebuild the filter.
- If the URL is broken or has an unknown field, ignore it and start with
  an empty filter. Never crash.
- Use a Zod schema to validate the parsed data.

### 6. Saved presets

- Let the user save the current filter with a name.
- Show a list of saved presets. The user can apply or delete one.
- Store them in localStorage.

## Rules

- Typing in one input must not re-render the whole tree. Memoize where
  it is needed.
- The component must work with the keyboard only. When the user adds a
  condition, move the focus to its first input.
- Support RTL layout and dark mode.
- Show an error under any condition that is not complete. Disable the
  Apply button in that case.

## Tests

Write tests for:

- The evaluator, with every operator
- Serialize and then deserialize a filter tree. The result must equal
  the original.
- A broken URL string does not crash the app.
- Adding, editing, and deleting a nested group in the UI.

## How to Work

Do this in three steps. Finish each step and run the tests before you
start the next one.

1. **Types and logic only.** Build the node types, the Zod schema, and
   the evaluator function. Write tests. Do not write any UI yet.
2. **The UI.** Build the recursive component and the dynamic inputs.
   Connect it to the mock data and the table.
3. **URL and presets.** Add the serializer, the URL sync, and
   localStorage presets.

Before you write code in each step, show me a short plan and wait for
my approval.
