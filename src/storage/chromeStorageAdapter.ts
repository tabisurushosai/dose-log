import type { StorageAdapter, StorageKey, StoredValues } from "./storageAdapter";

function getFromChromeStorage(keys: readonly StorageKey[]): Promise<StoredValues> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([...keys], (items) => {
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
    async get(key: StorageKey): Promise<unknown | undefined> {
      const items = await getFromChromeStorage([key]);
      return items[key];
    },

    async set(key: StorageKey, value: unknown): Promise<void> {
      await setInChromeStorage({
        [key]: value
      });
    }
  };
}
