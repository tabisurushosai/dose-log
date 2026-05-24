import { normalizeDoseRecords, type DoseRecord } from "../core/doseLog";
import { normalizePremiumState, type PremiumState } from "../core/premium";
import type { StorageAdapter } from "./storageAdapter";

export const APP_STORAGE_KEYS = {
  doseRecords: "doseRecords",
  premiumState: "premiumState"
} as const;

export interface AppStorage {
  getDoseRecords(): Promise<DoseRecord[]>;
  setDoseRecords(records: readonly DoseRecord[]): Promise<void>;
  getPremiumState(): Promise<PremiumState | null>;
  setPremiumState(state: PremiumState): Promise<void>;
}

export function createAppStorage(adapter: StorageAdapter): AppStorage {
  return {
    async getDoseRecords(): Promise<DoseRecord[]> {
      return normalizeDoseRecords(await adapter.read(APP_STORAGE_KEYS.doseRecords));
    },

    async setDoseRecords(records: readonly DoseRecord[]): Promise<void> {
      await adapter.write(APP_STORAGE_KEYS.doseRecords, normalizeDoseRecords(records));
    },

    async getPremiumState(): Promise<PremiumState | null> {
      const state = await adapter.read(APP_STORAGE_KEYS.premiumState);
      if (state === undefined) {
        return null;
      }

      return normalizePremiumState(state);
    },

    async setPremiumState(state: PremiumState): Promise<void> {
      await adapter.write(APP_STORAGE_KEYS.premiumState, normalizePremiumState(state));
    }
  };
}
