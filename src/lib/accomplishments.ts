import { LocalStorage } from "@raycast/api";

const STORAGE_KEY = "pomodo-accomplishments-history";

export interface AccomplishmentEntry {
  timestamp: number;
  accomplishments: string[];
  learnings?: string[];
}

async function loadAccomplishmentEntries(): Promise<AccomplishmentEntry[]> {
  const historyRaw = await LocalStorage.getItem<string>(STORAGE_KEY);
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

export async function saveAccomplishments(accomplishments: string[], learnings: string[] = []): Promise<void> {
  const entries = await loadAccomplishmentEntries();
  entries.unshift({ timestamp: Date.now(), accomplishments, learnings });
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getAccomplishmentEntries(): Promise<AccomplishmentEntry[]> {
  return loadAccomplishmentEntries();
}

export async function deleteAllAccomplishments(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEY);
}

export async function deleteEntry(timestamp: number): Promise<AccomplishmentEntry[]> {
  const entries = (await loadAccomplishmentEntries()).filter((e) => e.timestamp !== timestamp);
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entries;
}

export async function deleteItem(
  timestamp: number,
  type: "accomplishment" | "learning",
  index: number,
): Promise<AccomplishmentEntry[]> {
  const entries = await loadAccomplishmentEntries();
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
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  return nextEntries;
}

export async function getLastAccomplishments(): Promise<string[]> {
  const entries = await loadAccomplishmentEntries();
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
