#!/bin/bash
set -e

PEXELS_KEY="LzT8kktA31JMkX3mzbU9xZeQ66vNMQPPXGLHLvxjAgk36usDhhOEnZT9"
CHROME_BIN=$(which google-chrome || which chromium-browser || which chromium 2>/dev/null | head -1)

echo "================================================"
echo " Fetching Pexels footage for all 3 businesses"
echo "================================================"

fetch_video() {
  local query="$1"
  local outfile="$2"
  echo -n "Fetching: $query ... "
  RESPONSE=$(curl -s "https://api.pexels.com/videos/search?query=$(echo $query | sed 's/ /+/g')&per_page=5&size=medium&orientation=landscape" \
    -H "Authorization: $PEXELS_KEY")
  VIDEO_URL=$(echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
videos = data.get('videos', [])
for v in videos:
  files = v.get('video_files', [])
  for f in sorted(files, key=lambda x: x.get('width', 0), reverse=True):
    if f.get('width', 0) >= 1280 and f.get('width', 0) <= 1920:
      print(f['link'])
      exit()
" 2>/dev/null)
  if [ -n "$VIDEO_URL" ]; then
    curl -sL "$VIDEO_URL" -o "$outfile"
    echo "Done ($(du -sh $outfile | cut -f1))"
  else
    echo "FAILED - no suitable video found"
  fi
}

# --- ProFlow Plumbing ---
echo ""
echo "[1/3] ProFlow Plumbing"
mkdir -p remotion/footage
fetch_video "plumber fixing pipe" "remotion/footage/scene1.mp4"
fetch_video "water pipe repair wrench" "remotion/footage/scene2.mp4"
fetch_video "plumber water heater installation" "remotion/footage/scene3.mp4"
fetch_video "drain cleaning plumbing" "remotion/footage/scene4.mp4"

# --- Lone Star HVAC ---
echo ""
echo "[2/3] Lone Star HVAC"
mkdir -p ../hvac/remotion/footage 2>/dev/null || true
HVAC_DIR=$(find . -path "*/hvac/remotion" -type d 2>/dev/null | head -1)
if [ -n "$HVAC_DIR" ]; then
  mkdir -p "$HVAC_DIR/footage"
  fetch_video "HVAC technician air conditioning repair" "$HVAC_DIR/footage/scene1.mp4"
  fetch_video "air conditioner unit outdoor" "$HVAC_DIR/footage/scene2.mp4"
  fetch_video "heating system furnace repair" "$HVAC_DIR/footage/scene3.mp4"
  fetch_video "thermostat home temperature" "$HVAC_DIR/footage/scene4.mp4"
fi

# --- Pro Tiling ---
echo ""
echo "[3/3] Pro Tiling & Remodeling"
TILE_DIR=$(find . -path "*/tiling/remotion" -type d 2>/dev/null | head -1)
if [ -n "$TILE_DIR" ]; then
  mkdir -p "$TILE_DIR/footage"
  fetch_video "tile installation bathroom floor" "$TILE_DIR/footage/scene1.mp4"
  fetch_video "bathroom remodel renovation" "$TILE_DIR/footage/scene2.mp4"
  fetch_video "kitchen backsplash tile" "$TILE_DIR/footage/scene3.mp4"
  fetch_video "flooring installation worker" "$TILE_DIR/footage/scene4.mp4"
fi

echo ""
echo "================================================"
echo " All footage downloaded!"
echo " Run: npm run render (in each remotion/ folder)"
echo "================================================"
