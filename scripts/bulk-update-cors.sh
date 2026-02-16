#!/bin/bash

# Bulk CORS Update Script
# Updates all edge functions to use the new CORS helper instead of allow-all

set -e

FUNCTIONS_DIR="supabase/functions"
UPDATED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

echo "🔄 Starting bulk CORS update for edge functions..."
echo ""

# Find all edge function index.ts files
for func_dir in "$FUNCTIONS_DIR"/*/; do
  # Skip _shared directory
  if [[ "$func_dir" == *"/_shared/"* ]]; then
    continue
  fi
  
  INDEX_FILE="${func_dir}index.ts"
  
  if [ ! -f "$INDEX_FILE" ]; then
    continue
  fi
  
  FUNC_NAME=$(basename "$func_dir")
  
  # Check if already updated (has import from _shared/cors)
  if grep -q "from.*_shared/cors" "$INDEX_FILE"; then
    echo "⏭️  Skipping $FUNC_NAME (already updated)"
    ((SKIPPED_COUNT++))
    continue
  fi
  
  # Check if has the old CORS pattern
  if ! grep -q "'Access-Control-Allow-Origin'.*'\*'" "$INDEX_FILE"; then
    echo "⚠️  Skipping $FUNC_NAME (no standard CORS pattern found)"
    ((SKIPPED_COUNT++))
    continue
  fi
  
  echo "🔧 Updating $FUNC_NAME..."
  
  # Create backup
  cp "$INDEX_FILE" "${INDEX_FILE}.bak"
  
  # Try to update the file
  if python3 <<EOF
import re

with open('$INDEX_FILE', 'r') as f:
    content = f.read()

# Check if it has the pattern we expect
if "'Access-Control-Allow-Origin': '*'" not in content:
    exit(1)

# Add import at top (after other imports)
if 'import { getCorsHeaders' not in content:
    # Find last import statement
    imports = []
    for match in re.finditer(r'^import .+;$', content, re.MULTILINE):
        imports.append(match.end())
    
    if imports:
        insert_pos = imports[-1]
        import_statement = '\nimport { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";'
        content = content[:insert_pos] + import_statement + content[insert_pos:]

# Replace CORS headers definition
content = re.sub(
    r'const corsHeaders = \{[^}]+\};',
    '// CORS headers now managed by shared helper',
    content,
    flags=re.DOTALL
)

# Replace OPTIONS handler
content = re.sub(
    r'if \(req\.method === ["\']OPTIONS["\']\) \{\s*return new Response\([^)]+\);\s*\}',
    '''if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);''',
    content
)

with open('$INDEX_FILE', 'w') as f:
    f.write(content)

exit(0)
EOF
  then
    echo "✅ Updated $FUNC_NAME"
    ((UPDATED_COUNT++))
    # Remove backup on success
    rm "${INDEX_FILE}.bak"
  else
    echo "❌ Failed to update $FUNC_NAME (restored from backup)"
    mv "${INDEX_FILE}.bak" "$INDEX_FILE"
    ((ERROR_COUNT++))
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ Updated: $UPDATED_COUNT functions"
echo "  ⏭️  Skipped: $SKIPPED_COUNT functions"
echo "  ❌ Errors: $ERROR_COUNT functions"
echo ""

if [ $UPDATED_COUNT -gt 0 ]; then
  echo "🎉 Bulk CORS update complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Review changes: git diff"
  echo "  2. Test a few functions manually"
  echo "  3. Commit: git add supabase/functions/ && git commit -m 'Apply CORS restrictions to all edge functions'"
else
  echo "⚠️  No functions were updated. They may already be using the new pattern."
fi

echo ""
echo "💡 Note: Functions with custom CORS logic may need manual review."
