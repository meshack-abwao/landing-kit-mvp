#!/bin/bash

echo "🚀 Starting Jari.Ecom..."
echo ""

# Start backend
echo "📦 Starting Backend (Port 3000)..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start dashboard
echo "🎨 Starting Dashboard (Port 5173)..."
cd ../dashboard
npm run dev &
DASHBOARD_PID=$!

# Start store
echo "🛍️  Starting Store (Port 5174)..."
cd ../frontend-dynamic
npm run dev &
STORE_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📍 URLs:"
echo "   Backend:   http://localhost:3000"
echo "   Dashboard: http://localhost:5173"
echo "   Store:     http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop all..."

trap "kill $BACKEND_PID $DASHBOARD_PID $STORE_PID; exit" INT
wait
