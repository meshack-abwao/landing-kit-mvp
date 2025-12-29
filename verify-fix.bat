@echo off
echo Checking DashboardLayout.jsx for the fix...
echo.

cd /d C:\Users\ADMIN\Desktop\landing-kit-mvp\dashboard\src\components\Dashboard

echo Looking for safety reset code...
findstr /C:"Safety reset on mount" DashboardLayout.jsx
if %errorlevel%==0 (
    echo [OK] Safety reset found!
) else (
    echo [ERROR] Safety reset NOT found!
)

echo.
echo Looking for ESC key handler...
findstr /C:"Escape key handler" DashboardLayout.jsx
if %errorlevel%==0 (
    echo [OK] ESC handler found!
) else (
    echo [ERROR] ESC handler NOT found!
)

echo.
echo ================================================
echo File location:
echo %CD%\DashboardLayout.jsx
echo.
pause
