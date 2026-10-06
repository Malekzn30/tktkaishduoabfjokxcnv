import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findComponentByCodeLazy, findStoreLazy } from "@webpack";
import { Menu, React } from "@webpack/common";

const settings = definePluginSettings({
    fakeMute: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Appear muted to others while Fake Deafen is enabled"
    },
    fakeDeafen: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Appear deafened to others while Fake Deafen is enabled"
    },
    showButton: {
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true,
        description: "Show the Fake Deafen button in the account area"
    },
    enableKeybind: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Enable Ctrl+Shift+Q to toggle Fake Deafen"
    }
});

const GatewaySocket = findByPropsLazy("getSocket");
const MediaEngineStore = findByPropsLazy("isDeaf", "isMute");
const ChannelStore = findStoreLazy("ChannelStore");
const SelectedChannelStore = findStoreLazy("SelectedChannelStore");
const Button = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");
let enabled = false;
let originalSend: Function | undefined;

function toggleFakeDeafen() {
    enabled = !enabled;
    publishVoiceState();
}

function publishVoiceState() {
    const channelId = SelectedChannelStore.getVoiceChannelId();
    const socket = GatewaySocket.getSocket();
    if (!channelId || !socket) return;

    const channel = ChannelStore.getChannel(channelId);
    socket.send(4, {
        guild_id: channel?.guild_id ?? null,
        channel_id: channelId,
        self_mute: (enabled && settings.store.fakeMute) || (MediaEngineStore.isMute() ?? false),
        self_deaf: (enabled && settings.store.fakeDeafen) || (MediaEngineStore.isDeaf() ?? false),
        self_video: false,
        flags: 0
    });
}

function handleKeyDown(event: KeyboardEvent) {
    if (settings.store.enableKeybind && event.ctrlKey && event.shiftKey && event.code === "KeyQ") {
        event.preventDefault();
        toggleFakeDeafen();
    }
}

function FakeDeafenButton(props: { nameplate?: unknown; }) {
    return React.createElement(Button, {
        tooltipText: enabled ? "Disable Fake Deafen" : "Enable Fake Deafen",
        icon: () => React.createElement("span", { "aria-hidden": true }, enabled ? "D" : "V"),
        role: "switch",
        "aria-checked": enabled,
        redGlow: enabled,
        plated: props.nameplate != null,
        onClick: toggleFakeDeafen
    });
}

export default definePlugin({
    name: "FakeDeafen",
    description: "Spoof your mute and deafen state to other users.",
    authors: [{ id: 449282863582412850n, name: "hyyven" }],
    settings,

    patches: [
        {
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            predicate: () => settings.store.showButton,
            replacement: {
                match: /children:\[(?=[^}]*accountContainerRef)/,
                replace: "children:[$self.FakeDeafenButton(arguments[0]),"
            }
        }
    ],

    contextMenus: {
        "audio-device-context"(children) {
            children.push(
                React.createElement(Menu.MenuSeparator),
                React.createElement(Menu.MenuCheckboxItem, {
                    id: "vc-fake-deafen",
                    label: "Fake Deafen",
                    checked: enabled,
                    action: toggleFakeDeafen
                })
            );
        }
    },

    start() {
        const socket = GatewaySocket.getSocket();
        if (!socket) {
            console.error("[FakeDeafen] Gateway socket not found");
            return;
        }

        originalSend = socket.send;
        socket.send = function (op: number, data: any, ...args: any[]) {
            if (op === 4 && enabled && data) {
                data = {
                    ...data,
                    self_mute: settings.store.fakeMute || (MediaEngineStore.isMute() ?? false),
                    self_deaf: settings.store.fakeDeafen || (MediaEngineStore.isDeaf() ?? false)
                };
            }
            return originalSend!.apply(this, [op, data, ...args]);
        };

        window.addEventListener("keydown", handleKeyDown);
    },

    stop() {
        const socket = GatewaySocket.getSocket();
        if (socket && originalSend) socket.send = originalSend;
        originalSend = undefined;
        window.removeEventListener("keydown", handleKeyDown);
        enabled = false;
    },

    FakeDeafenButton: ErrorBoundary.wrap(FakeDeafenButton, { noop: true })
});