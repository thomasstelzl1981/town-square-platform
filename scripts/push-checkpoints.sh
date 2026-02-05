#!/bin/bash
# Push checkpoint tags to remote repository
# Usage: ./scripts/push-checkpoints.sh [tag-name]

set -e

if [ -n "$1" ]; then
    # Push specific tag
    TAG_NAME="$1"
    
    # Check if tag exists
    if ! git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
        echo "Error: Tag '$TAG_NAME' does not exist"
        echo ""
        echo "Available tags:"
        git tag -l "rebirth-*"
        exit 1
    fi
    
    echo "Pushing tag: $TAG_NAME"
    git push origin "$TAG_NAME"
    echo "✓ Tag pushed successfully"
else
    # Push all rebirth tags
    TAGS=$(git tag -l "rebirth-*")
    
    if [ -z "$TAGS" ]; then
        echo "No rebirth tags found to push"
        exit 0
    fi
    
    echo "Found rebirth tags:"
    echo "$TAGS"
    echo ""
    
    read -p "Push all rebirth tags to remote? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for tag in $TAGS; do
            echo "Pushing: $tag"
            git push origin "$tag" || echo "⚠ Failed to push $tag (might already exist on remote)"
        done
        echo ""
        echo "✓ All tags pushed"
    else
        echo "Aborted"
    fi
fi
