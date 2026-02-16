#!/bin/bash

# Script to find and optionally fix code quality issues
# Usage: ./cleanup-code-artifacts.sh [--fix]

FIX_MODE=false
if [ "$1" == "--fix" ]; then
  FIX_MODE=true
fi

echo "🔍 Scanning for code quality issues..."
echo ""

# Find console.log statements
echo "📝 Console.log statements found:"
CONSOLE_LOGS=$(grep -r "console\.log" src/ \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  -n)

if [ -z "$CONSOLE_LOGS" ]; then
  echo "  ✅ None found"
else
  echo "$CONSOLE_LOGS" | head -20
  CONSOLE_COUNT=$(echo "$CONSOLE_LOGS" | wc -l)
  echo ""
  echo "  Total: $CONSOLE_COUNT instances"
  
  if [ "$FIX_MODE" = true ]; then
    echo ""
    echo "  💡 Tip: Replace with conditional logging:"
    echo "    if (import.meta.env.DEV) console.log(...)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find empty catch blocks
echo "🚫 Empty catch blocks found:"
EMPTY_CATCHES=$(grep -B2 "catch.*{" src/ \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  -A1 \
  | grep -A1 "catch" \
  | grep "^\s*}\s*$" \
  | wc -l)

if [ "$EMPTY_CATCHES" -eq 0 ]; then
  echo "  ✅ None found"
else
  # Show actual files with empty catches
  grep -B3 "catch.*{" src/ \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    -A1 \
    | grep -B3 "^\s*}\s*$" \
    | grep "src/" \
    | head -10
  
  echo ""
  echo "  Total: ~$EMPTY_CATCHES instances"
  
  if [ "$FIX_MODE" = true ]; then
    echo ""
    echo "  💡 Tip: Add error logging:"
    echo "    catch (err) { console.error('Context:', err) }"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Find TypeScript 'any' types (sample)
echo "⚠️  TypeScript 'any' usage (sample):"
ANY_USAGE=$(grep -r ": any" src/ \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir=node_modules \
  -n \
  | head -10)

if [ -z "$ANY_USAGE" ]; then
  echo "  ✅ None found in sample"
else
  echo "$ANY_USAGE"
  ANY_COUNT=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" --exclude-dir=node_modules | wc -l)
  echo ""
  echo "  Total: $ANY_COUNT instances"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$FIX_MODE" = false ]; then
  echo "💡 Run with --fix flag for remediation suggestions"
fi

echo ""
echo "✨ Scan complete"
