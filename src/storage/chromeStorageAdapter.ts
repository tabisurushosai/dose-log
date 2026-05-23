import { normalizeDoseRecords, type DoseRecord } from "../core/doseLog";
import { normalizePremiumState, type PremiumState } from "../core/premium";
import type { AppStorageAdapter } from "./storageAdapter";

const DOSE_RECORDS_KEY = "doseRecords";
const PREMIUM_STATE_KEY = "premiumState";

type StoredValues = Partial<{
  [DOSE_RECORDS_KEY]: unknown;
  [PREMIUM_STATE_KEY]: unknown;
}>;

function getFromChromeStorage(keys: string[]): Promise<StoredValues> {
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

export function createChromeStorageAdapter(): AppStorageAdapter {
  return {
    async getDoseRecords(): Promise<DoseRecord[]> {
      const items = await getFromChromeStorage([DOSE_RECORDS_KEY]);
      return normalizeDoseRecords(items[DOSE_RECORDS_KEY]);
    },

    async setDoseRecords(records: readonly DoseRecord[]): Promise<void> {
      await setInChromeStorage({
        [DOSE_RECORDS_KEY]: normalizeDoseRecords(records)
      });
    },

    async getPremiumState(): Promise<PremiumState | null> {
      const items = await getFromChromeStorage([PREMIUM_STATE_KEY]);
      if (items[PREMIUM_STATE_KEY] === undefined) {
        return null;
      }

      return normalizePremiumState(items[PREMIUM_STATE_KEY]);
    },

    async setPremiumState(state: PremiumState): Promise<void> {
      await setInChromeStorage({
        [PREMIUM_STATE_KEY]: normalizePremiumState(state)
      });
    }
  };
}
