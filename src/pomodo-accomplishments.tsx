import { Icon, List } from "@raycast/api";
import { getLastAccomplishments } from "./lib/timer";

export default function Command() {
  const accomplishments = getLastAccomplishments();

  if (accomplishments.length === 0) {
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
      <List.Section title="Latest accomplishments">
        {accomplishments.map((accomplishment, index) => (
          <List.Item key={index} icon={Icon.Checkmark} title={accomplishment} />
        ))}
      </List.Section>
    </List>
  );
}
