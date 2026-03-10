import { Cache } from "@raycast/api";

export type TimerType = "focus" | "break" | "longBreak";

export type TimerAction =
  | "start-focus"
  | "start-break"
  | "start-long-break"
  | "pause"
  | "resume"
  | "reset";

export const TIMER_DURATIONS: Record<TimerType, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 20 * 60,
};

export const TIMER_LABELS: Record<TimerType, string> = {
  focus: "Focus",
  break: "Break",
  longBreak: "Long Break",
};

const STORAGE_KEYS = {
  remainingSeconds: "pomodo-remaining-seconds",
  endTimestamp: "pomodo-end-timestamp",
  isRunning: "pomodo-is-running",
  timerType: "pomodo-timer-type",
};

const cache = new Cache({ namespace: "pomodo-timer" });

function getCached<T>(key: string, parser: (s: string) => T): T | undefined {
  const raw = cache.get(key);
  if (raw === undefined) return undefined;
  try {
    return parser(raw) as T;
  } catch {
    return undefined;
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  timerType: TimerType;
}

export function loadTimerState(): TimerState {
  const storedRemaining = getCached(STORAGE_KEYS.remainingSeconds, (s) => JSON.parse(s) as number);
  const storedEndTs = getCached(STORAGE_KEYS.endTimestamp, (s) => JSON.parse(s) as number);
  const storedIsRunning = getCached(STORAGE_KEYS.isRunning, (s) => JSON.parse(s) as boolean);
  const storedTimerType = getCached(STORAGE_KEYS.timerType, (s) => s as TimerType);

  const running = storedIsRunning ?? false;
  const type: TimerType =
    storedTimerType && ["focus", "break", "longBreak"].includes(storedTimerType)
      ? storedTimerType
      : "focus";
  let remaining: number;

  if (running && typeof storedEndTs === "number") {
    const now = Math.floor(Date.now() / 1000);
    remaining = Math.max(0, storedEndTs - now);
    if (remaining <= 0) {
      remaining = 0;
      cache.set(STORAGE_KEYS.isRunning, JSON.stringify(false));
    }
  } else {
    remaining = typeof storedRemaining === "number" ? storedRemaining : TIMER_DURATIONS[type];
  }

  return { remainingSeconds: remaining, isRunning: running, timerType: type };
}

export function startTimer(duration: number, timerType: TimerType): void {
  const endTs = Math.floor(Date.now() / 1000) + duration;
  cache.set(STORAGE_KEYS.endTimestamp, JSON.stringify(endTs));
  cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(duration));
  cache.set(STORAGE_KEYS.isRunning, JSON.stringify(true));
  cache.set(STORAGE_KEYS.timerType, timerType);
}

export function pauseTimer(remainingSeconds: number): void {
  cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(remainingSeconds));
  cache.set(STORAGE_KEYS.isRunning, JSON.stringify(false));
}

export function resumeTimer(remainingSeconds: number, timerType: TimerType): void {
  startTimer(remainingSeconds, timerType);
}

export function resetTimer(): void {
  cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(0));
  cache.set(STORAGE_KEYS.isRunning, JSON.stringify(false));
}

export function getEndTimestamp(): number | undefined {
  return getCached(STORAGE_KEYS.endTimestamp, (s) => JSON.parse(s) as number);
}

export function isTimerCompleted(): boolean {
  const endTs = getEndTimestamp();
  if (typeof endTs !== "number") return false;
  return Math.floor(Date.now() / 1000) >= endTs;
}
