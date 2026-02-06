#!/bin/bash
# Create a checkpoint/rebirth point for the repository
# Usage: ./scripts/create-checkpoint.sh [tag-name]

set -e

# Get current date in YYYYMMDD format
CURRENT_DATE=$(date +%Y%m%d)

# Use provided tag name or default to rebirth-YYYYMMDD
TAG_NAME="${1:-rebirth-$CURRENT_DATE}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo "Creating checkpoint tag: $TAG_NAME"
echo "Current branch: $CURRENT_BRANCH"
echo "Current commit: $(git log -1 --oneline)"
echo ""

# Create annotated tag with timestamp
git tag -a "$TAG_NAME" -m "Rebirth checkpoint created on $(date -Iseconds)
Branch: $CURRENT_BRANCH
Commit: $(git log -1 --oneline)

This checkpoint can be used to restore the repository to this state.
Use: git checkout $TAG_NAME
Or: ./scripts/restore-checkpoint.sh $TAG_NAME"

echo "✓ Tag created: $TAG_NAME"
echo ""

# Push tag to remote
read -p "Push tag to remote? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin "$TAG_NAME"
    echo "✓ Tag pushed to remote"
else
    echo "Tag not pushed. To push later: git push origin $TAG_NAME"
fi

echo ""
echo "Checkpoint created successfully!"
echo "To restore this checkpoint: ./scripts/restore-checkpoint.sh $TAG_NAME"
