@echo off
setlocal

set "PLUGIN_SOURCE=%~dp0src\FakeDeafen.ts"
if not "%~1"=="" (
    set "VENCORD_DIR=%~1"
) else (
    set /p "VENCORD_DIR=Path to your Vencord folder: "
)

if not exist "%VENCORD_DIR%\src" (
    echo Could not find a Vencord src folder at "%VENCORD_DIR%".
    exit /b 1
)

if not exist "%VENCORD_DIR%\src\userplugins" mkdir "%VENCORD_DIR%\src\userplugins"
if errorlevel 1 exit /b 1

copy /Y "%PLUGIN_SOURCE%" "%VENCORD_DIR%\src\userplugins\FakeDeafen.ts"
if errorlevel 1 exit /b 1

pushd "%VENCORD_DIR%"
call pnpm build
if errorlevel 1 (
    popd
    exit /b 1
)

call pnpm inject
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%