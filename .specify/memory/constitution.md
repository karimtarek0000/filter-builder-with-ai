<<<<<<< HEAD
# [PROJECT_NAME] Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]
<!-- Example: I. Library-First -->
[PRINCIPLE_1_DESCRIPTION]
<!-- Example: Every feature starts as a standalone library; Libraries must be self-contained, independently testable, documented; Clear purpose required - no organizational-only libraries -->

### [PRINCIPLE_2_NAME]
<!-- Example: II. CLI Interface -->
[PRINCIPLE_2_DESCRIPTION]
<!-- Example: Every library exposes functionality via CLI; Text in/out protocol: stdin/args → stdout, errors → stderr; Support JSON + human-readable formats -->

### [PRINCIPLE_3_NAME]
<!-- Example: III. Test-First (NON-NEGOTIABLE) -->
[PRINCIPLE_3_DESCRIPTION]
<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]
<!-- Example: IV. Integration Testing -->
[PRINCIPLE_4_DESCRIPTION]
<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

### [PRINCIPLE_5_NAME]
<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->
[PRINCIPLE_5_DESCRIPTION]
<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]
<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]
<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]
<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]
<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]
<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
=======
<!--
Sync Impact Report
Version change: 2.0.0 → 3.0.0 (MAJOR: the temporary Articles VIII–XI were merged
  into Principles I, III, V, VI, redefining those principles' text — a backward
  incompatible change per the amendment procedure's MAJOR criterion)
Modified principles:
  - I. Readability First → I. Readability — reworded to the newer, terser phrasing;
    added a Gate line; dropped the "adding one more of an existing thing" sentence
    (that concept now lives solely under VI, its more natural home)
  - III. Minimal Scope (YAGNI) → III. Simplicity — reworded; added a Gate line;
    kept the "no caller yet" rule from the original
  - V. Clear Structure & Separation of Concerns → V. Layer Separation — same rule
    set retained (150-line split, no-duplicated-rule, pattern-only-when-needed),
    renamed title, added a Gate line
  - VI. Extension Through Configuration, Not Branching → VI. Extension by Data —
    same rule set retained (map-keyed branching, config-driven components, prop
    drilling, interface-only-with-second-impl), renamed title, added a Gate line
    and the explicit "union discriminant" exemption
Added sections:
  - VIII. Module Boundaries — index.ts as public API (renumbered from XII)
  - IX. Testing — logic files require tests when a runner is present (renumbered
    from XIII)
Removed sections:
  - The standalone Articles VIII–XI (Readability/Simplicity/Layer
    Separation/Extension by Data "(Article)" variants) — folded into I, III, V,
    VI respectively rather than kept as duplicates, per explicit user instruction
    ("you can use new one") after the redundancy was flagged
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no change needed (Constitution Check
    gate is generic and reads from this file at plan time)
  - .specify/templates/spec-template.md — ✅ no change needed (no principle-specific
    content)
  - .specify/templates/tasks-template.md — ⚠ pending: task template currently marks
    all tests as OPTIONAL ("only include them if explicitly requested"); this is
    correct today since no test runner is installed, but Article IX now makes
    tests MANDATORY for logic files once a runner exists — revisit that template's
    wording in the same change that adds Vitest/Jest
  - .specify/templates/checklist-template.md — ✅ no change needed
  - .claude/skills/speckit-*/SKILL.md — ✅ reviewed, no CLAUDE-only or agent-specific
    references requiring generalization
  - CLAUDE.md — ⚠ pending manual sync: CLAUDE.md's "Code Principles" section does not
    yet mention Module Boundaries (index.ts), Testing, or the Gate lines added to
    Readability/Simplicity/Layer Separation/Extension by Data; keep the two files
    in agreement per Governance
Follow-up TODOs: none blocking
-->

# React Test Constitution

## Core Principles

Security, authentication, input validation, error handling, and type safety
override every principle below and MUST NOT be traded away for simplicity.
When two principles conflict, the one listed first in this document wins.
Lower-numbered articles win any conflict.

### I. Readability

Code MUST be written for the version a new contributor understands without
asking, even if that version is longer. A clear unit MUST NOT be split into
small, scattered pieces merely for the sake of decomposition.

**Gate**: in review, name the file a newcomer would struggle with. If there
is one, the change is not done.

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

### III. Simplicity

Build only what the current feature needs. No config options, extension
points, or abstractions for features that do not exist yet. A utility with
no current caller MUST NOT be written.

**Gate**: an abstraction used in exactly one place fails.

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

### V. Layer Separation

Business logic MUST live in plain functions with no framework imports;
components call that logic, they do not contain it. Data fetching MUST live
in a hook or a service, never inline in a component that also renders. A
component that exceeds 150 lines MUST be split. The same rule MUST NOT be
written in two places — a duplicated rule is a bug waiting to happen. A
known pattern (factory, strategy, adapter) MUST be used only once the
complexity it addresses already exists, not for complexity anticipated
later.

**Gate**: the plan must name which files hold logic and which hold UI.

**Rationale**: Consistent structural boundaries keep logic testable and keep
components focused on rendering.

### VI. Extension by Data

Adding one more of something the system already handles MUST mean adding
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

**Gate**: an `if` comparing against a domain value — a field name, an
operator name, a status string — inside a component fails. Branching on a
union's discriminant is not covered by this article.

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

### VIII. Module Boundaries

A module exposes its public API through `index.ts`. Anything not exported
there is internal and may change freely.

**Gate**: a file inside a module importing from that module's own `index`
fails. Wildcard re-exports (`export *`) fail.

**Rationale**: A single declared entry point per module keeps internal
reshuffling from becoming a cross-module breaking change.

### IX. Testing

If the project has a test runner installed, logic files with no framework
imports MUST ship with tests in the same change. UI changes ship with a
manual repro step instead.

**Gate**: a logic file with no matching test file fails.

**Rationale**: Logic with no framework imports is the cheapest code in the
repo to test and the easiest to regress silently without one.

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

## Quality Gates

| Gate  | Requirement                | Enforcement    |
|-------|-----------------------------|----------------|
| Build | Passes                      | `npm run build` |
| Lint  | Zero errors, zero warnings  | `npm run lint`  |
| Test  | 100% passing                | test runner (once installed; see Article IX) |

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

This constitution outranks personal preference and agent defaults. Any
exception requires a line in Complexity Tracking naming the article and the
reason. Amendments come from violations observed in review, not from
problems anticipated in advance.

**Version**: 3.0.0 | **Ratified**: 2026-07-27 | **Last Amended**: 2026-07-28
>>>>>>> Advanced-Filter-Builder
