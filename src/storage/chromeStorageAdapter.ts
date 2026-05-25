import type { StorageAdapter } from "./storageAdapter";

type ChromeStorageItems = Record<string, unknown | undefined>;

function readFromChromeStorage(key: string): Promise<unknown | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get<ChromeStorageItems>(key, (items) => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve(items[key]);
    });
  });
}

function writeToChromeStorage(values: Partial<ChromeStorageItems>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set<ChromeStorageItems>(values, () => {
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
    async read(key: string): Promise<unknown | undefined> {
      return readFromChromeStorage(key);
    },

    async write(key: string, value: unknown): Promise<void> {
      await writeToChromeStorage({
        [key]: value
      });
    }
  };
}
