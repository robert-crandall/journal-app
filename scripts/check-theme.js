#!/usr/bin/env node

/**
 * Theme Checker Script
 *
 * This script scans Svelte files for hard-coded colors and provides suggestions
 * for theme-aware alternatives. It can be run as part of CI/CD or manually.
 *
 * Usage:
 *   node scripts/check-theme.js
 *   node scripts/check-theme.js --fix-suggestions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_SRC_DIR = path.join(__dirname, '../frontend/src');
const FILE_EXTENSIONS = ['.svelte', '.ts', '.js'];

// Hard-coded color patterns to detect
const COLOR_PATTERNS = [
  {
    pattern: /\b(bg|text|border)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+\b/g,
    suggestion: (match) => {
      const [, property, color] = match.split('-');
      const colorMap = {
        red: 'error',
        green: 'success',
        blue: 'primary',
        purple: 'secondary',
        yellow: 'warning',
        gray: property === 'bg' ? 'base-100/200/300' : 'base-content',
        slate: property === 'bg' ? 'base-100/200/300' : 'base-content',
        zinc: property === 'bg' ? 'base-100/200/300' : 'base-content',
        neutral: property === 'bg' ? 'base-100/200/300' : 'base-content',
        stone: property === 'bg' ? 'base-100/200/300' : 'base-content',
      };
      const themeColor = colorMap[color] || 'primary/secondary/accent';
      return `${property}-${themeColor}`;
    },
  },
  {
    pattern: /\bhover:(bg|text|border)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone)-\d+\b/g,
    suggestion: (match) => {
      const parts = match.split('-');
      const property = parts[1];
      const color = parts[2];
      const colorMap = {
        red: 'error/80',
        green: 'success/80',
        blue: 'primary/80',
        purple: 'secondary/80',
        yellow: 'warning/80',
        gray: 'base-content/80',
        slate: 'base-content/80',
        zinc: 'base-content/80',
        neutral: 'base-content/80',
        stone: 'base-content/80',
      };
      const themeColor = colorMap[color] || 'primary/80';
      return `hover:${property}-${themeColor}`;
    },
  },
];

// Theme-aware alternatives documentation
const THEME_GUIDE = `
🎨 Theme-Aware CSS Classes Guide:

Background Colors:
- bg-base-100      → Main content background (adapts to light/dark)
- bg-base-200      → Secondary background (cards, inputs)
- bg-base-300      → Tertiary background (disabled states)
- bg-primary       → Primary brand color
- bg-secondary     → Secondary brand color  
- bg-accent        → Accent color
- bg-success       → Success states
- bg-warning       → Warning states
- bg-error         → Error states
- bg-primary/10    → Primary with 10% opacity

Text Colors:
- text-base-content    → Primary text (adapts to theme)
- text-base-content/60 → Muted text (60% opacity)
- text-primary         → Primary brand text
- text-secondary       → Secondary brand text
- text-success         → Success text
- text-warning         → Warning text
- text-error           → Error text

Border Colors:
- border-base-300  → Default borders
- border-primary   → Primary borders
- border-error     → Error borders

Hover States:
- hover:bg-primary/80     → Hover with 80% opacity
- hover:text-secondary/80 → Hover text with reduced opacity
`;

// Scan files for hard-coded colors
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  COLOR_PATTERNS.forEach(({ pattern, suggestion }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = content.split('\n')[lineNumber - 1];

      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNumber,
        column: match.index - content.lastIndexOf('\n', match.index - 1),
        hardCodedColor: match[0],
        suggestion: suggestion(match[0]),
        context: line.trim(),
      });
    }
  });

  return issues;
}

// Recursively scan directory
function scanDirectory(dir) {
  const allIssues = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && FILE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
        const issues = scanFile(fullPath);
        allIssues.push(...issues);
      }
    }
  }

  scan(dir);
  return allIssues;
}

// Format and display results
function displayResults(issues) {
  if (issues.length === 0) {
    console.log('✅ No hard-coded colors found! Your theming is consistent.');
    return;
  }

  console.log(`❌ Found ${issues.length} hard-coded color usage(s):\n`);

  // Group by file
  const byFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  Object.entries(byFile).forEach(([file, fileIssues]) => {
    console.log(`📄 ${file}:`);
    fileIssues.forEach((issue) => {
      console.log(`  Line ${issue.line}: ${issue.hardCodedColor}`);
      console.log(`    Context: ${issue.context}`);
      console.log(`    Suggestion: Use "${issue.suggestion}" instead`);
      console.log('');
    });
  });

  if (process.argv.includes('--fix-suggestions')) {
    console.log(THEME_GUIDE);
  }
}

// Main execution
function main() {
  console.log('🎨 Checking for hard-coded colors in Svelte files...\n');

  const issues = scanDirectory(FRONTEND_SRC_DIR);
  displayResults(issues);

  if (issues.length > 0) {
    console.log('💡 Run with --fix-suggestions to see theming guide');
    console.log('💡 Consider using DaisyUI theme classes for consistent theming');
    process.exit(1);
  }
}

main();
