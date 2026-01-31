@echo off
echo ========================================
echo   STOPPING ALL NODE.JS SERVERS
echo ========================================
echo.

echo Killing all node.js processes...
taskkill /F /IM node.exe 2>nul

if %errorlevel% == 0 (
    echo ✅ All Node.js processes stopped successfully!
) else (
    echo ℹ️  No Node.js processes were running.
)

echo.
echo ========================================
echo   STARTING FRESH SERVER
echo ========================================
echo.

echo Starting backend server...
start "Ilham Backend Server" cmd /k "cd /d %~dp0 && node app.js"

echo.
echo ✅ Server started in new window!
echo.
echo Press any key to exit...
pause >nul
