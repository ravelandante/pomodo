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
import { useState } from "react";
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
      {entries.map((entry) => (
        <List.Section key={entry.timestamp} title={formatAccomplishmentDate(entry.timestamp)}>
          {entry.accomplishments.map((accomplishment, index) => (
            <List.Item
              key={`${entry.timestamp}-${index}`}
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
        </List.Section>
      ))}
    </List>
  );
}
