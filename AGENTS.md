# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**LeaveANote** is a single-page React + TypeScript + Vite application for creating time-locked messages. It uses Firebase (Firestore + Storage) as the backend — there is no server to run locally.

### Services

| Service | Command | Working Dir | Notes |
|---------|---------|-------------|-------|
| Web dev server | `npm run dev` | `/workspace` | Vite on port 5173. Use `-- --host 0.0.0.0` for external access. |
| Mobile dev server | `npx expo start --web --port 8081` | `/workspace/mobile` | Expo web mode on port 8081. For native iOS, use `npx expo start --ios` on a Mac with Xcode. |

### Common commands

**Web app** (root `package.json`):

- **Dev server:** `npm run dev`
- **Lint:** `npm run lint`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Preview prod build:** `npm run preview`

**Mobile app** (`mobile/` directory):

- **Dev (web):** `npx expo start --web --port 8081`
- **Dev (native):** `npx expo start`
- **TypeScript check:** `npx tsc --noEmit`
- **Build for web:** `npx expo export --platform web`

### Gotchas

- **`npm run build` fails** due to pre-existing TypeScript errors (`verbatimModuleSyntax` type-import issues and unused variables). The Vite dev server (`npm run dev`) works fine because it uses esbuild, not `tsc`, for transpilation.
- **`npm run lint` exits non-zero** due to pre-existing ESLint errors (React hooks `set-state-in-effect` and unused variable warnings). The lint tooling itself works correctly.
- **Firebase credentials required:** The app needs 6 `VITE_FIREBASE_*` environment variables in `.env` (see `.env.example`). Without real Firebase credentials, the UI renders and is interactive but all backend operations (creating/viewing notes) will hang or fail.
- **No automated test framework** is configured in this repo (no vitest, jest, or similar). Testing is manual only.
- **Node.js version:** Requires 20.19+ or 22.12+ (see `README.md`).
- **Mobile app (`mobile/`):** Uses Expo SDK 55 with React Native. TypeScript compiles cleanly (`npx tsc --noEmit`). Encryption in `src/utils/encryption.ts` uses `@noble/ciphers` (pure JS AES-GCM) — import path must use `.js` extension: `from '@noble/ciphers/aes.js'`. Firebase config can be set via `app.json > extra` or `EXPO_PUBLIC_FIREBASE_*` env vars. QR code generation uses `react-native-qrcode-svg` (requires `react-native-svg`).
