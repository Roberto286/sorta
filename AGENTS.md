# Agent Notes

## Runtime
- This is an **iOS Scriptable** project, not Node.js. `Reminder`, `Alert`, `Script`, `args`, `Request`, `Notification` are Scriptable globals. Do not attempt to run the code with `node`.

## Build
- `npm run build` — bundles `scriptable/index.ts` into `dist/sorta.js` using esbuild (`--platform=neutral`).
- **Do not use `npm start` or `npm run dev`**. They target `dist/core.js`, which no build step produces.

## Project structure
- `scriptable/index.ts` — Scriptable entrypoint. Fetches reminders, calls Gemini API, outputs enriched JSON.
- `core/core.ts` — Shared reminder-processing logic and prompt builder. No external imports; relies on ambient Scriptable types.

## TypeScript
- No `tsconfig.json`. Type checking is ambient/editor-only; esbuild handles transpilation.
- Imports use `.ts` extensions (e.g., `../core/core.ts`). Keep them.

## Lint / Format
- `npm run lint` — runs Biome with `--write` on `scriptable/` and `core/`.
- Config: tabs, double quotes, organize imports.

## Testing
- No test suite exists. Do not add one unless explicitly asked.

## Architecture
- Single-step flow: Shortcut passes `apiKey` (and optional `model`) via `args.shortcutParameter` → Script fetches Inbox reminders → calls Gemini with structured JSON output → outputs enriched JSON array.
- Uses Gemini's native `responseMimeType: application/json` with a rigid JSON schema to guarantee clean JSON responses (no markdown, no salutations).
- On error, sends a local `Notification` and outputs `null`.
