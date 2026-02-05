#!/bin/bash
# List all available checkpoints/rebirth points
# Usage: ./scripts/list-checkpoints.sh

echo "Available Checkpoint Tags:"
echo "=========================="
echo ""

# List all rebirth tags with details
git tag -l "rebirth-*" -n9 | while IFS= read -r line; do
    if [[ $line =~ ^rebirth- ]]; then
        echo "📍 $line"
    else
        echo "   $line"
    fi
done

echo ""
echo "To view details of a specific checkpoint:"
echo "  git show <tag-name>"
echo ""
echo "To restore a checkpoint:"
echo "  ./scripts/restore-checkpoint.sh <tag-name>"
