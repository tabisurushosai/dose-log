import type { DoseRecord } from "../core/doseLog";
import type { PremiumState } from "../core/premium";

export interface AppStorageAdapter {
  getDoseRecords(): Promise<DoseRecord[]>;
  setDoseRecords(records: readonly DoseRecord[]): Promise<void>;
  getPremiumState(): Promise<PremiumState | null>;
  setPremiumState(state: PremiumState): Promise<void>;
}
