import { useEffect, useState } from "react";
import { Icon, launchCommand, LaunchType, MenuBarExtra } from "@raycast/api";
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
      resetTimer();
      launchCommand({
        name: "pomodo-control",
        type: LaunchType.UserInitiated,
        context: { completed: true, timerType: loaded.timerType },
      });
    }
  }, []);

  useEffect(() => {
    if (!state?.isRunning) return;

    const interval = setInterval(() => {
      const loaded = loadTimerState();
      if (loaded.remainingSeconds <= 0) {
        setState(loaded);
        resetTimer();
        launchCommand({
          name: "pomodo-control",
          type: LaunchType.UserInitiated,
          context: { completed: true, timerType: loaded.timerType },
        });
      } else {
        setState(loaded);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.isRunning]);

  const handleStartFocus = () => {
    startTimer(TIMER_DURATIONS.focus, "focus");
    setState(loadTimerState());
  };

  const handleStartBreak = () => {
    startTimer(TIMER_DURATIONS.break, "break");
    setState(loadTimerState());
  };

  const handleStartLongBreak = () => {
    startTimer(TIMER_DURATIONS.longBreak, "longBreak");
    setState(loadTimerState());
  };

  const handlePause = () => {
    pauseTimer(state!.remainingSeconds);
    setState(loadTimerState());
  };

  const handleResume = () => {
    resumeTimer(state!.remainingSeconds, state!.timerType);
    setState(loadTimerState());
  };

  const handleReset = () => {
    resetTimer();
    setState(loadTimerState());
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
