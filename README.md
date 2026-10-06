# FakeDeafen

Userplugin for Vencord that changes the mute/deafen flags sent in Discord voice-state updates. With fake deafen enabled, other participants can see you as deafened while your local playback remains active.

## Features

- Fake mute and fake deafen settings, enabled by default.
- Optional account-area button.
- `Ctrl+Shift+Q` toggle, enabled by default.
- Voice settings context-menu toggle.

The fake mute setting does not mute your microphone locally. If it is enabled, you may still transmit audio while Discord displays you as muted. Fake deafen is also a client-state spoof and may violate Discord's Terms of Service; use at your own risk.

## Install

Requirements: Windows, Git, Node.js, and pnpm. Clone or save this project to `%USERPROFILE%\Desktop\Vencord-FakeDeafen`, then run `install.cmd`. The installer clones the official Vencord source into `%USERPROFILE%\Desktop\Vencord` if it is missing, installs dependencies, creates `src\userplugins` if needed, copies the plugin, builds Vencord, and runs its installer. You can pass a different Vencord path as an argument to `install.cmd`.

The complete setup can also be run from one CMD block. If you saved this project somewhere else, update `PLUGIN_DIR` first. Git, Node.js, and pnpm must already be installed.

```cmd
set "PLUGIN_DIR=%USERPROFILE%\Desktop\Vencord-FakeDeafen"
set "VENCORD_DIR=%USERPROFILE%\Desktop\Vencord"
if not exist "%PLUGIN_DIR%\.git" git clone https://github.com/Malekzn30/tktkaishduoabfjokxcnv.git "%PLUGIN_DIR%"
if exist "%PLUGIN_DIR%\install.cmd" call "%PLUGIN_DIR%\install.cmd" "%VENCORD_DIR%"
if not exist "%PLUGIN_DIR%\install.cmd" echo ERROR: the plugin download failed. Check your internet connection and Git installation.
pause
```

Restart Discord after injection. Find the plugin under **Settings > Plugins > FakeDeafen**. The account-area button can be enabled in the plugin settings; changing that option requires a restart.

## Source

Adapted from [hyyven/Vencord-FakeDeafen](https://github.com/hyyven/Vencord-FakeDeafen). This project is not affiliated with Discord, Vencord, or Equicord.