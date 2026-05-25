import { isFiniteDateString } from "./dateString";

export interface DoseRecord {
  id: string;
  takenAtIso: string;
}

export const MAX_RECORDS = 50;

function compareDoseRecordsByTakenAtDesc(left: DoseRecord, right: DoseRecord): number {
  return Date.parse(right.takenAtIso) - Date.parse(left.takenAtIso);
}

function sortDoseRecordsByTakenAtDesc(records: readonly DoseRecord[]): DoseRecord[] {
  return [...records].sort(compareDoseRecordsByTakenAtDesc);
}

function limitDoseRecords(records: readonly DoseRecord[], maxRecords: number = MAX_RECORDS): DoseRecord[] {
  return sortDoseRecordsByTakenAtDesc(records).slice(0, maxRecords);
}

function isDoseRecord(record: unknown): record is DoseRecord {
  if (!record || typeof record !== "object") {
    return false;
  }

  const candidate = record as Record<string, unknown>;
  return typeof candidate["id"] === "string" && isFiniteDateString(candidate["takenAtIso"]);
}

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
  const uniqueRecords = [record, ...existingRecords].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index
  );
  return limitDoseRecords(uniqueRecords, maxRecords);
}

export function getLatestDoseRecord(records: readonly DoseRecord[]): DoseRecord | null {
  if (records.length === 0) {
    return null;
  }

  const [latestRecord] = sortDoseRecordsByTakenAtDesc(records);
  return latestRecord ?? null;
}

export function normalizeDoseRecords(records: unknown): DoseRecord[] {
  if (!Array.isArray(records)) {
    return [];
  }

  return limitDoseRecords(records.filter(isDoseRecord));
}
