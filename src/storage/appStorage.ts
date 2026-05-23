import { normalizeDoseRecords, type DoseRecord } from "../core/doseLog";
import { normalizePremiumState, type PremiumState } from "../core/premium";
import { STORAGE_KEYS, type StorageAdapter } from "./storageAdapter";

export interface AppStorage {
  getDoseRecords(): Promise<DoseRecord[]>;
  setDoseRecords(records: readonly DoseRecord[]): Promise<void>;
  getPremiumState(): Promise<PremiumState | null>;
  setPremiumState(state: PremiumState): Promise<void>;
}

export function createAppStorage(adapter: StorageAdapter): AppStorage {
  return {
    async getDoseRecords(): Promise<DoseRecord[]> {
      return normalizeDoseRecords(await adapter.get(STORAGE_KEYS.doseRecords));
    },

    async setDoseRecords(records: readonly DoseRecord[]): Promise<void> {
      await adapter.set(STORAGE_KEYS.doseRecords, normalizeDoseRecords(records));
    },

    async getPremiumState(): Promise<PremiumState | null> {
      const state = await adapter.get(STORAGE_KEYS.premiumState);
      if (state === undefined) {
        return null;
      }

      return normalizePremiumState(state);
    },

    async setPremiumState(state: PremiumState): Promise<void> {
      await adapter.set(STORAGE_KEYS.premiumState, normalizePremiumState(state));
    }
  };
}
