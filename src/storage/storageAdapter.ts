export interface StorageAdapter {
  readonly read: (key: string) => Promise<unknown | undefined>;
  readonly write: (key: string, value: unknown) => Promise<void>;
}
