# Anker — standing instructions

Personal daily tool: daily tracking, ADHD support (daily intention), thought
capture, and daily check-ins on mental state and body pain. Local-first,
no backend, no accounts. The human reviewing your work is training to be a
supervisor of AI-written code and is new to JavaScript and React.

## Stack (locked — do not propose alternatives unless asked)

Vite + React (JavaScript/JSX, **no TypeScript**) + Tailwind CSS v4.
Tailwind v4 is configured via the `@tailwindcss/vite` plugin and `@theme` in
`src/index.css`. There is no `tailwind.config.js` or `postcss.config.js`, and
none should be added.

## Commands

- `npm install` — install dependencies
- `npm run dev` — local dev server (http://localhost:5173)
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the production build locally

## Architecture

- `src/modules/<feature>/` — self-contained feature modules. A module may
  import from `lib/` and `components/`. A module must never import from
  another module.
- `src/lib/` — shared logic. `storage.js` is the ONLY file allowed to touch
  `localStorage`.
- `src/components/` — shared presentational UI.
- `src/App.jsx` — the only file that knows about all modules; it wires tabs.

## Conventions

- localStorage keys are prefixed `anker_v1_`.
- Date keys ALWAYS derive from LOCAL time. Never `toISOString()` — it converts
  to UTC and silently shifts the day in other timezones (this has bitten us).
- UI language is Dutch. Code, identifiers and comments are English.
- Pain is stored as `[{ region, intensity }]` against stable region ids.
  This shape is a permanent contract; changing it is a migration, not an edit.

## Guardrails

- Ask before: adding a dependency, deleting a file, or changing the shape of
  anything already stored on disk.
- Prefer small diffs. Do not refactor beyond what was asked.
- Build only what was requested — no extra features, no sample data.
- Explain non-obvious choices in the commit message; assume the reviewer is
  new to React.
