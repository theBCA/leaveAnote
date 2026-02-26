# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**LeaveANote** is a React 18 + TypeScript + Vite single-page application for creating time-locked messages. It uses Firebase (Firestore + Storage) as its backend-as-a-service — there is no custom backend server.

### Running the app

- **Dev server**: `npm run dev` (Vite on port 5173). See `README.md` for full docs.
- **Build**: `npm run build` (runs `tsc -b && vite build`).
- **Lint**: `npm run lint` (ESLint with React + TypeScript rules).
- There are **no automated tests** — no test framework or test files exist in this codebase.

### Key caveats

- **Firebase credentials required**: The app needs 6 `VITE_FIREBASE_*` environment variables in a `.env` file (see `.env.example`). Without real Firebase project credentials, the UI loads and forms are interactive, but note creation hangs indefinitely — there is no client-side timeout or error fallback for failed Firebase operations.
- **Pre-existing lint/TS errors**: The codebase has ~10 pre-existing ESLint errors (unused vars, `setState` in effects) and ~12 TypeScript errors (`verbatimModuleSyntax` type-only imports, unused vars). These do **not** block the Vite dev server (SWC transpiler), but they cause `npm run build` (`tsc -b`) to fail.
- **No Docker, no monorepo**: Single `package.json`, pure Node.js development.
- **Node.js 22.x** is compatible with this project (22.12+ as per `README.md`).
