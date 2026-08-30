@echo off
echo ==========================================
echo   MALE UAV GCS - FULL SYSTEM STARTUP
echo ==========================================
echo.

:: Kill any existing processes on port 4000
echo [1/3] Clearing port 4000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Start backend in new window
echo [2/3] Starting Backend (FastAPI on port 4000)...
start "MALE UAV BACKEND" cmd /k "cd /d %~dp0simulator && uvicorn main:app --host 0.0.0.0 --port 4000 --reload"

:: Wait for backend to start
echo     Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

:: Start frontend in new window
echo [3/3] Starting Frontend (Next.js on port 3000)...
start "MALE UAV FRONTEND" cmd /k "cd /d %~dp0simulator && npm run dev"

echo.
echo ==========================================
echo   SYSTEM STARTED
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:4000/docs
echo ==========================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:3000
