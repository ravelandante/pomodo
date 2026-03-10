import { useEffect, useState } from "react";
import { Cache, Icon, MenuBarExtra } from "@raycast/api";

type TimerType = "focus" | "break" | "longBreak";

const TIMER_DURATIONS: Record<TimerType, number> = {
  focus: 25 * 60,      // 25 minutes
  break: 5 * 60,       // 5 minutes
  longBreak: 20 * 60,  // 20 minutes
};

const TIMER_LABELS: Record<TimerType, string> = {
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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Command() {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState<boolean | null>(null);
  const [timerType, setTimerType] = useState<TimerType | null>(null);
  const isLoading = remainingSeconds === null || isRunning === null;

  // Load persisted state and compute current remaining time
  useEffect(() => {
    try {
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
          setIsRunning(false);
        }
      } else {
        remaining = typeof storedRemaining === "number" ? storedRemaining : TIMER_DURATIONS[type];
      }

      setRemainingSeconds(remaining);
      setIsRunning(running);
      setTimerType(type);
    } catch {
      setRemainingSeconds(TIMER_DURATIONS.focus);
      setIsRunning(false);
      setTimerType("focus");
    }
  }, []);

  const startTimer = (duration: number) => {
    const endTs = Math.floor(Date.now() / 1000) + duration;
    cache.set(STORAGE_KEYS.endTimestamp, JSON.stringify(endTs));
    cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(duration));
    cache.set(STORAGE_KEYS.isRunning, JSON.stringify(true));
    setRemainingSeconds(duration);
    setIsRunning(true);
  };

  const startTimerByType = (type: TimerType) => {
    const duration = TIMER_DURATIONS[type];
    cache.set(STORAGE_KEYS.timerType, type);
    setTimerType(type);
    startTimer(duration);
  };

  const pauseTimer = () => {
    if (remainingSeconds === null) return;
    cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(remainingSeconds));
    cache.set(STORAGE_KEYS.isRunning, JSON.stringify(false));
    setIsRunning(false);
  };

  const resumeTimer = () => {
    if (remainingSeconds === null) return;
    startTimer(remainingSeconds);
  };

  const resetTimer = () => {
    cache.set(STORAGE_KEYS.remainingSeconds, JSON.stringify(0));
    cache.set(STORAGE_KEYS.isRunning, JSON.stringify(false));
    setRemainingSeconds(0);
    setIsRunning(false);
  };

  if (isLoading) {
    return (
      <MenuBarExtra icon={Icon.Clock} isLoading={true}>
        <MenuBarExtra.Item title="Loading…" />
      </MenuBarExtra>
    );
  }

  const displayTitle = formatTime(remainingSeconds);
  const hasActiveTimer = isRunning || remainingSeconds > 0;
  const tooltip = hasActiveTimer
    ? isRunning
      ? `${TIMER_LABELS[timerType!]}: ${displayTitle} remaining`
      : `Paused — ${displayTitle} remaining`
    : "Pomodoro timer";

  return (
    <MenuBarExtra
      icon={Icon.Clock}
      title={hasActiveTimer ? displayTitle : undefined}
      tooltip={tooltip}
    >
      {isRunning ? (
        <>
          <MenuBarExtra.Item
            title={`${TIMER_LABELS[timerType!]} — ${displayTitle}`}
            icon={Icon.Clock}
          />
          <MenuBarExtra.Separator />
          <MenuBarExtra.Item title="Pause" icon={Icon.Pause} onAction={pauseTimer} />
          <MenuBarExtra.Item title="Reset" icon={Icon.RotateClockwise} onAction={resetTimer} />
        </>
      ) : (
        <>
          {remainingSeconds! > 0 && (
            <>
              <MenuBarExtra.Item
                title="Resume"
                icon={Icon.PlayFilled}
                onAction={resumeTimer}
              />
              <MenuBarExtra.Item title="Reset" icon={Icon.RotateClockwise} onAction={resetTimer} />
              <MenuBarExtra.Separator />
            </>
          )}
          <MenuBarExtra.Item
            title={`Focus — 25 min`}
            icon={Icon.Bolt}
            onAction={() => startTimerByType("focus")}
          />
          <MenuBarExtra.Item
            title={`Short Break — 5 min`}
            icon={Icon.MugSteam}
            onAction={() => startTimerByType("break")}
          />
          <MenuBarExtra.Item
            title={`Long Break — 20 min`}
            icon={Icon.Heart}
            onAction={() => startTimerByType("longBreak")}
          />
        </>
      )}
    </MenuBarExtra>
  );
}
