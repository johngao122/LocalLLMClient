@echo off
setlocal

set "MODEL_NAME=DeepSeek-R1-Distill-Qwen-1.5B-Q8_0"
set "LLM_CONTEXT_LENGTH=4096"
set "LLM_THREADS=4"

REM GPU configuration
echo Detecting GPU...
where nvidia-smi >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo NVIDIA GPU detected: Enabling CUDA acceleration
    set "LLAMA_CUDA=1"
) else (
    echo No NVIDIA GPU detected: Using CPU only
)

REM Function to clean up processes
:cleanup
echo Cleaning up processes...

REM Kill process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process on port 5000 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill Python processes
for /f "tokens=2 delims= " %%a in ('tasklist ^| findstr /i "python.exe"') do (
    echo Killing Python process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Cleanup completed.
exit /b

REM Trap signals (CTRL+C or script termination)
trap cleanup EXIT INT TERM

REM Start backend
echo Starting backend server...
cd backend
start "" /B python -m python.main
cd ..

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend
echo Starting frontend...
cd frontend
call npm run tauri dev

REM Cleanup before exiting
goto cleanup