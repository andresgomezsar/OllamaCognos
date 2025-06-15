#!/bin/bash

# Change to project directory
cd "$(dirname "$0")"

# Show a notification
osascript -e 'display notification "Starting OllamaCognos server..." with title "OllamaCognos"'

# Start the server
npm run dev &

# Wait for the server to be ready (adjust the sleep time as needed)
sleep 5

# Open the browser
open http://localhost:3000

echo "OllamaCognos server started and browser opened."
