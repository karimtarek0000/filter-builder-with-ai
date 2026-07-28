# Feature Specification: Advanced Filter Builder

**Feature Branch**: `001-advanced-filter-builder`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Build a filter builder for a data table. The user builds their own filter rules from the UI, and the table shows only the rows that match. It works like the filters in Notion or Linear. This is one feature, not an app — no backend, no auth, no router; data is a local mock file of 40 employees (id, name, country, salary, isActive). Filters are a tree of conditions (field + operator + value) and groups (AND/OR of children), limited to two levels: a root group and one level of nested groups inside it. Operators depend on field type, and the value input changes with the field type. Users can edit any condition, switch a group's AND/OR, add/remove conditions and groups, see a live match count, read the filter as a plain sentence, and share the filter via a URL query string that degrades gracefully to an empty filter when broken."

## Clarifications

### Session 2026-07-27

- Q: Can the root group contain more than one nested group at once (e.g., two separate parenthesized OR sub-groups combined by the root's AND), or is the root limited to at most one nested group? → A: Exactly one nested group.
- Q: How should the filter tree be encoded in the URL query string? → A: Single query param holding the filter tree serialized as JSON and base64/URL-safe encoded.
- Q: When the current filter matches zero rows, what should the table area show? → A: Table header stays visible with no data rows beneath it, and a message (e.g. "No data matching the filter") is shown in place of the rows.
- Q: As the URL updates on every filter edit, should each edit push a new browser-history entry, or replace the current entry? → A: Replace the current URL in place (no new history entries per edit); the browser back button does not step through prior filter states.
- Q: What should the new date field represent on each employee? → A: Hire date.
- Q: How should filtering by day/month/year work? → A: Independent component match — the user can filter by just the month (e.g. "hired in July", any year), just the year, or just the day-of-month, each entered separately and combinable via the existing group AND/OR logic, rather than a single full-date comparison.

### Session 2026-07-28

- Q: When a user changes the operator on an existing hireDate condition (not the field) — e.g., from "month is" to "day is" — the value input control changes shape (month selector → day number). Should the value reset when this happens? → A: Reset value on operator change — any operator change within hireDate (day/month/year) clears the value, since each operator's input type is fundamentally different from the others.
- Q: Should a condition with a currently-invalid value (FR-021/FR-022) still be written into the URL-encoded filter tree? → A: No — a condition currently failing validation must not update/appear in the URL; the URL only ever encodes conditions currently valid and applied to the filter.
- Q: For a debounced field (salary, name, hireDate day/year), should the inline validation error appear immediately on every keystroke, or only after the debounce pause used for filter re-evaluation? → A: Show error immediately per keystroke — validation runs and displays on every keystroke, independent of the debounce delay used for filter re-evaluation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter the table with a single rule (Priority: P1)

A user viewing the employee table wants to narrow it down using one simple rule, such as "country is EG" or "salary greater than 5000," and see only the matching rows.

**Why this priority**: This is the smallest useful slice of the feature. Without it, nothing else (grouping, nesting, sharing) has any value. It proves the core mechanic: pick a field, pick a valid operator, enter a value, see the table update.

**Independent Test**: Load the table with its default (empty) filter, add a single condition, and verify the table narrows to only the rows that satisfy it, with the correct match count shown.

**Acceptance Scenarios**:

1. **Given** the table shows all 40 employees with no filter set, **When** the user adds a condition on the `country` field with operator "is" and value `EG`, **Then** the table shows only employees whose country is `EG`, and the displayed count matches the number of rows shown.
2. **Given** a condition already exists on the `salary` field, **When** the user changes the field to `name`, **Then** the operator resets to the first valid operator for `name` and the value is cleared.
3. **Given** a condition exists on the `isActive` field with operator "is true", **When** the user views the condition row, **Then** no value input is shown, since the boolean operators are self-contained.
4. **Given** any valid condition, **When** the user changes its value, **Then** the table and the match count update without requiring an extra confirmation step.
5. **Given** a condition with a free-text or numeric value input (e.g., `name` or `salary`), **When** the user types several characters in quick succession, **Then** the table and match count update only after a brief pause in typing, not on every keystroke.

---

### User Story 2 - Combine multiple rules in a group (Priority: P2)

A user wants to combine more than one rule — for example, "country is EG AND salary greater than 5000" — and control whether all rules must match (AND) or any one of them is enough (OR).

**Why this priority**: Real filtering needs often require more than one rule. This builds directly on Story 1 by adding a second condition and a way to combine them, without yet requiring nested groups.

**Independent Test**: Starting from a table with one condition already applied, add a second condition to the same group, toggle the group between AND and OR, and confirm the result set changes accordingly.

**Acceptance Scenarios**:

1. **Given** the root group contains one condition, **When** the user adds a second condition to the same group, **Then** both conditions are evaluated together using the group's current AND/OR setting.
2. **Given** a group set to AND with two conditions, **When** the user switches the group to OR, **Then** the table immediately shows the (typically larger) set of rows matching either condition.
3. **Given** a group with two or more conditions, **When** the user removes one condition, **Then** the remaining condition(s) continue to be evaluated correctly and the table updates.

---

### User Story 3 - Nest a group for more complex logic (Priority: P3)

A user wants logic that a single flat group can't express, such as "country is EG AND (salary greater than 8000 OR isActive is true)," by nesting a group inside the root group.

**Why this priority**: This is the most advanced authoring capability and depends on Stories 1 and 2 already working. It delivers the "one extra level of power" the feature promises while staying deliberately bounded (two levels only).

**Independent Test**: Starting from a root group with at least one condition, add a nested group with its own conditions and AND/OR setting, and confirm the combined result matches the described logic. Also confirm the "add group" control is unavailable inside that nested group.

**Acceptance Scenarios**:

1. **Given** the root group, **When** the user adds a nested group inside it, **Then** the nested group appears with its own AND/OR toggle and can hold its own conditions.
2. **Given** a nested group already exists inside the root group, **When** the user looks for a way to add another group inside that nested group, **Then** no such control is available (nesting stops at two levels total).
3. **Given** a root group (AND) containing one condition and one nested group (OR) with two conditions, **When** the user reads the plain-language sentence above the table, **Then** the sentence correctly reflects the combined AND/OR logic across both levels.
4. **Given** a nested group that has all of its conditions removed, **When** the group becomes empty, **Then** the filter tree remains valid and the table does not error.

---

### User Story 4 - Share a filter via link (Priority: P4)

A user who has built a filter wants to copy the page's URL and send it to someone else (or reload the page) so the exact same filter — including any nested group — is restored.

**Why this priority**: Sharing is valuable but depends on the filter-building mechanics from Stories 1-3 already existing; there is nothing to encode into a URL until a filter tree can be built.

**Independent Test**: Build a filter with at least one nested group, copy the resulting URL, open it in a fresh page load, and confirm the same filter tree, sentence, and result set reappear. Separately, load the page with a hand-edited/invalid URL and confirm it shows an empty filter instead of an error.

**Acceptance Scenarios**:

1. **Given** a user has built any filter (flat or nested), **When** the filter changes in any way, **Then** the page's URL is updated to reflect the current filter tree.
2. **Given** a URL containing a previously-shared filter, **When** the page is loaded fresh, **Then** the filter tree, the plain-language sentence, and the matching rows are restored exactly as they were when shared.
3. **Given** a URL whose filter data is missing, malformed, or references a field/operator the system doesn't recognize, **When** the page is loaded, **Then** the page shows an empty filter (all rows visible) with no error shown to the user.

---

### User Story 5 - Filter by hire date components (Priority: P5)

A user wants to narrow the table by when employees were hired, without needing to know or specify a full date — for example, "hired in December" (any year), "hired in 2021" (any month), or "hired on the 1st of the month" (any month or year) — combining any subset of day, month, and year independently.

**Why this priority**: This extends the single-condition capability (Story 1) to a new field with its own independent, non-full-date matching behavior. It depends on the existing condition/group mechanics already working, but is not required for Stories 1-4 to deliver value on their own.

**Independent Test**: Add a condition on the `hireDate` field using the "month is" operator with a chosen month, and verify the table shows only employees hired in that month across any year. Combine it with a "year is" condition in the same group to verify both narrow together.

**Acceptance Scenarios**:

1. **Given** the table shows all 40 employees with no filter set, **When** the user adds a condition on the `hireDate` field with operator "month is" and value `December`, **Then** the table shows only employees whose hire date falls in December, regardless of year.
2. **Given** a condition on `hireDate` with operator "year is" and value `2021`, **When** the user views the result, **Then** only employees hired in calendar year 2021 are shown, regardless of month or day.
3. **Given** a condition on `hireDate` with operator "day is" and value `15`, **When** the user views the result, **Then** only employees hired on the 15th day of any month, in any year, are shown.
4. **Given** two `hireDate` conditions in the same group — one "month is `March`" and one "year is `2020`" — **When** the group's logic is set to AND, **Then** only employees hired in March 2020 are shown.
5. **Given** the `hireDate` field is selected for a condition, **When** the user picks the "month is" operator, **Then** the value input is a month selector (not free numeric entry), preventing invalid month values from being entered.

---

### User Story 6 - Trust the filter's input (Priority: P6)

A user entering a filter value wants immediate, clear feedback if what they typed isn't valid for the field they picked (e.g., letters in a salary field, an out-of-range year), instead of silently getting confusing or empty results.

**Why this priority**: This strengthens the core value-entry mechanic from Story 1. It doesn't add a new capability, but without it, invalid input can produce a confusing "no results" state with no explanation.

**Independent Test**: Add a `salary` condition and type a non-numeric value; verify an inline error appears and the table behaves as if that condition were unset until the value is corrected.

**Acceptance Scenarios**:

1. **Given** a condition on `salary` with operator "greater than", **When** the user types a non-numeric value into the value field, **Then** an inline error message is shown next to the field and the table shows the result as if that condition were unset.
2. **Given** a condition on `hireDate` with operator "year is", **When** the user types a year that is not a valid 4-digit number, **Then** an inline error is shown and the condition does not narrow the table until corrected.
3. **Given** a condition with an inline validation error, **When** the user corrects the value to a valid one, **Then** the error message disappears and the table/match count update to reflect the now-valid condition.

---

### User Story 7 - Scan a complex filter at a glance (Priority: P7)

A user with several conditions and a nested group wants to visually scan the filter builder and understand its structure at a glance, without reading every label carefully.

**Why this priority**: This refines the authoring experience built in Stories 2-3. It doesn't change what the filter can express, only how quickly and confidently a user can build or verify a complex one.

**Independent Test**: Build a group with three or more conditions plus a nested group, and confirm the field/operator/value controls line up in consistent columns and the nested group is visually distinguishable from the root.

**Acceptance Scenarios**:

1. **Given** a group containing three or more conditions, **When** the user views the group, **Then** each condition's field, operator, and value controls are horizontally aligned into consistent columns across all conditions in that group.
2. **Given** a root group containing a nested group, **When** the user views the filter builder, **Then** the nested group is visually indented or bordered so it reads as distinct from the root group's own conditions.

---

### User Story 8 - Manage filters comfortably on a mobile screen (Priority: P8)

A user filtering the table on a phone-sized screen wants to remove a condition without its remove control crowding the field/operator/value inputs, which are already tight on a narrow width.

**Why this priority**: This refines the authoring experience from Stories 1-3 for small viewports. It doesn't change what the filter can express, only how usable the controls are on mobile.

**Independent Test**: View the filter builder at a mobile viewport width, add a condition, and verify the remove control is positioned outside the field/operator/value row while remaining reachable with a single tap; confirm the desktop layout is unchanged at wider widths.

**Acceptance Scenarios**:

1. **Given** the filter builder is viewed on a mobile-width screen, **When** a condition is displayed, **Then** its remove control appears outside the row of field/operator/value inputs, rather than squeezed alongside them.
2. **Given** the filter builder is viewed on a mobile-width screen, **When** the user taps the remove control, **Then** the condition is removed exactly as it would be on desktop.
3. **Given** the filter builder is viewed on a desktop-width screen, **When** a condition is displayed, **Then** the remove control keeps its existing inline placement (no regression to the desktop layout).

---

### User Story 9 - Maintain debounced value editing confidently (Priority: P9)

A developer working on the condition editor wants the debounced value-editing logic to live in one clearly-named, self-contained mechanism, so they can understand and safely extend it without tracing several pieces of component state that exist only to keep the debounce behavior working.

**Why this priority**: This is a maintainability improvement to the mechanism already specified in User Story 1 and FR-025. It changes no user-observable behavior; it only makes the existing debounce guarantees easier to verify and extend safely.

**Independent Test**: Read the value-editing code for a debounced field (e.g., `salary`) and confirm the debounce behavior (typed value shown immediately, filter re-evaluated after a pause) can be understood from one cohesive piece of logic, without needing to trace multiple separate state variables that exist solely to detect and re-sync external value changes.

**Acceptance Scenarios**:

1. **Given** the value-editing code for a debounced field, **When** a developer reads it, **Then** the mechanism that delays filter updates until typing pauses is expressed as a single, named unit of logic (e.g., one hook) rather than distributed across several independent state variables.
2. **Given** the existing debounce behavior specified in FR-025 (immediate typing feedback, delayed filter update, immediate updates for non-debounced fields), **When** the debounce logic is refactored for clarity, **Then** all previously-specified user-facing behavior continues to work exactly as before — no regression to typing feedback, delay timing, or non-debounced fields.
3. **Given** an external change to a condition's value (e.g., switching fields resets the value), **When** that change happens while a debounced edit is in flight, **Then** the local editing state correctly re-syncs to the new value without stale or duplicate state to maintain by hand.

---

### User Story 10 - Understand a condition row's code without tracing branches (Priority: P10)

A developer opening the condition-row editor wants to see a small render function plus a handful of named handlers, with the "which input control for this field/operator" and "how to apply an incoming value" decisions expressed as lookup data rather than as `if`/`else` chains scattered through the component.

**Why this priority**: This is a maintainability improvement to the mechanism already covered by User Story 1 (dynamic value input) and User Story 9 (debounce). It changes no user-observable behavior; it only makes the existing per-field, per-operator variation easier to scan, verify, and extend.

**Independent Test**: Read the condition-row file and confirm (a) all state and decision logic lives in one custom hook, (b) the component body contains no conditional branching keyed on a field name, operator name, or value kind, and (c) adding a new value kind's input control means adding one entry to a lookup map rather than editing branching logic.

**Acceptance Scenarios**:

1. **Given** the condition-row component, **When** a developer reads it, **Then** its state, field-change handling, operator-change handling, and value-commit handling are owned by a single named hook, and the component itself only renders based on values that hook returns.
2. **Given** the decision of whether an incoming value is applied immediately or staged and debounced, **When** a developer looks for where that decision is made, **Then** it is driven by field/operator configuration data (a lookup/strategy map), not by a conditional written inline in the component or hook.
3. **Given** all previously-specified behavior for value input, validation, and debounce (FR-003, FR-004, FR-011, FR-021, FR-022, FR-025, FR-027), **When** this internal restructuring is applied, **Then** every one of those behaviors continues to work exactly as before.

---

### User Story 11 - Understand the filter page's code as pure composition (Priority: P11)

A developer opening the top-level filter page wants it to read as composition only — assembling the group editor, the table, and the match-count summary — with no inline business logic to trace.

**Why this priority**: This extends the same maintainability goal as User Story 10 to the feature's entry component. It depends on nothing else being restructured first and delivers value on its own by giving a newcomer one predictable place to start reading the feature.

**Independent Test**: Read the top-level filter page file and confirm it contains no logic beyond wiring together its child components and hooks — any text formatting (such as the pluralized match-count message) or data derivation is defined elsewhere and simply called.

**Acceptance Scenarios**:

1. **Given** the top-level filter page component, **When** a developer reads it, **Then** every line either renders a child component or calls a hook/function defined elsewhere — there is no standalone derivation or formatting logic inline in the component body.
2. **Given** the existing filtering and URL-sync behavior (FR-011, FR-013, FR-014, FR-015), **When** the component is restructured into pure composition, **Then** all of that behavior continues to work exactly as before.

---

### User Story 12 - Import the feature through one stable entry point (Priority: P12)

A developer working elsewhere in the app wants a single, predictable place to import anything from the filter-builder feature, so that internal file moves or renames inside the feature never break code outside it and never risk an import cycle.

**Why this priority**: This is a structural safeguard that makes every other refactor in this update (Stories 10-11, and the debounce relocation in Story 13) safe to do without a wider blast radius. It has no user-facing effect on its own.

**Independent Test**: From outside the `filter-builder` folder, confirm every currently-used piece of the feature (its main component, and any types/utilities consumed elsewhere) can be imported from the feature's single entry file, and confirm no file inside the feature imports back from that same entry file.

**Acceptance Scenarios**:

1. **Given** code outside the `filter-builder` feature that needs something from it, **When** that code adds an import, **Then** it can do so from the feature's single entry file, without reaching into any file nested inside the feature.
2. **Given** any file inside the `filter-builder` feature, **When** a developer checks its imports, **Then** none of them import from that feature's own entry file (which would risk a circular import).

---

### User Story 13 - Reuse debounced editing outside this feature (Priority: P13)

A developer building an unrelated feature elsewhere in the app wants the same "type freely, commit after a pause" behavior used by the filter's text/number inputs, without copying code or pulling in anything specific to filters.

**Why this priority**: This generalizes a mechanism already proven to work in this feature (User Story 1, User Story 9) so the rest of the project can benefit from it. It depends on User Story 9's hook already existing in a clean, self-contained form.

**Independent Test**: From a feature outside `filter-builder`, import the debounce hook from its new shared location and use it to delay calling an arbitrary "on change" callback, confirming it requires no filter-specific concept (field, operator, condition) to use.

**Acceptance Scenarios**:

1. **Given** a developer working on an unrelated feature, **When** they need debounced-commit behavior for a text or number input, **Then** they can import one hook from a shared, project-level location (outside `filter-builder`) that wraps an arbitrary change callback with a delay.
2. **Given** the filter builder's own `salary`, `name`, `hireDate` day, and `hireDate` year inputs, **When** the debounce hook is relocated to the shared location, **Then** those inputs continue to debounce exactly as before (FR-025, FR-027).

---

### Edge Cases

- A `hireDate` condition using "day is" only narrows by day-of-month; it does not require or infer a month or year, so "day is 31" correctly matches employees hired on the 31st of any month that has one.
- Because day, month, and year are entered through constrained inputs (a day number limited to 1-31, a month selector, and a year number), there is no invalid-value case to fall back on for `hireDate` conditions.
- A group (root or nested) with zero conditions is treated as not narrowing the result set — it does not hide any rows.
- A condition whose value hasn't been entered yet (e.g., a number field left blank) does not exclude rows from the result until a value is provided.
- A condition whose value fails validation (e.g., non-numeric salary) is treated the same as an unset value for matching purposes, but continues to show its inline error until the value is corrected — it never causes the table or match count to error.
- Attempting to add a group inside an already-nested group has no available control to do so — the UI never allows a third level.
- Removing a condition or group removes it and everything beneath it, and the table/plain-language sentence/URL all update to reflect the smaller tree immediately.
- A shared URL edited to reference a field or operator that no longer exists (or never existed) is treated the same as a broken URL: the page loads with an empty filter rather than crashing or showing a partial/incorrect filter.
- When a filter narrows the result set to zero employees, the table header remains visible with no data rows, and a message (e.g. "No data matching the filter") is shown in place of the rows.
- On a very narrow screen, the relocated remove control remains reachable and does not overlap the field/operator/value inputs or other interactive elements.
- A debounced field's local edit state must re-sync correctly when the underlying condition value changes for a reason other than the user's own typing (e.g., the field is switched, clearing the value); this must not require separate state tracking beyond the single debounce mechanism described in FR-027.
- A module's entry file (its `index.ts`) never imports from any file inside its own module that in turn imports back from the entry file — the entry file is a one-way export surface, not a re-entry point.
- Relocating the debounce hook to a shared location does not change its delay-then-commit contract: a value changed and then changed again before the delay elapses still results in only the final value being committed, with no dangling timer left after the component unmounts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a table of employee records showing each employee's name, country, salary, active status, and hire date.
- **FR-002**: Users MUST be able to add a filter condition made of a field, an operator, and (when applicable) a value.
- **FR-003**: System MUST offer only the operators valid for the selected field: `name` → contains, equals; `country` → is, is not; `salary` → greater than, less than, equals; `isActive` → is true, is false; `hireDate` → day is, month is, year is.
- **FR-004**: System MUST present a value input appropriate to the selected field: a dropdown of valid options for `country`, a number input for `salary`, a text input for `name`, no value input at all for the `isActive` operators, and for `hireDate` a day-of-month input constrained to 1-31 for "day is", a month selector for "month is", and a year input for "year is".
- **FR-005**: When a user changes the field on an existing condition, system MUST reset that condition's operator to the first valid operator for the new field and clear its value. When a user changes only the operator on an existing `hireDate` condition (day is / month is / year is), system MUST also clear that condition's value, since each `hireDate` operator uses a distinct input control (day number, month selector, year number).
- **FR-006**: Users MUST be able to combine multiple conditions and/or nested groups within a group, and choose whether the group requires all children to match (AND) or any child to match (OR).
- **FR-007**: Users MUST be able to add a nested group inside the root group, to a maximum nesting depth of two levels (the root group, plus one level of groups inside it), and to a maximum of one nested group inside the root group at a time.
- **FR-008**: System MUST prevent adding a group inside an already-nested group (no third level of nesting is reachable through the UI), and MUST prevent adding a second nested group inside the root group once one already exists.
- **FR-009**: Users MUST be able to add a new condition to any group, whether root or nested.
- **FR-010**: Users MUST be able to remove any individual condition, or any group together with everything it contains.
- **FR-011**: System MUST re-evaluate the filter and update both the visible rows and the displayed match count after any change to the filter tree — immediately for selection-based input changes, and after a short debounce delay for free-text/numeric value input changes (see FR-025).
- **FR-012**: System MUST display a plain-language sentence describing the current filter (including its groups and AND/OR logic) above the table.
- **FR-013**: System MUST reflect the current filter tree in the page's URL as a single query parameter holding the tree serialized as JSON and base64/URL-safe encoded, updating it after every change to the filter by replacing the current history entry (no new browser-history entry per edit). A condition whose value currently fails validation (FR-021/FR-022) MUST be excluded from this URL encoding, the same way it is excluded from matching, until its value is corrected.
- **FR-014**: System MUST reconstruct the filter tree from that query parameter (base64-decode, then JSON-parse) when the page is loaded, reproducing the same table view that produced that URL.
- **FR-015**: System MUST fall back to an empty filter — showing all rows, with no visible error — when the URL's filter query parameter is absent, or its value fails base64 decoding, JSON parsing, or refers to a field or operator the system does not recognize.
- **FR-016**: When the filter tree contains no conditions anywhere, system MUST show all employee rows.
- **FR-017**: When the current filter matches zero employee rows, system MUST keep the table header visible, render no data rows, and show a message (e.g. "No data matching the filter") in place of the rows.
- **FR-018**: A `hireDate` condition MUST match on only the specified component of the employee's hire date — day, month, or year — and ignore the other two components (e.g., "month is December" matches employees hired in December of any year).
- **FR-019**: System MUST display each employee's salary in the table with thousands separators and no decimal places (e.g., `85,000`), without a currency symbol.
- **FR-020**: System MUST display each employee's hire date in the table in "day, abbreviated month, full year" format (e.g., `2 Jun 2026`).
- **FR-021**: System MUST validate a filter condition's value against the constraints of its field and operator (e.g., `salary` must be a non-negative number, `hireDate` "year is" must be a 4-digit number) before applying it to the filter, using a declarative, schema-based validation approach for consistency and readability.
- **FR-022**: When a condition's entered value fails validation, system MUST show an inline, field-level error message describing the problem, and MUST NOT apply that condition to the filter until the value is corrected; the table and match count behave as though the condition were unset in the meantime. For debounced fields (FR-025), the validation error MUST be evaluated and displayed immediately on every keystroke, independent of the debounce delay that governs filter re-evaluation and URL updates.
- **FR-023**: System MUST visually align the field, operator, and value controls of every condition within a group into consistent columns, so multiple conditions in the same group read as a scannable list.
- **FR-024**: System MUST visually distinguish a nested group from its parent group (e.g., indentation and/or a border) so the two nesting levels are distinguishable at a glance.
- **FR-025**: System MUST debounce filter re-evaluation triggered by free-text or numeric value input (the `name`, `salary`, and `hireDate` day/year values) by a short delay after the user stops typing, rather than re-evaluating on every keystroke. Selection-based inputs (`country` dropdown, `isActive` toggle, `hireDate` month selector) MUST continue to update immediately, since they don't fire per keystroke.
- **FR-026**: On mobile/narrow viewport widths, System MUST position each condition's remove control outside the field-operator-value row rather than inline with it, while keeping it reachable with a single tap. On wider/desktop viewports, the remove control MUST retain its current inline placement.
- **FR-027**: The debounced value-editing mechanism described in FR-025 MUST be implemented as a single, clearly-named unit of logic (e.g., one custom hook) that owns both the "local value while typing" behavior and the "re-sync when the value changes externally" behavior together, rather than as multiple independent pieces of component state coordinated by hand.
- **FR-028**: Refactoring the debounce mechanism for clarity (FR-027) MUST NOT change any previously-specified user-facing behavior (FR-011, FR-025, SC-002, SC-010) — typing feedback, delay timing, external re-sync, and non-debounced field behavior must all continue to work exactly as before.
- **FR-029**: The condition row's field-change, operator-change, and value-commit handling MUST be owned by a single custom hook, with the condition-row component limited to rendering based on the values and handlers that hook returns.
- **FR-030**: The decision of whether an incoming condition value is committed immediately or staged locally and debounced MUST be driven by field/operator configuration data (a lookup/strategy map), not by a conditional branch written inline in the component or its hook.
- **FR-031**: Each value kind's input control (text, number, select, and the `hireDate` day/month/year variants) MUST be resolved through a single lookup map keyed by value kind, and the condition-row component MUST contain no per-field or per-value-kind conditional rendering of its own.
- **FR-032**: The top-level filter page component MUST contain no logic beyond composing its child components and calling hooks/functions defined elsewhere — any derived text (such as the pluralized match-count summary) or data derivation MUST be defined outside the component and simply invoked by it.
- **FR-033**: Each module (the `filter-builder` feature, and the shared debounce hook's new location) MUST expose everything other code needs from it through a single entry file; code outside a module MUST import only from that module's entry file, never from a file nested inside it, and no file inside a module may import from that module's own entry file.
- **FR-034**: The debounce mechanism (FR-027) MUST be relocated to a shared, project-level location outside the `filter-builder` feature so any feature can reuse it, and MUST remain a generic wrapper that delays invoking a caller-supplied change callback — it MUST NOT reference filter conditions, fields, or operators.
- **FR-035**: The restructuring described in FR-029 through FR-034 MUST NOT change any previously-specified user-facing behavior (FR-003, FR-004, FR-011, FR-013, FR-014, FR-015, FR-021, FR-022, FR-025, FR-027, SC-002, SC-010, SC-012) — this is a maintainability-only refactor.

### Key Entities

- **Employee**: A single row of the dataset, with a unique identifier, a name, a country (one of EG, SA, AE, US, DE), a salary amount, an active/inactive status, and a hire date (calendar date). The dataset is fixed at 40 employees and is not edited by this feature. Salary and hire date are stored as plain numbers/dates; the formatted display (thousands-separated salary, "D MMM YYYY" hire date) is presentational only and does not change the underlying value used for filtering or URL encoding.
- **Filter Condition**: One rule within the filter tree — a field to check, an operator valid for that field, and a value (absent for the boolean "is true"/"is false" operators). A condition's value MUST satisfy its field's validation constraints before it is applied to the filter.
- **Filter Group**: A container within the filter tree holding an ordered list of children, each of which is a Filter Condition, or (at the root level only, and at most one such child) another Filter Group, combined using either AND or OR logic. The tree is limited to two levels: the root group, and one level of groups nested directly inside it, with the root holding at most one nested group.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can narrow the table to a specific subset using a single filter rule in under 15 seconds without instruction.
- **SC-002**: The visible rows and match count reflect any filter edit with no perceptible delay for selection-based inputs, and within a brief, consistent debounce window for free-text/numeric inputs (no separate "apply" or "search" action required in either case).
- **SC-003**: A user can correctly predict which rows a filter will show by reading its plain-language sentence alone, for filters using up to the maximum supported nesting depth.
- **SC-004**: Opening a previously shared filter link reproduces the exact same filtered table view as when it was shared, every time, for links produced by this feature.
- **SC-005**: Opening a hand-edited, incomplete, or otherwise invalid filter link never results in a crash or error message — it always falls back to the full, unfiltered table.
- **SC-006**: A user can narrow the table to employees hired in a specific month, year, or day-of-month using only the relevant `hireDate` condition(s), without needing to know any employee's full hire date.
- **SC-007**: A user can identify and correct an invalid filter value without consulting documentation, guided entirely by the inline error message shown next to the field.
- **SC-008**: A user can tell which conditions belong to the same group, and which group is nested, purely from visual alignment and indentation, without reading the plain-language sentence.
- **SC-009**: Salary and hire date values are equally legible at a glance across all rows, with consistent formatting throughout the table.
- **SC-010**: Typing quickly into a filter's text or number value field does not cause visible lag or excessive flicker in the table while typing.
- **SC-011**: On a mobile-width screen, a user can locate and tap a condition's remove control without it being obscured by, or crowding, the field/operator/value inputs.
- **SC-012**: A developer can identify, from a single, self-contained place in the code, when a debounced field's value is being held locally versus committed to the filter, without cross-referencing multiple separate state variables.
- **SC-013**: A developer can reuse the debounce mechanism in a feature unrelated to filtering without copying code or learning any filter-specific concept.
- **SC-014**: A developer opening the condition-row or top-level filter-page file can identify its rendering structure without scrolling past business logic or branching decisions, because that logic lives in a hook or plain function instead.
- **SC-015**: Adding support for a new value-input kind requires adding one entry to a lookup map, not editing conditional logic spread across multiple files.
- **SC-016**: Any code outside the `filter-builder` feature that needs something from it can do so with exactly one import path, with no direct imports reaching into the feature's internal files.

## Assumptions

- Text matching for the `name` field's "contains" and "equals" operators is case-insensitive, consistent with common filter UIs (e.g., Notion, Linear).
- A group with no children (all its conditions/subgroups removed) is treated as vacuously satisfied — it does not exclude any rows — rather than being auto-deleted or blocking further edits.
- A condition whose value has not yet been provided is treated as not yet narrowing the result set, rather than excluding all rows or throwing an error.
- The root group and every nested group each independently default to AND when first created.
- The employee dataset is static, local, mock data bundled with the feature; there is no create/edit/delete of employee records and no remote data source.
- No filter state is persisted beyond the URL query string — closing the tab or navigating away without the URL (e.g., clearing query params) loses the filter, consistent with the exclusion of saved presets/localStorage from scope.
- The set of available countries (EG, SA, AE, US, DE) is fixed and not user-configurable.
- The `hireDate` field supports only independent day/month/year component matching (e.g., "month is March") — not full-date equality, before/after, or date-range comparisons, which are out of scope for this update.
- The static employee dataset's hire dates vary across months, years, and days-of-month so that day/month/year filtering is meaningful to test; no new employees are added beyond the existing 40.
- Condition-value validation will be implemented with a lightweight schema-validation library (e.g., Zod) so field rules stay declarative, colocated, and easy to extend, consistent with this project's preference for simple, readable code.
- Salary is displayed without a currency symbol because the dataset spans multiple countries (EG, SA, AE, US, DE) with different currencies and no per-employee currency field exists; a thousands-separated plain number is used instead.
- Hire date is displayed as "D MMM YYYY" (e.g., `2 Jun 2026`) for compact, locale-unambiguous reading; this affects only table display, not the underlying stored value, the value used for filtering, or the URL-encoded filter tree.
- "More readable alignment" is interpreted as consistent column alignment of a group's condition controls plus a clear visual cue (indentation/border) distinguishing a nested group from the root — not a full visual redesign of the feature.
- The debounce delay is a short, fixed interval (target ~300ms) — long enough to skip intermediate keystrokes, short enough to feel immediate; the exact figure may be tuned during implementation without changing this spec's intent.
- "Mobile/narrow viewport" is defined using the project's existing Tailwind CSS v4 responsive breakpoint conventions (viewport width below the `md` breakpoint, 768px), consistent with the styling approach already used in this project.
- The mobile remove-button repositioning is a layout change only (control placement); it does not change what the remove control does, add confirmation steps, or alter its behavior on desktop.
- This update is a refactor of the existing debounce implementation for readability and maintainability only; it introduces no new user-facing capability and changes no previously-specified behavior (FR-011, FR-025, SC-002, SC-010). Naming a "custom hook" as the target shape in FR-027 is a deliberate, narrow implementation hint at the user's explicit request, consistent with the existing precedent for the Zod validation library and the base64/URL-safe URL encoding scheme.
- This update (User Stories 10-13, FR-029-FR-035, SC-013-SC-016) is likewise a structural refactor only: it introduces no new field, operator, or user-facing capability, and every previously-specified behavior continues to hold unchanged.
- "Strategy pattern to avoid if statements" is interpreted as: wherever behavior already varies by field, operator, or value kind, that variation is expressed as data in a lookup map (continuing the pattern already established by `fieldConfig` and the value-kind-to-input-control map), rather than as conditional branches scattered through components. It does not require introducing class-based strategy objects, which would be inconsistent with this project's plain-function, hooks-based style.
- The shared debounce hook's new location (e.g., a project-level `src/hooks/` or `src/shared/` directory, outside any feature folder) is an implementation decision to be made during planning; this spec only requires that it live outside `filter-builder` and be usable by other features without filter-specific knowledge.
- Suggested enhancements identified while specifying this update, offered for consideration but not required for this update to be considered complete: (1) collapse the condition row's per-field describe/format logic and the value-input lookup map into one place in `fieldConfig` so all field-driven behavior is scannable from a single file; (2) once the module entry-file convention (FR-033) is in place, consider an ESLint rule that flags deep imports into a feature's internal files from outside it, so Article V of the project constitution is enforced automatically rather than by convention alone.
