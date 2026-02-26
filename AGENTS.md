# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**LeaveANote** is a single-page React + TypeScript + Vite application for creating time-locked messages. It uses Firebase (Firestore + Storage) as the backend — there is no server to run locally.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Vite dev server | `npm run dev` | Runs on port 5173. Use `-- --host 0.0.0.0` for external access. |

### Common commands

Refer to `package.json` scripts:

- **Dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Preview prod build:** `npm run preview`

### Gotchas

- **`npm run build` fails** due to pre-existing TypeScript errors (`verbatimModuleSyntax` type-import issues and unused variables). The Vite dev server (`npm run dev`) works fine because it uses esbuild, not `tsc`, for transpilation.
- **`npm run lint` exits non-zero** due to pre-existing ESLint errors (React hooks `set-state-in-effect` and unused variable warnings). The lint tooling itself works correctly.
- **Firebase credentials required:** The app needs 6 `VITE_FIREBASE_*` environment variables in `.env` (see `.env.example`). Without real Firebase credentials, the UI renders and is interactive but all backend operations (creating/viewing notes) will hang or fail.
- **No automated test framework** is configured in this repo (no vitest, jest, or similar). Testing is manual only.
- **Node.js version:** Requires 20.19+ or 22.12+ (see `README.md`).
