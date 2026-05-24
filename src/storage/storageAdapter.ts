export type StorageKey = string;
export type PersistedValue = unknown;
export type StoredValues = Record<StorageKey, PersistedValue>;

export interface StorageAdapter {
  get(key: StorageKey): Promise<PersistedValue | undefined>;
  set(key: StorageKey, value: PersistedValue): Promise<void>;
}
