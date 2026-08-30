@echo off
echo ========================================================
echo   DRDO MALE UAV DIGITAL TWIN - FULL SYSTEM STARTUP
echo ========================================================
echo.

echo [1/4] Starting Simulator Backend (FastAPI on Port 4000)...
start "1. SIMULATOR BACKEND (Port 4000)" cmd /k "cd /d %~dp0simulator\backend && .\.venv\Scripts\Activate && python -m uvicorn app.main:app --port 4000"

echo [2/4] Starting Main Backend Gateway (FastAPI on Port 8000)...
start "2. MAIN BACKEND GATEWAY (Port 8000)" cmd /k "cd /d %~dp0backend-service && .\.venv\Scripts\Activate && python -m uvicorn app.main:app --reload --port 8000"

echo [3/4] Starting Simulator Frontend (Port 3000)...
start "3. SIMULATOR FRONTEND (Port 3000)" cmd /k "cd /d %~dp0simulator && npm run dev"

echo [4/4] Starting Main Digital Twin Dashboard (Port 5173)...
start "4. MAIN DASHBOARD FRONTEND (Port 5173)" cmd /k "cd /d %~dp0male_uav_frontend- && npm run dev"

echo.
echo ========================================================
echo   ALL 4 MICROSERVICES LAUNCHED SUCCESSFULLY
echo   --------------------------------------------------------
echo   1. Simulator Backend:    http://localhost:4000
echo   2. Main Backend Gateway: http://localhost:8000
echo   3. Simulator Frontend:   http://localhost:3000
echo   4. Main Dashboard UI:    http://localhost:5173
echo ========================================================
echo.
pause
