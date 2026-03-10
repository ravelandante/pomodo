import { useEffect, useState } from "react";
import { Icon, launchCommand, LaunchType, MenuBarExtra, showToast, Toast } from "@raycast/api";
import {
  loadTimerState,
  formatTime,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  TIMER_LABELS,
  TIMER_DURATIONS,
} from "./lib/timer";

export default function Command() {
  const [state, setState] = useState<ReturnType<typeof loadTimerState> | null>(null);
  const isLoading = state === null;

  useEffect(() => {
    const loaded = loadTimerState();
    setState(loaded);

    if (loaded.isRunning && loaded.remainingSeconds <= 0) {
      showToast({
        style: Toast.Style.Success,
        title: "Timer Completed",
        message: `${TIMER_LABELS[loaded.timerType]} session finished`,
      });
    }
  }, []);

  useEffect(() => {
    if (!state?.isRunning) return;

    const interval = setInterval(() => {
      const loaded = loadTimerState();
      if (loaded.remainingSeconds <= 0) {
        setState(loaded);
        showToast({
          style: Toast.Style.Success,
          title: "Timer Completed",
          message: `${TIMER_LABELS[loaded.timerType]} session finished`,
        });
      } else {
        setState(loaded);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isRunning]);

  const refreshMenuBar = () => {
    setTimeout(() => {
      launchCommand({ name: "pomodo", type: LaunchType.Background }).catch(() => {});
    }, 400);
  };

  const handleStartFocus = () => {
    startTimer(TIMER_DURATIONS.focus, "focus");
    setState(loadTimerState());
    refreshMenuBar();
  };

  const handleStartBreak = () => {
    startTimer(TIMER_DURATIONS.break, "break");
    setState(loadTimerState());
    refreshMenuBar();
  };

  const handleStartLongBreak = () => {
    startTimer(TIMER_DURATIONS.longBreak, "longBreak");
    setState(loadTimerState());
    refreshMenuBar();
  };

  const handlePause = () => {
    pauseTimer(state!.remainingSeconds);
    setState(loadTimerState());
    refreshMenuBar();
  };

  const handleResume = () => {
    resumeTimer(state!.remainingSeconds, state!.timerType);
    setState(loadTimerState());
    refreshMenuBar();
  };

  const handleReset = () => {
    resetTimer();
    setState(loadTimerState());
    refreshMenuBar();
  };

  if (isLoading) {
    return (
      <MenuBarExtra icon={Icon.Clock} isLoading={true}>
        <MenuBarExtra.Item title="Loading…" />
      </MenuBarExtra>
    );
  }

  const displayTitle = formatTime(state!.remainingSeconds);
  const hasActiveTimer = state!.isRunning || state!.remainingSeconds > 0;
  const tooltip = hasActiveTimer
    ? state!.isRunning
      ? `${TIMER_LABELS[state!.timerType]}: ${displayTitle} remaining`
      : `Paused — ${displayTitle} remaining`
    : "Pomodoro timer";

  return (
    <MenuBarExtra
      icon={Icon.Clock}
      title={hasActiveTimer ? displayTitle : undefined}
      tooltip={tooltip}
    >
      {state!.isRunning ? (
        <>
          <MenuBarExtra.Item
            title={`${TIMER_LABELS[state!.timerType]} — ${displayTitle}`}
            icon={Icon.Clock}
          />
          <MenuBarExtra.Separator />
          <MenuBarExtra.Item title="Pause" icon={Icon.Pause} onAction={handlePause} />
          <MenuBarExtra.Item title="Reset" icon={Icon.RotateClockwise} onAction={handleReset} />
        </>
      ) : (
        <>
          {state!.remainingSeconds > 0 && (
            <>
              <MenuBarExtra.Item title="Resume" icon={Icon.PlayFilled} onAction={handleResume} />
              <MenuBarExtra.Item title="Reset" icon={Icon.RotateClockwise} onAction={handleReset} />
              <MenuBarExtra.Separator />
            </>
          )}
          <MenuBarExtra.Item
            title={`Focus — ${TIMER_DURATIONS.focus / 60} min`}
            icon={Icon.Bolt}
            onAction={handleStartFocus}
          />
          <MenuBarExtra.Item
            title={`Short Break — ${TIMER_DURATIONS.break / 60} min`}
            icon={Icon.MugSteam}
            onAction={handleStartBreak}
          />
          <MenuBarExtra.Item
            title={`Long Break — ${TIMER_DURATIONS.longBreak / 60} min`}
            icon={Icon.Heart}
            onAction={handleStartLongBreak}
          />
        </>
      )}
    </MenuBarExtra>
  );
}
