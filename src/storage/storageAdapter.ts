export interface StorageAdapter {
  get<TValue = unknown>(key: string): Promise<TValue | undefined>;
  set<TValue>(key: string, value: TValue): Promise<void>;
}

export const STORAGE_KEYS = {
  doseRecords: "doseRecords",
  premiumState: "premiumState"
} as const;
