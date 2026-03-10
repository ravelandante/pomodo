import { launchCommand, LaunchType } from "@raycast/api";

const DND_EXTENSION = {
  name: "do-not-disturb",
  owner: "yakitrak",
} as const;

// requires the extension to be installed: https://github.com/raycast/extensions/tree/main/extensions/do-not-disturb
export function enableDoNotDisturb(): void {
  launchCommand({
    name: "on",
    type: LaunchType.Background,
    extensionName: DND_EXTENSION.name,
    ownerOrAuthorName: DND_EXTENSION.owner,
    context: { suppressHUD: true },
  }).catch(() => {});
}

export function disableDoNotDisturb(): void {
  launchCommand({
    name: "off",
    type: LaunchType.Background,
    extensionName: DND_EXTENSION.name,
    ownerOrAuthorName: DND_EXTENSION.owner,
    context: { suppressHUD: true },
  }).catch(() => {});
}
