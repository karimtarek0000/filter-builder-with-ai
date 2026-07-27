<!--
Sync Impact Report
Version change: [TEMPLATE] → 1.0.0 (initial ratification)
Modified principles: n/a (first fill of template placeholders)
Added sections:
  - I. Readability First
  - II. Deliberate, Incremental Delivery
  - III. Minimal Scope (YAGNI)
  - IV. Surgical Changes Only
  - V. Clear Structure & Separation of Concerns
  - VI. Extension Through Configuration, Not Branching
  - VII. Strict TypeScript
  - Technology Stack & Environment Constraints
  - Development Workflow & Quality Gates
  - Governance
Removed sections: none (template placeholders only)
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no change needed (Constitution Check gate is
    already generic and reads from this file at plan time)
  - .specify/templates/spec-template.md — ✅ no change needed (no principle-specific content)
  - .specify/templates/tasks-template.md — ✅ no change needed (task categories are generic;
    testing tasks remain OPTIONAL, consistent with "no test runner configured yet")
  - .specify/templates/checklist-template.md — ✅ no change needed (no principle-specific content)
  - .claude/skills/speckit-*/SKILL.md — ✅ reviewed, no CLAUDE-only or agent-specific
    references requiring generalization
  - CLAUDE.md — ⚠ pending manual sync: this constitution is derived directly from CLAUDE.md's
    "Code Principles" section; CLAUDE.md remains the file Claude Code reads at session start,
    and the two MUST be kept in agreement on future amendments (see Governance)
Follow-up TODOs: none
-->

# React Test Constitution

## Core Principles

Security, authentication, input validation, error handling, and type safety
override every principle below and MUST NOT be traded away for simplicity.
When two principles conflict, the one listed first in this document wins.

### I. Readability First

Code MUST be written for the version a new contributor understands without
asking, even if that version is a few lines longer. A clear function MUST
NOT be split into small, scattered pieces merely for the sake of
decomposition. Adding one more of an existing thing MUST mean adding data in
one place, not editing logic across several files; if it requires edits in
three or more files, the design MUST be reconsidered before proceeding.

**Rationale**: Code is read far more often than it is written; optimizing
for a reader's first-pass understanding pays for itself every time the code
is revisited.

### II. Deliberate, Incremental Delivery

Work MUST proceed one step at a time, stopping after each step for
confirmation before continuing. A single step MUST deliver one complete
behavior end to end; if it requires touching more than three files, the
reason MUST be stated before writing code. Before code is written, the
intended changes MUST be listed briefly and confirmed. Assumptions MUST be
stated explicitly; when a request has more than one valid reading, it MUST
be asked about rather than silently resolved. When a simpler approach exists
than the one requested, it MUST be raised before implementing the requested
approach.

**Rationale**: Silent assumptions and unconfirmed multi-step work are cheap
to correct early and expensive to unwind after the fact.

### III. Minimal Scope (YAGNI)

Only what the current feature needs MUST be built — no config options or
extension points for features that do not yet exist. An abstraction used in
only one place MUST be inlined. A utility with no current caller MUST NOT be
written.

**Rationale**: Speculative flexibility accrues maintenance cost without ever
paying for itself, and it obscures the actual shape of the problem being
solved.

### IV. Surgical Changes Only

Changes MUST touch only the lines a task requires. Drive-by renames,
reformatting, or comment cleanup MUST NOT be bundled into unrelated work.
Working code MUST NOT be refactored as a side effect of an unrelated task.
Imports made unused by a change MUST be removed; pre-existing dead code MUST
be left alone unless its removal was explicitly requested.

**Rationale**: Unrelated cleanup bundled into a diff makes review harder and
increases the chance of an unintended regression slipping through.

### V. Clear Structure & Separation of Concerns

Business logic MUST live in plain functions with no framework imports;
components call that logic, they do not contain it. Data fetching MUST live
in a hook or a service, never inline in a component that also renders. A
component that exceeds 150 lines MUST be split. The same rule MUST NOT be
written in two places — a duplicated rule is a bug waiting to happen. A
known pattern (factory, strategy, adapter) MUST be used only once the
complexity it addresses already exists, not for complexity anticipated
later.

**Rationale**: Consistent structural boundaries keep logic testable and keep
components focused on rendering.

### VI. Extension Through Configuration, Not Branching

Handling one more of something the system already supports MUST mean adding
data, not branching logic; needing a new `if` in three places signals a
design that MUST be reconsidered before writing it. Three or more branches
that carry real logic and are likely to grow MUST be expressed as a map
keyed by type, with behavior held in the map; a short, stable if-chain is
acceptable as-is. Components MUST read behavior from configuration rather
than encode it directly. A component MUST receive only the props it uses —
a prop that exists solely to be passed further down MUST instead be a
single handler object or use the framework's context mechanism. An
interface or abstract type MUST NOT be introduced unless a second
implementation exists today.

**Rationale**: Data-driven extension keeps the system's growth points in
one place instead of scattering conditional logic across the codebase.

### VII. Strict TypeScript

`any` MUST NOT be used; `unknown` MUST be used and narrowed instead. Where
`any` is truly unavoidable, it MUST be justified with a comment on the same
line. Narrow, explicit types MUST be preferred over broad ones such as
`string`, `object`, or `Record<string, unknown>`. Runtime checks MUST NOT be
added for cases the compiler already guarantees.

**Rationale**: The type system is the cheapest, most reliable place to catch
a whole class of errors; duplicating that guarantee at runtime adds cost
without adding safety.

## Technology Stack & Environment Constraints

- This is a Vite + React 19 + TypeScript (strict) application. The entry
  chain is `index.html` → `src/main.tsx` → `src/App.tsx`; `App` MUST be the
  component rendered into `#root` via `createRoot`.
- Styling MUST use Tailwind CSS v4 through the `@tailwindcss/vite` plugin,
  pulled in via a single `@import "tailwindcss";` in `src/index.css`. No
  plain CSS files and no `tailwind.config.js` MUST be added — v4 config is
  CSS-based.
- TypeScript MUST be type-checked through the project references setup
  (root `tsconfig.json` → `tsconfig.app.json` for source,
  `tsconfig.node.json` for build tooling), with `noUnusedLocals` and
  `noUnusedParameters` enforced.
- ESLint's flat config (`eslint.config.js`), combining `@eslint/js`
  recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks`,
  and `eslint-plugin-react-refresh` (Vite mode), MUST pass for any change
  touching `src/`.

## Development Workflow & Quality Gates

- `npm run build` (type-check via `tsc -b`, then `vite build`) and
  `npm run lint` MUST pass for any change affecting `src/`.
- No test runner is configured in this project yet. Until one is added, a
  task's success criterion MUST be a concrete manual repro step — which
  action produces which result on screen — stated explicitly rather than
  skipped. If a task adds Vitest or React Testing Library, the runner and
  scripts MUST be wired up as part of that same task, and test writing MUST
  be delegated to the `unit-test-writer` subagent from then on.
- For UI or frontend changes, the feature MUST be exercised in a running
  dev server (`npm run dev`), covering the golden path and edge cases,
  before the task is reported complete; if that isn't possible, that
  limitation MUST be stated explicitly rather than claiming success from
  type-checks alone.

## Governance

This constitution supersedes ad-hoc conventions for this repository.
CLAUDE.md is the artifact Claude Code reads directly at session start and
mirrors these principles in that agent's required format; any amendment
here MUST be reflected in CLAUDE.md in the same change, and vice versa —
the two MUST NOT drift.

**Amendment procedure**: propose the change, determine the semantic version
bump (MAJOR for backward-incompatible principle removal/redefinition, MINOR
for a new principle or materially expanded guidance, PATCH for wording or
clarification), update this file and CLAUDE.md together, and propagate any
consequential edits to `.specify/templates/*` and installed `speckit-*`
commands/skills.

**Compliance review**: the `Constitution Check` gate in
`.specify/templates/plan-template.md` MUST be evaluated against this file
for every feature plan. Complexity that violates Principle III or V MUST be
justified in that plan's Complexity Tracking table rather than merged
silently.

**Version**: 1.0.0 | **Ratified**: 2026-07-27 | **Last Amended**: 2026-07-27
