export type StorageKey = string;
export type StorageValue = unknown;
export type StorageSnapshot = Record<StorageKey, StorageValue>;

export interface StorageAdapter {
  read(key: StorageKey): Promise<StorageValue | undefined>;
  write(key: StorageKey, value: StorageValue): Promise<void>;
}
