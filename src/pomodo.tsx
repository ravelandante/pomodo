import { useEffect, useState } from "react";
import { Icon, LocalStorage, MenuBarExtra } from "@raycast/api";

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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Command() {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(TIMER_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [timerType, setTimerType] = useState<TimerType>("focus");
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted state and compute current remaining time
  useEffect(() => {
    (async () => {
      try {
        const [storedRemaining, storedEndTs, storedIsRunning, storedTimerType] = await Promise.all([
          LocalStorage.getItem<number>(STORAGE_KEYS.remainingSeconds),
          LocalStorage.getItem<number>(STORAGE_KEYS.endTimestamp),
          LocalStorage.getItem<boolean>(STORAGE_KEYS.isRunning),
          LocalStorage.getItem<TimerType>(STORAGE_KEYS.timerType),
        ]);

        const running = storedIsRunning ?? false;
        const type = storedTimerType ?? "focus";
        let remaining: number;

        if (running && typeof storedEndTs === "number") {
          const now = Math.floor(Date.now() / 1000);
          remaining = Math.max(0, storedEndTs - now);
          if (remaining <= 0) {
            remaining = 0;
            await LocalStorage.setItem(STORAGE_KEYS.isRunning, false);
            setIsRunning(false);
          }
        } else {
          remaining = typeof storedRemaining === "number" ? storedRemaining : TIMER_DURATIONS[type];
        }

        setRemainingSeconds(remaining);
        setIsRunning(running);
        setTimerType(type);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const startTimer = async (duration: number) => {
    const endTs = Math.floor(Date.now() / 1000) + duration;
    await Promise.all([
      LocalStorage.setItem(STORAGE_KEYS.endTimestamp, endTs),
      LocalStorage.setItem(STORAGE_KEYS.remainingSeconds, duration),
      LocalStorage.setItem(STORAGE_KEYS.isRunning, true),
    ]);
    setRemainingSeconds(duration);
    setIsRunning(true);
  };

  const startTimerByType = async (type: TimerType) => {
    const duration = TIMER_DURATIONS[type];
    await LocalStorage.setItem(STORAGE_KEYS.timerType, type);
    setTimerType(type);
    await startTimer(duration);
  };

  const pauseTimer = async () => {
    await Promise.all([
      LocalStorage.setItem(STORAGE_KEYS.remainingSeconds, remainingSeconds),
      LocalStorage.setItem(STORAGE_KEYS.isRunning, false),
    ]);
    setIsRunning(false);
  };

  const resumeTimer = async () => {
    await startTimer(remainingSeconds);
  };

  const resetTimer = async () => {
    await Promise.all([
      LocalStorage.setItem(STORAGE_KEYS.remainingSeconds, 0),
      LocalStorage.setItem(STORAGE_KEYS.isRunning, false),
    ]);
    setRemainingSeconds(0);
    setIsRunning(false);
  };

  const displayTitle = formatTime(remainingSeconds);
  const hasActiveTimer = isRunning || remainingSeconds > 0;
  const tooltip = hasActiveTimer
    ? isRunning
      ? `${TIMER_LABELS[timerType]}: ${displayTitle} remaining`
      : `Paused — ${displayTitle} remaining`
    : "Pomodoro timer";

  return (
    <MenuBarExtra
      icon={Icon.Clock}
      title={hasActiveTimer ? displayTitle : undefined}
      tooltip={tooltip}
      isLoading={isLoading}
    >
      {isRunning ? (
        <>
          <MenuBarExtra.Item
            title={`${TIMER_LABELS[timerType]} — ${displayTitle}`}
            icon={Icon.Clock}
          />
          <MenuBarExtra.Separator />
          <MenuBarExtra.Item title="Pause" icon={Icon.Pause} onAction={pauseTimer} />
          <MenuBarExtra.Item title="Reset" icon={Icon.RotateClockwise} onAction={resetTimer} />
        </>
      ) : (
        <>
          {remainingSeconds > 0 && (
            <>
              <MenuBarExtra.Item
                title={"Resume"}
                icon={Icon.PlayFilled}
                onAction={resumeTimer}
              />
              <MenuBarExtra.Separator />
            </>
          )}
          <MenuBarExtra.Item
            title={`Focus — 25 min`}
            icon={Icon.Bolt}
            onAction={() => startTimerByType("focus")}
          />
          <MenuBarExtra.Item
            title={`Break — 5 min`}
            icon={Icon.Heart}
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
