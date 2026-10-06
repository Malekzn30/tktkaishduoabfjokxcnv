# FakeDeafen

Userplugin for Vencord that changes the mute/deafen flags sent in Discord voice-state updates. With fake deafen enabled, other participants can see you as deafened while your local playback remains active.

## Features

- Fake mute and fake deafen settings, enabled by default.
- Optional account-area button.
- `Ctrl+Shift+Q` toggle, enabled by default.
- Voice settings context-menu toggle.

The fake mute setting does not mute your microphone locally. If it is enabled, you may still transmit audio while Discord displays you as muted. Fake deafen is also a client-state spoof and may violate Discord's Terms of Service; use at your own risk.

## Install

Requirements: Windows, an existing Vencord source checkout, Node.js, and pnpm. Save or clone this project to `%USERPROFILE%\Desktop\Vencord-FakeDeafen`, then run `install.cmd` and enter the path to your Vencord folder when prompted. The installer creates `src\userplugins` when missing, copies the plugin there, then runs the build and installer.

The equivalent commands in one CMD block are below. If you saved this project somewhere else, update `PLUGIN_DIR` first.

```cmd
set "PLUGIN_DIR=%USERPROFILE%\Desktop\Vencord-FakeDeafen"
set "VENCORD_DIR=%USERPROFILE%\Desktop\Vencord"
if not exist "%VENCORD_DIR%\src\userplugins" mkdir "%VENCORD_DIR%\src\userplugins"
copy /Y "%PLUGIN_DIR%\src\FakeDeafen.ts" "%VENCORD_DIR%\src\userplugins\FakeDeafen.ts"
cd /d "%VENCORD_DIR%"
pnpm build
if errorlevel 1 exit /b 1
pnpm inject
```

Restart Discord after injection. Find the plugin under **Settings > Plugins > FakeDeafen**. The account-area button can be enabled in the plugin settings; changing that option requires a restart.

## Source

Adapted from [hyyven/Vencord-FakeDeafen](https://github.com/hyyven/Vencord-FakeDeafen). This project is not affiliated with Discord, Vencord, or Equicord.