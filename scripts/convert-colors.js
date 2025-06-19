#!/usr/bin/env node

/**
 * Script to convert hardcoded Tailwind CSS colors to daisyUI semantic colors
 * This ensures proper theme support across all components
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color mapping from Tailwind hardcoded colors to daisyUI semantic colors
const colorMappings = [
  // Background colors
  { from: /bg-white\b/g, to: 'bg-base-100' },
  { from: /bg-neutral-50\b/g, to: 'bg-base-200' },
  { from: /bg-neutral-100\b/g, to: 'bg-base-200' },
  { from: /bg-neutral-200\b/g, to: 'bg-base-300' },
  { from: /bg-gray-50\b/g, to: 'bg-base-200' },
  { from: /bg-gray-100\b/g, to: 'bg-base-200' },
  { from: /bg-gray-200\b/g, to: 'bg-base-300' },
  
  // Text colors
  { from: /text-neutral-900\b/g, to: 'text-base-content' },
  { from: /text-neutral-800\b/g, to: 'text-base-content' },
  { from: /text-neutral-700\b/g, to: 'text-base-content/80' },
  { from: /text-neutral-600\b/g, to: 'text-base-content/70' },
  { from: /text-neutral-500\b/g, to: 'text-base-content/60' },
  { from: /text-neutral-400\b/g, to: 'text-base-content/50' },
  { from: /text-gray-900\b/g, to: 'text-base-content' },
  { from: /text-gray-800\b/g, to: 'text-base-content' },
  { from: /text-gray-700\b/g, to: 'text-base-content/80' },
  { from: /text-gray-600\b/g, to: 'text-base-content/70' },
  { from: /text-gray-500\b/g, to: 'text-base-content/60' },
  { from: /text-gray-400\b/g, to: 'text-base-content/50' },
  { from: /text-black\b/g, to: 'text-base-content' },
  
  // Border colors
  { from: /border-neutral-200\b/g, to: 'border-base-300' },
  { from: /border-neutral-300\b/g, to: 'border-base-300' },
  { from: /border-neutral-100\b/g, to: 'border-base-300' },
  { from: /border-gray-200\b/g, to: 'border-base-300' },
  { from: /border-gray-300\b/g, to: 'border-base-300' },
  
  // Blue colors -> Primary
  { from: /bg-blue-50\b/g, to: 'bg-primary/5' },
  { from: /bg-blue-100\b/g, to: 'bg-primary/10' },
  { from: /bg-blue-500\b/g, to: 'bg-primary' },
  { from: /bg-blue-600\b/g, to: 'bg-primary' },
  { from: /bg-blue-700\b/g, to: 'bg-primary/90' },
  { from: /text-blue-600\b/g, to: 'text-primary' },
  { from: /text-blue-700\b/g, to: 'text-primary' },
  { from: /text-blue-500\b/g, to: 'text-primary' },
  { from: /border-blue-200\b/g, to: 'border-primary/20' },
  { from: /border-blue-300\b/g, to: 'border-primary/30' },
  { from: /hover:bg-blue-50\b/g, to: 'hover:bg-primary/5' },
  { from: /hover:bg-blue-700\b/g, to: 'hover:bg-primary/90' },
  { from: /hover:border-blue-200\b/g, to: 'hover:border-primary/30' },
  { from: /hover:text-blue-700\b/g, to: 'hover:text-primary/80' },
  
  // Green colors -> Success
  { from: /bg-green-50\b/g, to: 'bg-success/10' },
  { from: /bg-green-100\b/g, to: 'bg-success/10' },
  { from: /bg-green-500\b/g, to: 'bg-success' },
  { from: /bg-green-600\b/g, to: 'bg-success' },
  { from: /bg-green-700\b/g, to: 'bg-success/90' },
  { from: /text-green-600\b/g, to: 'text-success' },
  { from: /text-green-700\b/g, to: 'text-success' },
  { from: /text-green-800\b/g, to: 'text-success' },
  { from: /text-green-900\b/g, to: 'text-success' },
  { from: /border-green-200\b/g, to: 'border-success/20' },
  { from: /hover:bg-green-700\b/g, to: 'hover:bg-success/90' },
  { from: /text-white\b/g, to: 'text-success-content' }, // When used with green backgrounds
  
  // Purple colors -> Secondary
  { from: /bg-purple-50\b/g, to: 'bg-secondary/5' },
  { from: /bg-purple-100\b/g, to: 'bg-secondary/10' },
  { from: /bg-purple-500\b/g, to: 'bg-secondary' },
  { from: /bg-purple-600\b/g, to: 'bg-secondary' },
  { from: /bg-purple-700\b/g, to: 'bg-secondary/90' },
  { from: /text-purple-600\b/g, to: 'text-secondary' },
  { from: /text-purple-700\b/g, to: 'text-secondary' },
  { from: /text-purple-900\b/g, to: 'text-secondary' },
  { from: /border-purple-200\b/g, to: 'border-secondary/20' },
  { from: /border-purple-300\b/g, to: 'border-secondary/30' },
  { from: /hover:bg-purple-50\b/g, to: 'hover:bg-secondary/5' },
  { from: /hover:bg-purple-200\b/g, to: 'hover:bg-secondary/20' },
  { from: /hover:bg-purple-700\b/g, to: 'hover:bg-secondary/90' },
  { from: /hover:border-purple-300\b/g, to: 'hover:border-secondary/30' },
  { from: /hover:text-purple-700\b/g, to: 'hover:text-secondary/80' },
  { from: /hover:text-purple-900\b/g, to: 'hover:text-secondary' },
  
  // Indigo colors -> Accent
  { from: /bg-indigo-50\b/g, to: 'bg-accent/5' },
  { from: /bg-indigo-100\b/g, to: 'bg-accent/10' },
  { from: /bg-indigo-500\b/g, to: 'bg-accent' },
  { from: /bg-indigo-600\b/g, to: 'bg-accent' },
  { from: /text-indigo-600\b/g, to: 'text-accent' },
  { from: /border-indigo-200\b/g, to: 'border-accent/20' },
  { from: /hover:bg-indigo-50\b/g, to: 'hover:bg-accent/5' },
  { from: /hover:border-indigo-200\b/g, to: 'hover:border-accent/30' },
  
  // Amber/Yellow colors -> Warning
  { from: /bg-amber-50\b/g, to: 'bg-warning/10' },
  { from: /bg-amber-100\b/g, to: 'bg-warning/10' },
  { from: /bg-amber-500\b/g, to: 'bg-warning' },
  { from: /bg-amber-600\b/g, to: 'bg-warning/90' },
  { from: /text-amber-600\b/g, to: 'text-warning' },
  { from: /text-amber-700\b/g, to: 'text-warning' },
  { from: /text-yellow-500\b/g, to: 'text-warning' },
  { from: /border-amber-200\b/g, to: 'border-warning/20' },
  { from: /hover:bg-amber-600\b/g, to: 'hover:bg-warning/90' },
  { from: /hover:border-amber-200\b/g, to: 'hover:border-warning/30' },
  { from: /hover:text-amber-700\b/g, to: 'hover:text-warning/80' },
  
  // Red colors -> Error
  { from: /bg-red-50\b/g, to: 'bg-error/10' },
  { from: /bg-red-100\b/g, to: 'bg-error/10' },
  { from: /bg-red-500\b/g, to: 'bg-error' },
  { from: /bg-red-600\b/g, to: 'bg-error' },
  { from: /text-red-600\b/g, to: 'text-error' },
  { from: /text-red-700\b/g, to: 'text-error' },
  { from: /border-red-200\b/g, to: 'border-error/20' },
  
  // Neutral colors for specific use cases
  { from: /bg-neutral-500\b/g, to: 'bg-neutral' },
  { from: /bg-neutral-600\b/g, to: 'bg-neutral/90' },
  { from: /text-neutral-600\b/g, to: 'text-base-content/70' },
  { from: /hover:bg-neutral-600\b/g, to: 'hover:bg-neutral/90' },
  
  // Emerald colors -> Success (alternative)
  { from: /from-emerald-50\b/g, to: 'from-success/10' },
  { from: /to-emerald-50\b/g, to: 'to-success/10' },
  
  // Generic color content classes
  { from: /text-white\b/g, to: 'text-primary-content' }, // Context-dependent, might need manual review
];

// Special cases for specific contexts
const contextualMappings = [
  // When bg-green-* is used, text-white should be text-success-content
  { 
    condition: /bg-success/,
    from: /text-white\b/g, 
    to: 'text-success-content' 
  },
  // When bg-blue-* is used, text-white should be text-primary-content
  { 
    condition: /bg-primary/,
    from: /text-white\b/g, 
    to: 'text-primary-content' 
  },
  // When bg-purple-* is used, text-white should be text-secondary-content
  { 
    condition: /bg-secondary/,
    from: /text-white\b/g, 
    to: 'text-secondary-content' 
  },
];

function findSvelteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findSvelteFiles(fullPath));
    } else if (item.endsWith('.svelte') || item.endsWith('.ts') || item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function convertColors(content, filePath) {
  let modified = content;
  let changesMade = false;
  
  // Apply basic color mappings
  for (const mapping of colorMappings) {
    const originalContent = modified;
    modified = modified.replace(mapping.from, mapping.to);
    if (originalContent !== modified) {
      changesMade = true;
      console.log(`  ✓ Replaced ${mapping.from.source} with ${mapping.to}`);
    }
  }
  
  // Apply contextual mappings
  for (const contextual of contextualMappings) {
    if (contextual.condition.test(modified)) {
      const originalContent = modified;
      modified = modified.replace(contextual.from, contextual.to);
      if (originalContent !== modified) {
        changesMade = true;
        console.log(`  ✓ Contextual: Replaced ${contextual.from.source} with ${contextual.to}`);
      }
    }
  }
  
  return { content: modified, changed: changesMade };
}

function main() {
  const frontendDir = path.join(__dirname, '../frontend/src');
  
  if (!fs.existsSync(frontendDir)) {
    console.error('Frontend src directory not found!');
    process.exit(1);
  }
  
  console.log('🎨 Converting Tailwind hardcoded colors to daisyUI semantic colors...\n');
  
  const files = findSvelteFiles(frontendDir);
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const filePath of files) {
    totalFiles++;
    const relativePath = path.relative(frontendDir, filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = convertColors(content, filePath);
      
      if (result.changed) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        modifiedFiles++;
        console.log(`📝 Modified: ${relativePath}`);
      } else {
        console.log(`✅ No changes needed: ${relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${relativePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Conversion complete!`);
  console.log(`📊 Stats: ${modifiedFiles}/${totalFiles} files modified`);
  
  if (modifiedFiles > 0) {
    console.log(`\n💡 Tip: Test your application in different themes to ensure proper color mapping.`);
    console.log(`💡 Some colors may need manual review for optimal theme support.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertColors, colorMappings };
