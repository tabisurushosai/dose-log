# Porting guide

This project keeps the current Chrome extension behavior while leaving a narrow
path for future iOS/Android app shells.

## Boundaries

- `src/core/` is pure TypeScript domain logic. Do not import or reference
  `chrome.*`, DOM APIs, network APIs, or platform SDKs from this directory.
  `npm run typecheck:core` checks this directory without DOM or Chrome ambient
  types so portability regressions fail during the normal build.
- `src/storage/storageAdapter.ts` defines the platform-neutral key/value storage
  interface. It accepts string keys and unknown persisted values only; app-level
  key names and normalization stay outside the platform adapter.
- `src/storage/appStorage.ts` maps persisted values to the app domain and keeps
  the existing storage keys (`APP_STORAGE_KEYS`) and normalization rules in one
  place.
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

## Chrome permissions and offline behavior

Porting work must not add extension permissions, host permissions, API calls,
remote code, `eval`, external CDN assets, or external fonts. The current Chrome
extension remains Manifest V3 and offline-only.
