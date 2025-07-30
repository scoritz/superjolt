#!/bin/bash

echo "🚀 Starting Superjolt development mode..."
echo ""

# Run initial build and link
echo "📦 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "🔗 Installing globally..."
npm install -g .
if [ $? -ne 0 ]; then
    echo "❌ npm link failed"
    exit 1
fi

echo "✅ Initial setup complete!"
echo ""
echo "👀 Starting watch mode..."
echo "⚠️  Note: After making changes, run 'npm run dev:link' in another terminal to update the global command"
echo ""

# Start nest build in watch mode
npx nest build --watch