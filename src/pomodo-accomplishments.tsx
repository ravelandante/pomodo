import {
  Action,
  ActionPanel,
  Alert,
  Icon,
  List,
  confirmAlert,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, type ReactNode } from "react";
import {
  getAccomplishmentEntries,
  formatAccomplishmentDate,
  deleteAllAccomplishments,
} from "./lib/accomplishments";

export default function Command() {
  const [entries, setEntries] = useState(() => getAccomplishmentEntries());

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
                      <Action
                        icon={Icon.Trash}
                        title="Delete All Accomplishments"
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
                      <Action
                        icon={Icon.Trash}
                        title="Delete All Accomplishments"
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
