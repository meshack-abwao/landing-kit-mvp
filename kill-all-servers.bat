@echo off
echo Killing all Node and Vite processes...

taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul

echo.
echo All processes killed!
echo.
pause
