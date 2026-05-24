import type { StorageAdapter, StorageKey, StorageValue } from "./storageAdapter";

type ChromeStorageItems = Partial<Record<StorageKey, StorageValue>>;

function readFromChromeStorage(key: StorageKey): Promise<StorageValue | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve((items as ChromeStorageItems)[key]);
    });
  });
}

function writeToChromeStorage(values: ChromeStorageItems): Promise<void> {
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
    async read(key: StorageKey): Promise<StorageValue | undefined> {
      return readFromChromeStorage(key);
    },

    async write(key: StorageKey, value: StorageValue): Promise<void> {
      await writeToChromeStorage({
        [key]: value
      });
    }
  };
}
