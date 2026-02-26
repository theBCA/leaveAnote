# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**LeaveANote** is a time-locked messaging product with three targets:
1. **Web app** (root) — React + TypeScript + Vite SPA
2. **Expo mobile app** (`mobile/`) — React Native, testable in web mode on Linux
3. **Native iOS app** (`ios/`) — Swift/SwiftUI, requires macOS + Xcode (cannot build on cloud VM)

All three share the same Firebase backend (Firestore + Storage). There is no server to run locally.

### Services

| Service | Command | Working Dir | Notes |
|---------|---------|-------------|-------|
| Web dev server | `npm run dev` | `/workspace` | Vite on port 5173. Use `-- --host 0.0.0.0` for external access. |
| Expo mobile dev | `npx expo start --web --port 8081` | `/workspace/mobile` | Expo web mode for testing on Linux. |

The native iOS app (`ios/`) cannot be run on this VM — it requires macOS with Xcode 15+.

### Common commands

**Web app** (root):
- `npm run dev` — start Vite dev server
- `npm run lint` — ESLint (exits non-zero due to pre-existing errors)
- `npm run build` — TypeScript + Vite build (fails due to pre-existing TS errors; dev server unaffected)

**Expo mobile** (`mobile/`):
- `npx expo start --web --port 8081` — dev server in web mode
- `npx tsc --noEmit` — TypeScript check (compiles cleanly)

**Native iOS** (`ios/`):
- `brew install xcodegen && xcodegen generate` — generate `.xcodeproj` (macOS only)
- Open in Xcode, replace `GoogleService-Info.plist`, Cmd+R to run. See `ios/README.md`.

### Gotchas

- **`npm run build` / `npm run lint` fail** with pre-existing errors. The Vite dev server works fine (uses esbuild).
- **Firebase credentials required:** Web needs `VITE_FIREBASE_*` in `.env` (see `.env.example`). Expo mobile needs `EXPO_PUBLIC_FIREBASE_*` env vars or `app.json > extra`. iOS needs `GoogleService-Info.plist`. Without credentials the UIs render but backend operations fail.
- **No automated test framework** — testing is manual only.
- **Node.js 20.19+ or 22.12+** required.
- **Expo encryption import:** `from '@noble/ciphers/aes.js'` (must use `.js` extension).
- **iOS app:** XcodeGen-based (`project.yml`). Firebase iOS SDK via SPM. AES-GCM via CryptoKit (byte-compatible with web).
