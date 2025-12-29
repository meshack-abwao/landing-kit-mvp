@echo off
echo ================================================
echo   LANDING KIT MVP - CLEAN RESTART
echo ================================================
echo.

cd /d C:\Users\ADMIN\Desktop\landing-kit-mvp

echo [1/6] Killing all Node processes...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/6] Clearing Vite caches...
if exist "dashboard\node_modules\.vite" rmdir /s /q "dashboard\node_modules\.vite"
if exist "frontend-dynamic\node_modules\.vite" rmdir /s /q "frontend-dynamic\node_modules\.vite"

echo.
echo [3/6] Clearing npm caches...
cd dashboard
call npm cache clean --force 2>nul
cd ..
cd frontend-dynamic
call npm cache clean --force 2>nul
cd ..

echo.
echo [4/6] Starting Backend (Port 3000)...
cd backend
start "Backend-3000" cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [5/6] Starting Dashboard (Port 5173)...
cd ..\dashboard
start "Dashboard-5173" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo [6/6] Starting Store (Port 5177)...
cd ..\frontend-dynamic
start "Store-5177" cmd /k "npm run dev"

echo.
echo ================================================
echo   ALL SERVERS STARTED!
echo ================================================
echo.
echo Backend:    http://localhost:3000
echo Dashboard:  http://localhost:5173
echo Store:      http://localhost:5177
echo.
echo IMPORTANT: Open Dashboard in INCOGNITO mode to bypass cache!
echo Press Ctrl+Shift+Delete to clear browser cache
echo.
pause
