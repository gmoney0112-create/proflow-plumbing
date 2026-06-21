#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install fal-mcp-server --quiet --ignore-installed pyjwt 2>&1 | tail -3

echo "Installing Remotion dependencies..."
if [ -d "remotion" ]; then
  cd remotion && npm install && cd ..
fi

echo ""
echo "Setup complete! Run ./test-apis.sh to verify your API keys."
