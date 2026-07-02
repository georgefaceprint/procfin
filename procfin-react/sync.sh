#!/bin/zsh

# Simple script to automate git sync
# Usage: ./sync.sh "your commit message"

if [ -z "$1" ]; then
  echo "Usage: ./sync.sh \"your commit message\""
  exit 1
fi

git add .
git commit -m "$1"
git push origin main
