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
        goto :fail
    )
    echo Git was not found. Attempting to install Git for Windows with winget...
    winget install --id Git.Git --exact --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo Git installation failed. Install Git for Windows manually, then run this installer again.
        goto :fail
    )
    set "PATH=%ProgramFiles%\Git\cmd;%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
    where git >nul 2>&1
    if errorlevel 1 (
        echo Git was installed but could not be found. Restart CMD and run this installer again.
        goto :fail
    )
)

where node >nul 2>&1
if errorlevel 1 (
    where winget >nul 2>&1
    if errorlevel 1 (
        echo Node.js is missing and winget is not available. Install Node.js LTS, then run this installer again.
        goto :fail
    )
    echo Node.js was not found. Attempting to install Node.js LTS with winget...
    winget install --id OpenJS.NodeJS.LTS --exact --silent --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo Node.js installation failed. Install Node.js LTS manually, then run this installer again.
        goto :fail
    )
    set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    where node >nul 2>&1
    if errorlevel 1 (
        echo Node.js was installed but could not be found. Restart CMD and run this installer again.
        goto :fail
    )
)

where npm >nul 2>&1
if errorlevel 1 (
    echo npm was not found. Reinstall Node.js LTS, then run this installer again.
    goto :fail
)

pnpm --version 2>nul | findstr /x "11.9.0" >nul
if errorlevel 1 (
    echo Installing the pnpm version required by Vencord (11.9.0)...
    call npm install --global pnpm@11.9.0
    if errorlevel 1 (
        echo pnpm installation failed. Check your internet connection and npm permissions.
        goto :fail
    )
    set "PATH=%APPDATA%\npm;%PATH%"
    pnpm --version 2>nul | findstr /x "11.9.0" >nul
    if errorlevel 1 (
        echo pnpm 11.9.0 was installed but is not available in PATH. Restart CMD and run this installer again.
        goto :fail
    )
)

if not exist "%VENCORD_DIR%\.git" (
    if exist "%VENCORD_DIR%" (
        echo The target folder exists but is not a Git checkout: "%VENCORD_DIR%"
        goto :fail
    )
    git clone https://github.com/Vendicated/Vencord.git "%VENCORD_DIR%"
    if errorlevel 1 goto :fail
)

if not exist "%VENCORD_DIR%\package.json" (
    echo Could not find Vencord's package.json at "%VENCORD_DIR%".
    goto :fail
)

if not exist "%VENCORD_DIR%\src\userplugins" mkdir "%VENCORD_DIR%\src\userplugins"
if errorlevel 1 goto :fail

copy /Y "%PLUGIN_SOURCE%" "%VENCORD_DIR%\src\userplugins\FakeDeafen.ts"
if errorlevel 1 goto :fail

pushd "%VENCORD_DIR%"
call pnpm install --frozen-lockfile
if errorlevel 1 (
    popd
    goto :fail
)

call pnpm build
if errorlevel 1 (
    popd
    goto :fail
)

call pnpm inject
set "RESULT=%ERRORLEVEL%"
popd
if not "%RESULT%"=="0" goto :fail
echo.
echo FakeDeafen installation completed successfully.
pause
exit /b 0

:fail
echo.
echo Installation failed. Review the error above, fix it, and run the installer again.
pause
exit /b 1