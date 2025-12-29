@echo off
echo ================================================
echo   PORT DIAGNOSTIC
echo ================================================
echo.

echo Checking what's running on each port...
echo.

netstat -ano | findstr ":3000" | findstr "LISTENING"
if %errorlevel%==0 (
    echo [Port 3000] Backend is running
) else (
    echo [Port 3000] Nothing running
)

netstat -ano | findstr ":5173" | findstr "LISTENING"
if %errorlevel%==0 (
    echo [Port 5173] Something is running (should be Dashboard)
) else (
    echo [Port 5173] Nothing running
)

netstat -ano | findstr ":5174" | findstr "LISTENING"
if %errorlevel%==0 (
    echo [Port 5174] Something is running (UNKNOWN - should kill this!)
) else (
    echo [Port 5174] Nothing running
)

netstat -ano | findstr ":5176" | findstr "LISTENING"
if %errorlevel%==0 (
    echo [Port 5176] Something is running
) else (
    echo [Port 5176] Nothing running
)

netstat -ano | findstr ":5177" | findstr "LISTENING"
if %errorlevel%==0 (
    echo [Port 5177] Something is running (should be Store)
) else (
    echo [Port 5177] Nothing running
)

echo.
echo ================================================
echo.
pause
