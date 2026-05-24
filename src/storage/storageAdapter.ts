export interface StorageAdapter {
  get<TValue = unknown>(key: StorageKey): Promise<TValue | undefined>;
  set<TValue>(key: StorageKey, value: TValue): Promise<void>;
}

export const STORAGE_KEYS = {
  doseRecords: "doseRecords",
  premiumState: "premiumState"
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
