#!/bin/bash

export MODEL_NAME="DeepSeek-R1-Distill-Qwen-1.5B-Q8_0"
export LLM_CONTEXT_LENGTH="4096"
export LLM_THREADS="4"

# GPU configuration
# Automatically detect platform and set appropriate GPU acceleration
if [[ "$(uname)" == "Darwin" ]]; then
    # On Mac, use Metal
    export LLAMA_METAL="1"
    echo "Detected Mac: Enabling Metal for GPU acceleration"
else
    # On Linux/Windows, check for NVIDIA GPU
    if command -v nvidia-smi &> /dev/null; then
        export LLAMA_CUDA="1"
        echo "Detected NVIDIA GPU: Enabling CUDA acceleration"
    else
        echo "No NVIDIA GPU detected: Using CPU only"
    fi
fi

cleanup() {
    echo "Cleaning up processes..."
    
    # Kill process on port 5000
    PORT_PID=$(lsof -ti:5000)
    if [ ! -z "$PORT_PID" ]; then
        echo "Killing process on port 5000 (PID: $PORT_PID)"
        kill -9 $PORT_PID 2>/dev/null
    fi
    
    # Kill Python processes
    PYTHON_PIDS=$(ps aux | grep "[p]ython.main" | awk '{print $2}')
    if [ ! -z "$PYTHON_PIDS" ]; then
        echo "Killing Python processes: $PYTHON_PIDS"
        kill -9 $PYTHON_PIDS 2>/dev/null
    fi
    
    # Kill any remaining background jobs
    jobs -p | xargs -r kill -9 2>/dev/null
    
    echo "Cleanup completed"
    exit
}

# Trap signals (CTRL+C or script termination)
trap cleanup EXIT INT TERM

# Start backend
echo "Starting backend server..."
cd backend && python -m python.main &

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
cd frontend && npm run tauri dev

# Cleanup before exiting
cleanup