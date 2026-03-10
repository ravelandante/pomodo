import { Action, ActionPanel, closeMainWindow, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect } from "react";
import {
  loadTimerState,
  resetTimer,
  resumeTimer,
  startTimer,
  pauseTimer,
  TIMER_DURATIONS,
  type TimerAction,
} from "./lib/timer";

const ACTION_LABELS: Record<TimerAction, string> = {
  "start-focus": "Start Focus (25 min)",
  "start-break": "Start Short Break (5 min)",
  "start-long-break": "Start Long Break (20 min)",
  pause: "Pause",
  resume: "Resume",
  reset: "Reset",
};

async function executeAction(action: TimerAction) {
  const state = loadTimerState();

  switch (action) {
    case "start-focus":
      startTimer(TIMER_DURATIONS.focus, "focus");
      await showToast({ style: Toast.Style.Success, title: "Focus timer started" });
      break;
    case "start-break":
      startTimer(TIMER_DURATIONS.break, "break");
      await showToast({ style: Toast.Style.Success, title: "Short break started" });
      break;
    case "start-long-break":
      startTimer(TIMER_DURATIONS.longBreak, "longBreak");
      await showToast({ style: Toast.Style.Success, title: "Long break started" });
      break;
    case "pause":
      if (state.remainingSeconds <= 0) return;
      pauseTimer(state.remainingSeconds);
      await showToast({ style: Toast.Style.Success, title: "Timer paused" });
      break;
    case "resume":
      if (state.remainingSeconds <= 0) return;
      resumeTimer(state.remainingSeconds, state.timerType);
      await showToast({ style: Toast.Style.Success, title: "Timer resumed" });
      break;
    case "reset":
      resetTimer();
      await showToast({ style: Toast.Style.Success, title: "Timer reset" });
      break;
  }
}

export default function Command(props: { launchContext?: { action?: TimerAction } }) {
  const contextAction = props.launchContext?.action;

  useEffect(() => {
    if (contextAction) {
      executeAction(contextAction).then(() => closeMainWindow());
    }
  }, [contextAction]);

  if (contextAction) {
    return (
      <List>
        <List.Item title="Executing…" icon={Icon.Clock} />
      </List>
    );
  }

  const state = loadTimerState();
  const hasActiveTimer = state.isRunning || state.remainingSeconds > 0;

  return (
    <List searchBarPlaceholder="Search timer actions...">
      <List.Section title="Start Timer">
        <List.Item
          title={ACTION_LABELS["start-focus"]}
          icon={Icon.Bolt}
          actions={
            <ActionPanel>
              <Action title="Start Focus" onAction={() => executeAction("start-focus")} />
            </ActionPanel>
          }
        />
        <List.Item
          title={ACTION_LABELS["start-break"]}
          icon={Icon.Heart}
          actions={
            <ActionPanel>
              <Action title="Start Break" onAction={() => executeAction("start-break")} />
            </ActionPanel>
          }
        />
        <List.Item
          title={ACTION_LABELS["start-long-break"]}
          icon={Icon.Heart}
          actions={
            <ActionPanel>
              <Action title="Start Long Break" onAction={() => executeAction("start-long-break")} />
            </ActionPanel>
          }
        />
      </List.Section>

      {hasActiveTimer && (
        <List.Section title="Timer Controls">
          {state.isRunning && (
            <List.Item
              title={ACTION_LABELS.pause}
              icon={Icon.Pause}
              actions={
                <ActionPanel>
                  <Action title="Pause" onAction={() => executeAction("pause")} />
                </ActionPanel>
              }
            />
          )}
          {!state.isRunning && state.remainingSeconds > 0 && (
            <List.Item
              title={ACTION_LABELS.resume}
              icon={Icon.PlayFilled}
              actions={
                <ActionPanel>
                  <Action title="Resume" onAction={() => executeAction("resume")} />
                </ActionPanel>
              }
            />
          )}
          <List.Item
            title={ACTION_LABELS.reset}
            icon={Icon.RotateClockwise}
            actions={
              <ActionPanel>
                <Action title="Reset" onAction={() => executeAction("reset")} />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
    </List>
  );
}
