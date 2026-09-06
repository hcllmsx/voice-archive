@echo off
setlocal
cd /d "%~dp0"

rem ============================================================
rem  sync-version.bat
rem  Thin wrapper for tools\sync-version.ps1.
rem  Usage: edit VERSION, then double-click this file.
rem ============================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\sync-version.ps1"

if errorlevel 1 (echo. & echo Sync failed. See the error above. & pause & exit /b 1)

echo.
echo Done. Remember to commit VERSION, content.js and sw.js together.
pause
endlocal
