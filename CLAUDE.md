# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build (`vite build`)
- `npm run lint` — run ESLint over the whole project
- `npm run preview` — preview the production build locally

There is no test runner configured yet (no Vitest/Jest in `package.json`). If you add tests, wire up the runner and scripts as part of that work.

## Architecture

This is a Vite + React 19 + TypeScript (strict) template, currently a minimal scaffold:

- `index.html` → `src/main.tsx` → `src/App.tsx` is the entry chain; `App` is rendered into `#root` via `createRoot` in `main.tsx`.
- Styling is Tailwind CSS v4, wired through the `@tailwindcss/vite` plugin (`vite.config.ts`) and pulled in with a single `@import "tailwindcss";` in `src/index.css` — there is no `tailwind.config.js` (v4 uses CSS-based config) and no plain CSS should be added.
- TypeScript uses project references: root `tsconfig.json` points to `tsconfig.app.json` (source, strict, bundler resolution, `noUnusedLocals`/`noUnusedParameters` enforced) and `tsconfig.node.json` (build tooling config, e.g. `vite.config.ts`).
- ESLint is flat-config (`eslint.config.js`) combining `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` (Vite mode).

## Code Principles

Security, auth, input validation, error handling, and type safety override
every rule below. Never trade them for simplicity.
When two rules conflict, the section that comes first wins.

### Readability

Code gets read more than written. Prefer the version a new contributor
understands without asking, even if it is a few lines longer.
Splitting a clear function into small scattered pieces makes it worse,
not better.

Test: adding one more of an existing thing should mean adding data in one
place, not editing logic in several. If it needs edits in three files,
the design is wrong.

### Working style

- Do one step at a time. After each step, stop and wait.
- A step delivers one behaviour end to end. If it needs more than 3 files,
  say why first.
- Before writing code, list what you will change in 3 bullets and wait.
- State your assumptions. If a request has more than one reading, ask —
  don't pick one silently.
- If a simpler approach exists, say so before implementing the one asked for.
- If the project has Vitest or React Testing Library installed, delegate
  test writing to the `unit-test-writer` subagent in the same step. If it
  has neither, skip tests entirely — give a manual repro step instead:
  which action produces which result on screen.

### Scope

- Build only what the current features need. No config options or extension
  points for features that don't exist yet.
- An abstraction used in one place → inline it.
- A utility nothing calls yet → don't write it.

### Surgical changes

- Touch only the lines the task requires.
- No drive-by renames, reformatting, or comment cleanup.
- Don't refactor working code as a side effect of an unrelated task.
- Remove imports your change made unused. Leave pre-existing dead code alone.

### Structure

- Business logic lives in plain functions with no framework imports.
  Components call them; they don't contain them.
- Data fetching goes in a hook or a service, never inline in a component
  that also renders.
- Component over 150 lines → split it.
- One concept, one place. If the same rule is written in two files, the
  second one is a bug waiting to happen.
- Use a known pattern (factory, strategy, adapter) only when the complexity
  is already there, not for complexity you expect later.

### Extension

- Adding one more of something the system already handles should mean adding
  data, not branching logic. If it needs a new `if` in three places, the
  design is wrong — say so before writing it.
- 3+ branches carrying real logic and likely to grow → use a map keyed by
  type, with the behaviour in the map. A short stable if-chain is fine as is.
- Components read behaviour from config; they don't encode it.
- Pass a component only the props it uses. If a prop exists only to be handed
  further down, pass one handler object or use the framework's context
  mechanism.
- Don't introduce an interface or abstract type unless a second
  implementation exists today.

### TypeScript

- No `any`. Use `unknown` and narrow it. If `any` is truly unavoidable,
  justify it in a comment on the same line.
- Prefer narrow explicit types over broad ones like `string`, `object`,
  or `Record<string, unknown>`.
- Don't add runtime checks for cases the compiler already guarantees.
