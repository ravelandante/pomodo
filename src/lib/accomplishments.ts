import { Cache } from "@raycast/api";

const STORAGE_KEYS = {
  lastAccomplishments: "pomodo-last-accomplishments",
  accomplishmentsHistory: "pomodo-accomplishments-history",
};

const cache = new Cache({ namespace: "pomodo-timer" });

export interface AccomplishmentEntry {
  timestamp: number;
  accomplishments: string[];
  learnings?: string[];
}

function loadAccomplishmentEntries(): AccomplishmentEntry[] {
  const legacyRaw = cache.get(STORAGE_KEYS.lastAccomplishments);
  const historyRaw = cache.get(STORAGE_KEYS.accomplishmentsHistory);

  if (!historyRaw && legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw) as unknown;
      const items = Array.isArray(legacy) ? legacy.filter((x): x is string => typeof x === "string") : [];
      if (items.length > 0) {
        const migrated: AccomplishmentEntry[] = [{ timestamp: Date.now(), accomplishments: items, learnings: [] }];
        cache.set(STORAGE_KEYS.accomplishmentsHistory, JSON.stringify(migrated));
        cache.remove(STORAGE_KEYS.lastAccomplishments);
        return migrated;
      }
    } catch {
      // ignore
    }
  }

  if (!historyRaw) return [];

  try {
    const parsed = JSON.parse(historyRaw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is AccomplishmentEntry =>
          typeof x === "object" &&
          x !== null &&
          typeof (x as AccomplishmentEntry).timestamp === "number" &&
          Array.isArray((x as AccomplishmentEntry).accomplishments),
      )
      .map((x) => ({
        ...x,
        learnings: Array.isArray(x.learnings) ? x.learnings : [],
      }));
  } catch {
    return [];
  }
}

export function saveAccomplishments(accomplishments: string[], learnings: string[] = []): void {
  const entries = loadAccomplishmentEntries();
  entries.unshift({ timestamp: Date.now(), accomplishments, learnings });
  cache.set(STORAGE_KEYS.accomplishmentsHistory, JSON.stringify(entries));
}

export function getAccomplishmentEntries(): AccomplishmentEntry[] {
  return loadAccomplishmentEntries();
}

export function deleteAllAccomplishments(): void {
  cache.remove(STORAGE_KEYS.accomplishmentsHistory);
  cache.remove(STORAGE_KEYS.lastAccomplishments);
}

export function deleteEntry(timestamp: number): AccomplishmentEntry[] {
  const entries = loadAccomplishmentEntries().filter((e) => e.timestamp !== timestamp);
  cache.set(STORAGE_KEYS.accomplishmentsHistory, JSON.stringify(entries));
  return entries;
}

export function deleteItem(
  timestamp: number,
  type: "accomplishment" | "learning",
  index: number,
): AccomplishmentEntry[] {
  const entries = loadAccomplishmentEntries();
  const entryIndex = entries.findIndex((e) => e.timestamp === timestamp);
  if (entryIndex === -1) return entries;

  const entry = { ...entries[entryIndex] };
  if (type === "accomplishment") {
    entry.accomplishments = entry.accomplishments.filter((_, i) => i !== index);
  } else {
    entry.learnings = (entry.learnings ?? []).filter((_, i) => i !== index);
  }

  const nextEntries = entries
    .map((e, i) => (i === entryIndex ? entry : e))
    .filter((e) => e.accomplishments.length > 0 || (e.learnings?.length ?? 0) > 0);
  cache.set(STORAGE_KEYS.accomplishmentsHistory, JSON.stringify(nextEntries));
  return nextEntries;
}

export function getLastAccomplishments(): string[] {
  const entries = loadAccomplishmentEntries();
  return entries[0]?.accomplishments ?? [];
}

export function formatAccomplishmentDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const dateStr = isToday ? "Today" : date.toLocaleDateString(undefined, { dateStyle: "medium" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} at ${timeStr}`;
}
