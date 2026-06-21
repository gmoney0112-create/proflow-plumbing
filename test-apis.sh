#!/bin/bash

echo "Testing API Keys..."
echo "==================="

# fal.ai
echo -n "fal.ai:      "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Key ${FAL_KEY}" \
  "https://fal.run/fal-ai/flux/dev" -X GET)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ] || [ "$STATUS" = "405" ]; then
  echo "CONNECTED (HTTP $STATUS)"
else
  echo "FAILED (HTTP $STATUS)"
fi

# Runway
echo -n "Runway:      "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${RUNWAY_API_KEY}" \
  -H "X-Runway-Version: 2024-11-06" \
  "https://api.dev.runwayml.com/v1/tasks")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
  echo "CONNECTED (HTTP $STATUS)"
else
  echo "FAILED (HTTP $STATUS)"
fi

# Kling AI
echo -n "Kling AI:    "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${KLING_API_KEY}" \
  "https://api.klingai.com/v1/account/info")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
  echo "CONNECTED (HTTP $STATUS)"
else
  echo "FAILED (HTTP $STATUS)"
fi

# Ideogram
echo -n "Ideogram:    "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${IDEOGRAM_API_KEY}" \
  "https://api.ideogram.ai/manage/api/subscriber")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
  echo "CONNECTED (HTTP $STATUS)"
else
  echo "FAILED (HTTP $STATUS)"
fi

# Leonardo AI
echo -n "Leonardo AI: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "authorization: Bearer ${LEONARDO_API_KEY}" \
  "https://cloud.leonardo.ai/api/rest/v1/me")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
  echo "CONNECTED (HTTP $STATUS)"
else
  echo "FAILED (HTTP $STATUS)"
fi

echo "==================="
echo "Done! Keys not shown above need to be added as Codespaces secrets."
echo "Go to: github.com/settings/codespaces"
