@echo off
color 0A

cls
echo.
echo ================================================
echo   COMMIT TO GITHUB
echo ================================================
echo.

cd /d C:\Users\ADMIN\Desktop\landing-kit-mvp

echo What changed?
echo ------------------------------------------------
git status --short
echo.

echo Enter your commit message:
echo (Example: Fixed modal bug, Added new feature, Updated styles)
echo.
set /p message=Message: 

if "%message%"=="" (
    echo ERROR: Message required!
    pause
    exit /b
)

echo.
echo Committing and pushing...
echo ------------------------------------------------

git add .
git commit -m "%message%"
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo ================================================
    echo   SUCCESS! Changes pushed to GitHub ✅
    echo ================================================
    echo.
    echo View at: https://github.com/meshack-abwao/landing-kit-mvp
    echo.
) else (
    echo.
    echo ERROR: Something went wrong!
    echo.
)

pause
