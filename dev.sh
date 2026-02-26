#!/bin/bash

# dev.sh - Development environment startup script
# This script starts both the Flask backend and React frontend concurrently.

# Exit on any error
set -e

echo "🚀 Starting Intelligent Resume Analysis System..."

# Function to check if backend is healthy
check_backend() {
    local max_attempts=10
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        echo "⏳ Waiting for Backend to be ready... (Attempt $attempt/$max_attempts)"
        if curl -s http://127.0.0.1:8000/api/health > /dev/null; then
            echo "✅ Backend is healthy and responding!"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    echo "❌ Backend failed to start or is not responding."
    return 1
}

# Navigate to backend and start it in the background
echo "📥 Starting Backend (Flask)..."
cd backend
if [ ! -d "venv" ]; then
    echo "⚠️ venv not found. Please run setup first."
    exit 1
fi

./venv/bin/python run.py > server.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
if ! check_backend; then
    echo "📜 Last 10 lines of backend log:"
    tail -n 10 server.log
    kill $BACKEND_PID
    exit 1
fi

# Navigate to frontend and start it
echo "📤 Starting Frontend (React)..."
cd ../frontend
npm start &
FRONTEND_PID=$!

# Handle script termination (Ctrl+C)
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait for both processes
echo "✅ Both servers are running. Press Ctrl+C to stop."
wait
