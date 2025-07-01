#!/usr/bin/env bash

# Fix common patterns in test files
# This script will help fix the user creation patterns across multiple test files

files=(
  "src/routes/quests.test.ts"
  "src/routes/task-completion.test.ts"
  "src/routes/task-completion-debug.test.ts"
  "src/routes/task-management-system.test.ts"
  "src/routes/task-source-debug.test.ts"
  "src/routes/todos.test.ts"
  "src/routes/scheduled.test.ts"
  "src/routes/experiments.test.ts"
  "src/routes/external-task-sources.test.ts"
  "src/routes/dashboard.test.ts"
  "src/routes/ad-hoc-tasks.test.ts"
  "src/routes/journal.test.ts"
  "src/routes/journal-features.test.ts"
  "src/routes/journal-history.test.ts"
  "src/routes/journal-homepage-integration.test.ts"
  "src/routes/journal-system-integration.test.ts"
  "src/routes/character-dashboard.test.ts"
  "src/routes/character-level-up.test.ts"
  "src/routes/character-stat-progression.test.ts"
  "src/routes/character-stats.test.ts"
  "src/routes/character-system-integration.test.ts"
  "src/routes/characters.test.ts"
  "src/routes/feedback-system.test.ts"
  "src/routes/quest-experiment-integration.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Add import if not present
    if ! grep -q "createTestUser" "$file"; then
      # Add import after existing imports
      sed -i '' '/^import.*from.*db\/schema/a\
import { createTestUser } from '"'"'../utils/test-helpers'"'"'
' "$file"
    fi
    
    echo "Added import to $file"
  else
    echo "File $file not found, skipping..."
  fi
done

echo "Import additions complete!"
