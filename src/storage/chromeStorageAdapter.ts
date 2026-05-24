import type { StorageAdapter, StorageKey } from "./storageAdapter";

type StoredValues = Record<string, unknown>;

function getFromChromeStorage(keys: StorageKey[]): Promise<StoredValues> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(items as StoredValues);
    });
  });
}

function setInChromeStorage(values: StoredValues): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

export function createChromeStorageAdapter(): StorageAdapter {
  return {
    async get<TValue = unknown>(key: StorageKey): Promise<TValue | undefined> {
      const items = await getFromChromeStorage([key]);
      return items[key] as TValue | undefined;
    },

    async set<TValue>(key: StorageKey, value: TValue): Promise<void> {
      await setInChromeStorage({
        [key]: value
      });
    }
  };
}
