export interface DoseRecord {
  id: string;
  takenAtIso: string;
}

export const MAX_RECORDS = 50;

export function createDoseRecord(now: Date = new Date()): DoseRecord {
  return {
    id: `tap-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    takenAtIso: now.toISOString()
  };
}

export function addDoseRecord(
  existingRecords: readonly DoseRecord[],
  record: DoseRecord,
  maxRecords: number = MAX_RECORDS
): DoseRecord[] {
  return [record, ...existingRecords]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((left, right) => Date.parse(right.takenAtIso) - Date.parse(left.takenAtIso))
    .slice(0, maxRecords);
}

export function getLatestDoseRecord(records: readonly DoseRecord[]): DoseRecord | null {
  if (records.length === 0) {
    return null;
  }

  return [...records].sort((left, right) => Date.parse(right.takenAtIso) - Date.parse(left.takenAtIso))[0];
}

export function normalizeDoseRecords(records: unknown): DoseRecord[] {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .filter((record): record is DoseRecord => {
      if (!record || typeof record !== "object") {
        return false;
      }

      const candidate = record as Partial<DoseRecord>;
      return typeof candidate.id === "string" && typeof candidate.takenAtIso === "string";
    })
    .filter((record) => Number.isFinite(Date.parse(record.takenAtIso)))
    .sort((left, right) => Date.parse(right.takenAtIso) - Date.parse(left.takenAtIso))
    .slice(0, MAX_RECORDS);
}
