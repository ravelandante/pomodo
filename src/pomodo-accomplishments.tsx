import {
  Action,
  ActionPanel,
  Alert,
  Detail,
  Icon,
  List,
  confirmAlert,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useState, type ReactNode } from "react";
import {
  getAccomplishmentEntries,
  formatAccomplishmentDate,
  deleteAllAccomplishments,
  deleteItem,
  deleteEntry,
  type AccomplishmentEntry,
} from "./lib/accomplishments";

function SessionDetail({
  entry,
  onDeleteSession,
}: {
  entry: AccomplishmentEntry;
  onDeleteSession: (timestamp: number) => void;
}) {
  const { pop } = useNavigation();

  const dateStr = formatAccomplishmentDate(entry.timestamp);
  const learnings = entry.learnings ?? [];
  const accomplishmentsMarkdown =
    entry.accomplishments.length > 0
      ? `## Accomplishments\n${entry.accomplishments.map((a) => `- ${a}`).join("\n")}`
      : "";
  const learningsMarkdown =
    learnings.length > 0 ? `\n\n## Learnings\n${learnings.map((l) => `- ${l}`).join("\n")}` : "";
  const markdown = `# ${dateStr}\n\n${accomplishmentsMarkdown}${learningsMarkdown}`;

  async function handleDeleteSession() {
    if (
      !(await confirmAlert({
        title: "Delete Session",
        message: `This will permanently remove this session's accomplishments and learnings (${dateStr}). This cannot be undone.`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      }))
    ) {
      return;
    }
    onDeleteSession(entry.timestamp);
    pop();
  }

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            icon={Icon.Trash}
            title="Delete Session"
            style={Action.Style.Destructive}
            onAction={handleDeleteSession}
          />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const [entries, setEntries] = useState(() => getAccomplishmentEntries());

  async function handleDeleteOne(timestamp: number, type: "accomplishment" | "learning", index: number) {
    const nextEntries = deleteItem(timestamp, type, index);
    setEntries(nextEntries);
    await showToast({ style: Toast.Style.Success, title: "Deleted" });
  }

  function handleDeleteSession(timestamp: number) {
    const nextEntries = deleteEntry(timestamp);
    setEntries(nextEntries);
    showToast({ style: Toast.Style.Success, title: "Session deleted" });
  }

  async function handleDeleteAll() {
    if (
      !(await confirmAlert({
        title: "Delete All Accomplishments",
        message: "This will permanently remove all your accomplishments. This action cannot be undone.",
        primaryAction: {
          title: "Delete All",
          style: Alert.ActionStyle.Destructive,
        },
      }))
    ) {
      return;
    }
    deleteAllAccomplishments();
    setEntries([]);
    await showToast({ style: Toast.Style.Success, title: "All accomplishments deleted" });
  }

  if (entries.length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.CheckCircle}
          title="No accomplishments yet"
          description="Complete a focus session and log your accomplishments to see them here."
        />
      </List>
    );
  }

  return (
    <List>
      {entries.flatMap((entry) => {
        const timestamp = entry.timestamp;
        const dateStr = formatAccomplishmentDate(timestamp);
        const learnings = entry.learnings ?? [];
        const sections: ReactNode[] = [];

        if (entry.accomplishments.length > 0) {
          sections.push(
            <List.Section key={`${timestamp}-acc`} title={`${dateStr} — Accomplishments`}>
              {entry.accomplishments.map((accomplishment, index) => (
                <List.Item
                  key={`${timestamp}-acc-${index}`}
                  icon={Icon.Checkmark}
                  title={accomplishment}
                  actions={
                    <ActionPanel>
                      <Action.Push
                        icon={Icon.Eye}
                        title="View Session"
                        target={<SessionDetail entry={entry} onDeleteSession={handleDeleteSession} />}
                      />
                      <Action
                        icon={Icon.Trash}
                        title="Delete"
                        style={Action.Style.Destructive}
                        onAction={() => handleDeleteOne(timestamp, "accomplishment", index)}
                      />
                      <Action
                        icon={Icon.Trash}
                        title="Delete All"
                        style={Action.Style.Destructive}
                        onAction={handleDeleteAll}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>,
          );
        }

        if (learnings.length > 0) {
          sections.push(
            <List.Section key={`${timestamp}-learn`} title={`${dateStr} — Learnings`}>
              {learnings.map((learning, index) => (
                <List.Item
                  key={`${timestamp}-learn-${index}`}
                  icon={Icon.LightBulb}
                  title={learning}
                  actions={
                    <ActionPanel>
                      <Action.Push
                        icon={Icon.Eye}
                        title="View Session"
                        target={<SessionDetail entry={entry} onDeleteSession={handleDeleteSession} />}
                      />
                      <Action
                        icon={Icon.Trash}
                        title="Delete"
                        style={Action.Style.Destructive}
                        onAction={() => handleDeleteOne(timestamp, "learning", index)}
                      />
                      <Action
                        icon={Icon.Trash}
                        title="Delete All"
                        style={Action.Style.Destructive}
                        onAction={handleDeleteAll}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>,
          );
        }

        return sections;
      })}
    </List>
  );
}
