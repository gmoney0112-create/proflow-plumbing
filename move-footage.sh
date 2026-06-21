#!/bin/bash
mkdir -p remotion/public/footage
if [ -d "remotion/footage" ] && ls remotion/footage/*.mp4 2>/dev/null | head -1; then
  mv remotion/footage/*.mp4 remotion/public/footage/
  echo "Footage moved to remotion/public/footage/"
else
  echo "No footage found in remotion/footage/ — run fetch-and-render.sh first"
fi
ls remotion/public/footage/ 2>/dev/null
