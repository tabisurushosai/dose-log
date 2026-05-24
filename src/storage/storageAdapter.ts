export type StorageKey = string;
export type StorageValue = unknown;

export type StorageRead = (key: StorageKey) => Promise<StorageValue | undefined>;
export type StorageWrite = (key: StorageKey, value: StorageValue) => Promise<void>;

export interface StorageAdapter {
  readonly read: StorageRead;
  readonly write: StorageWrite;
}
