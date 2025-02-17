


export MODEL_NAME="DeepSeek-R1-Distill-Qwen-1.5B-Q8_0"
export LLM_CONTEXT_LENGTH="4096"
export LLM_THREADS="4"


cleanup() {
    echo "Cleaning up processes..."
    
    
    PORT_PID=$(lsof -ti:5000)
    if [ ! -z "$PORT_PID" ]; then
        echo "Killing process on port 5000 (PID: $PORT_PID)"
        kill -9 $PORT_PID 2>/dev/null
    fi
    
    
    PYTHON_PIDS=$(ps aux | grep "[p]ython.main" | awk '{print $2}')
    if [ ! -z "$PYTHON_PIDS" ]; then
        echo "Killing Python processes: $PYTHON_PIDS"
        kill -9 $PYTHON_PIDS 2>/dev/null
    fi
    
    
    jobs -p | xargs -r kill -9 2>/dev/null
    
    echo "Cleanup completed"
    exit
}


trap cleanup EXIT INT TERM


echo "Starting backend server..."
cd backend && python -m python.main &


sleep 5


echo "Starting frontend..."
cd frontend && npm run tauri dev


cleanup