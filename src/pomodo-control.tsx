import { Action, ActionPanel, closeMainWindow, Form, Detail, Icon, List, showToast, Toast } from "@raycast/api";
import { useState, type ReactNode } from "react";
import { useForm } from "@raycast/utils";
import {
  loadTimerState,
  resetTimer,
  resumeTimer,
  startTimer,
  pauseTimer,
  TIMER_DURATIONS,
  TIMER_LABELS,
  type TimerAction,
  type TimerType,
} from "./lib/timer";
import { saveAccomplishments } from "./lib/accomplishments";

interface AccomplishmentFormValues {
  accomplishments: string;
  learnings: string;
}

function CompletedFocusForm({ timerType, completionActions }: { timerType: TimerType; completionActions: ReactNode }) {
  const [submitted, setSubmitted] = useState(false);
  const [savedAccomplishments, setSavedAccomplishments] = useState<string[]>([]);
  const [savedLearnings, setSavedLearnings] = useState<string[]>([]);

  const { handleSubmit, itemProps } = useForm<AccomplishmentFormValues>({
    initialValues: { accomplishments: "", learnings: "" },
    async onSubmit(values) {
      const accomplishmentLines = values.accomplishments
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const learningLines = values.learnings
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await saveAccomplishments(accomplishmentLines, learningLines);
      setSavedAccomplishments(accomplishmentLines);
      setSavedLearnings(learningLines);
      setSubmitted(true);
      await showToast({ style: Toast.Style.Success, title: "Accomplishments and learnings saved" });
    },
  });

  if (submitted) {
    const label = TIMER_LABELS[timerType];
    const accomplishmentsMarkdown =
      savedAccomplishments.length > 0
        ? `\n\n**What you accomplished:**\n${savedAccomplishments.map((a) => `- ${a}`).join("\n")}`
        : "";
    const learningsMarkdown =
      savedLearnings.length > 0 ? `\n\n**Learnings:**\n${savedLearnings.map((l) => `- ${l}`).join("\n")}` : "";
    return (
      <Detail
        markdown={`# Timer Completed\n\n**${label}** session finished.${accomplishmentsMarkdown}${learningsMarkdown}`}
        actions={completionActions}
      />
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Focus session completed"
        text={`${TIMER_LABELS[timerType]} session finished. What did you accomplish?`}
      />
      <Form.TextArea
        {...itemProps.accomplishments}
        id="accomplishments"
        title="Accomplishments"
        placeholder="One item per line — press Enter to add more"
        info="What you accomplished. Separate each item with a new line."
      />
      <Form.TextArea
        {...itemProps.learnings}
        id="learnings"
        title="Learnings"
        placeholder="One item per line — press Enter to add more"
        info="What you learned. Separate each item with a new line."
      />
    </Form>
  );
}

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

export default function Command(props: {
  launchContext?: { action?: TimerAction; completed?: boolean; timerType?: TimerType };
}) {
  const completed = props.launchContext?.completed;
  const completedTimerType = props.launchContext?.timerType;

  if (completed && completedTimerType) {
    const label = TIMER_LABELS[completedTimerType];
    const primaryIsBreak = completedTimerType === "focus";
    const completionActions = (
      <ActionPanel>
        {primaryIsBreak ? (
          <>
            <Action
              title="Start Short Break"
              icon={Icon.Heart}
              onAction={() => {
                startTimer(TIMER_DURATIONS.break, "break");
                closeMainWindow();
              }}
            />
            <Action
              title="Start Focus"
              icon={Icon.Bolt}
              onAction={() => {
                startTimer(TIMER_DURATIONS.focus, "focus");
                closeMainWindow();
              }}
            />
          </>
        ) : (
          <>
            <Action
              title="Start Focus"
              icon={Icon.Bolt}
              onAction={() => {
                startTimer(TIMER_DURATIONS.focus, "focus");
                closeMainWindow();
              }}
            />
            <Action
              title="Start Short Break"
              icon={Icon.Heart}
              onAction={() => {
                startTimer(TIMER_DURATIONS.break, "break");
                closeMainWindow();
              }}
            />
          </>
        )}
        <Action
          title="Start Long Break"
          icon={Icon.Heart}
          onAction={() => {
            startTimer(TIMER_DURATIONS.longBreak, "longBreak");
            closeMainWindow();
          }}
        />
      </ActionPanel>
    );

    if (completedTimerType === "focus") {
      return <CompletedFocusForm timerType={completedTimerType} completionActions={completionActions} />;
    }

    return <Detail markdown={`# Timer Completed\n\n**${label}** session finished.`} actions={completionActions} />;
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
