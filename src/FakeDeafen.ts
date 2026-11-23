import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy, findComponentByCodeLazy, findStoreLazy } from "@webpack";
import { Menu, PermissionStore, PermissionsBits, React, showToast, UserStore } from "@webpack/common";

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
    },
    followUserId: {
        type: OptionType.STRING,
        default: "",
        hidden: true,
        description: "User followed from their context menu"
    },
    joinOnFollow: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Join the followed user's current voice channel when selecting Follow User"
    },
    followVoiceChanges: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "Automatically join when the followed user changes voice channels"
    },
    disconnectWhenUserLeaves: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Disconnect when the followed user leaves their voice channel"
    }
});

const GatewaySocket = findByPropsLazy("getSocket");
const ChannelActions = findByPropsLazy("disconnect", "selectVoiceChannel");
const MediaEngineStore = findByPropsLazy("isDeaf", "isMute");
const ChannelStore = findStoreLazy("ChannelStore");
const SelectedChannelStore = findStoreLazy("SelectedChannelStore");
const VoiceStateStore = findStoreLazy("VoiceStateStore");
const Button = findComponentByCodeLazy(".GREEN,positionKeyStemOverride:");
const CONNECT = 1n << 20n;
let enabled = false;
let originalSend: Function | undefined;

function getUserVoiceChannel(userId: string): string | null {
    if (!userId) return null;

    const states = VoiceStateStore.getAllVoiceStates();
    for (const users of Object.values(states)) {
        if (users[userId]) return users[userId].channelId ?? null;
    }

    return null;
}

function followUser(channelId = getUserVoiceChannel(settings.store.followUserId)) {
    if (!settings.store.followUserId) return;

    const currentChannelId = SelectedChannelStore.getVoiceChannelId();
    if (!channelId) {
        if (currentChannelId && settings.store.disconnectWhenUserLeaves) {
            ChannelActions.disconnect();
            showToast({ text: "Followed user left; disconnected", variant: "success" });
        } else {
            showToast({ text: "Followed user is not in a voice channel", variant: "critical" });
        }
        return;
    }

    if (channelId === currentChannelId) return;

    const channel = ChannelStore.getChannel(channelId);
    if (!channel || (channel.type !== 1 && !PermissionStore.can(CONNECT, channel))) {
        showToast({ text: "Insufficient permissions to join that voice channel", variant: "critical" });
        return;
    }

    const voiceStates = VoiceStateStore.getVoiceStatesForChannel(channelId);
    const memberCount = voiceStates ? Object.keys(voiceStates).length : null;
    if (
        channel.userLimit !== 0 &&
        memberCount !== null &&
        memberCount >= channel.userLimit &&
        !PermissionStore.can(PermissionsBits.MOVE_MEMBERS, channel)
    ) {
        showToast({ text: "Voice channel is full", variant: "critical" });
        return;
    }

    ChannelActions.selectVoiceChannel(channelId);
    showToast({ text: "Joined the followed user's voice channel", variant: "success" });
}

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
        "user-context"(children, { user }) {
            if (!user || user.id === UserStore.getCurrentUser().id) return;

            const isFollowed = settings.store.followUserId === user.id;
            const items = [
                React.createElement(Menu.MenuItem, {
                    id: "fake-deafen-follow-user",
                    label: isFollowed ? "Go to user's voice channel" : "Follow User",
                    action: () => {
                        if (isFollowed) {
                            followUser();
                        } else {
                            settings.store.followUserId = user.id;
                            if (settings.store.joinOnFollow) followUser();
                        }
                    }
                })
            ];

            if (isFollowed) {
                items.push(React.createElement(Menu.MenuItem, {
                    id: "fake-deafen-unfollow-user",
                    label: "Unfollow User",
                    action: () => { settings.store.followUserId = ""; }
                }));
            }

            children.splice(-1, 0, React.createElement(Menu.MenuGroup, { key: "fake-deafen-follow-user" }, ...items));
        },
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

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: Array<{ userId: string; channelId?: string; oldChannelId?: string; }>; }) {
            if (!settings.store.followVoiceChanges || !settings.store.followUserId) return;

            for (const { userId, channelId, oldChannelId } of voiceStates) {
                if (userId !== settings.store.followUserId || channelId === oldChannelId) continue;
                if (channelId) {
                    followUser(channelId);
                } else if (settings.store.disconnectWhenUserLeaves) {
                    followUser(null);
                }
            }
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