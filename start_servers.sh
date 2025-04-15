#!/bin/bash

# Start the Node.js server in the background
echo "Starting Node.js server..."
node server.js &

# Start the Python summarizer in the background
echo "Starting Python summarizer..."
python3 summarizer.py &

# Wait for both processes
wait 