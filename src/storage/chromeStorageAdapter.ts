import type { PersistedValue, StorageAdapter, StorageKey, StoredValues } from "./storageAdapter";

function getFromChromeStorage(key: StorageKey): Promise<PersistedValue | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve((items as StoredValues)[key]);
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
    async get(key: StorageKey): Promise<PersistedValue | undefined> {
      return getFromChromeStorage(key);
    },

    async set(key: StorageKey, value: PersistedValue): Promise<void> {
      await setInChromeStorage({
        [key]: value
      });
    }
  };
}
