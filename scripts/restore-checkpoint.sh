#!/bin/bash
# Restore repository to a checkpoint/rebirth point
# Usage: ./scripts/restore-checkpoint.sh [tag-name]

set -e

# Check if tag name provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore-checkpoint.sh <tag-name>"
    echo ""
    echo "Available checkpoint tags:"
    git tag -l "rebirth-*" | sort -r
    exit 1
fi

TAG_NAME="$1"

# Check if tag exists
if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "Error: Tag '$TAG_NAME' does not exist"
    echo ""
    echo "Available checkpoint tags:"
    git tag -l "rebirth-*" | sort -r
    exit 1
fi

# Show tag information
echo "Checkpoint information:"
echo "======================"
git show "$TAG_NAME" --no-patch
echo ""

# Warn about uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠ Warning: You have uncommitted changes!"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to stash these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        STASH_NAME="pre-checkpoint-restore-$(date +%Y%m%d-%H%M%S)"
        git stash push -m "$STASH_NAME"
        echo "✓ Changes stashed as: $STASH_NAME"
        echo "  To restore: git stash pop"
    else
        echo "Aborted. Please commit or stash your changes first."
        exit 1
    fi
fi

# Confirm restoration
echo ""
read -p "Restore to checkpoint '$TAG_NAME'? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Create new branch from checkpoint
RESTORE_BRANCH="restore-$TAG_NAME-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$RESTORE_BRANCH" "$TAG_NAME"

echo ""
echo "✓ Restored to checkpoint: $TAG_NAME"
echo "✓ New branch created: $RESTORE_BRANCH"
echo ""
echo "Next steps:"
echo "  1. Review the restored state"
echo "  2. If satisfied, push: git push origin $RESTORE_BRANCH"
echo "  3. To merge back to main: create a PR from $RESTORE_BRANCH"
