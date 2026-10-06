@echo off
setlocal

set "PLUGIN_SOURCE=%~dp0src\FakeDeafen.ts"
set "VENCORD_DIR=%USERPROFILE%\Desktop\Vencord"
if not "%~1"=="" set "VENCORD_DIR=%~1"

where git >nul 2>&1
if errorlevel 1 (
    where winget >nul 2>&1
    if errorlevel 1 (
        echo Git is missing and winget is not available. Install Git for Windows, then run this installer again.
        exit /b 1
    )
    echo Git was not found. Attempting to install Git for Windows with winget...
    winget install --id Git.Git --exact --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo Git installation failed. Install Git for Windows manually, then run this installer again.
        exit /b 1
    )
    set "PATH=%ProgramFiles%\Git\cmd;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
    where git >nul 2>&1
    if errorlevel 1 (
        echo Git was installed but could not be found. Restart CMD and run this installer again.
        exit /b 1
    )
)

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js is required. Install Node.js, then run this installer again.
    exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
    echo pnpm is required. Enable Corepack or install pnpm, then run this installer again.
    exit /b 1
)

if not exist "%VENCORD_DIR%\.git" (
    if exist "%VENCORD_DIR%" (
        echo The target folder exists but is not a Git checkout: "%VENCORD_DIR%"
        exit /b 1
    )
    git clone https://github.com/Vendicated/Vencord.git "%VENCORD_DIR%"
    if errorlevel 1 exit /b 1
)

if not exist "%VENCORD_DIR%\package.json" (
    echo Could not find Vencord's package.json at "%VENCORD_DIR%".
    exit /b 1
)

if not exist "%VENCORD_DIR%\src\userplugins" mkdir "%VENCORD_DIR%\src\userplugins"
if errorlevel 1 exit /b 1

copy /Y "%PLUGIN_SOURCE%" "%VENCORD_DIR%\src\userplugins\FakeDeafen.ts"
if errorlevel 1 exit /b 1

pushd "%VENCORD_DIR%"
call pnpm install --frozen-lockfile
if errorlevel 1 (
    popd
    exit /b 1
)

call pnpm build
if errorlevel 1 (
    popd
    exit /b 1
)

call pnpm inject
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%