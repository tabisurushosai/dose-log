# Porting guide

This project keeps the current Chrome extension behavior while leaving a narrow
path for future iOS/Android app shells.

## Boundaries

- `src/core/` is pure TypeScript domain logic. Do not import or reference
  `chrome.*`, DOM APIs, network APIs, or platform SDKs from this directory.
  `npm run typecheck:core` checks this directory without DOM or Chrome ambient
  types so portability regressions fail during the normal build.
- `src/storage/storageAdapter.ts` defines the platform-neutral key/value storage
  port. It exposes named function types for `read(key)` and `write(key, value)`
  over string keys and `unknown` values; app-level key names, normalization,
  batching, and platform result shapes stay outside the platform adapter.
- `src/storage/appStorage.ts` maps persisted values to the app domain and keeps
  the existing storage keys (`APP_STORAGE_KEYS`) and normalization rules in one
  place. `npm run typecheck:portable` checks `src/core/`, `storageAdapter`, and
  `appStorage` without DOM or Chrome ambient types.
- `src/storage/chromeStorageAdapter.ts` is the Chrome extension implementation.
  Keep Chrome-specific types and `chrome.*` calls in Chrome entry points or
  Chrome adapters only.
- `src/popup/` should receive dependencies from the entry point. Avoid importing
  platform storage or platform localization directly into reusable UI logic.

## Storage contract

The persisted data shape must remain compatible with existing installs:

- `doseRecords`: array of dose records, normalized by `normalizeDoseRecords`
- `premiumState`: premium/trial state, normalized by `normalizePremiumState`

For another platform, provide a `StorageAdapter` implementation backed by that
platform's local storage and pass it through `createAppStorage(...)`. Do not
rename keys or add migrations unless the stored data format intentionally
changes in a separate, scoped task.

Storage adapter implementations should keep the platform surface private:

- return `undefined` from `read(key)` only when that key is missing
- persist exactly the value passed to `write(key, value)` for that key
- translate platform errors into rejected promises
- avoid leaking platform-specific batch APIs, snapshots, SDK objects, or globals
  through `StorageAdapter`

## Mobile shell checklist

When adding an iOS or Android shell, keep the shell thin:

1. Reuse `src/core/` as-is for dose record and premium/trial calculations. If
   code needs `chrome.*`, DOM, network, filesystem, or native SDK APIs, it does
   not belong in `src/core/`.
2. Implement the small `StorageAdapter` contract for the platform. The adapter
   should only implement `read(key)` and `write(key, value)` for raw `unknown`
   values by string key; keep app keys, normalization, and compatibility rules
   in `src/storage/appStorage.ts`.
3. Inject platform services from the entry point, the same way the Chrome popup
   passes storage, translation, confirmation, and locale dependencies into
   `createDoseLogApp(...)`.
4. Keep UI code free of Chrome-only imports unless it is a Chrome entry point.
   Platform-specific UI glue should live beside that platform's entry point, not
   inside reusable core or storage-domain modules.

## Chrome permissions and offline behavior

Porting work must not add extension permissions, host permissions, API calls,
remote code, `eval`, external CDN assets, or external fonts. The current Chrome
extension remains Manifest V3 and offline-only.
