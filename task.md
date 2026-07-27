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
