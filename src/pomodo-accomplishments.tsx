import { Icon, List } from "@raycast/api";
import { getAccomplishmentEntries, formatAccomplishmentDate } from "./lib/timer";

export default function Command() {
  const entries = getAccomplishmentEntries();

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
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
