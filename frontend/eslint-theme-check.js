/**
 * Custom ESLint rule to check for hard-coded colors that should use theme classes instead.
 * This helps maintain consistent theming and dark mode support.
 */

// List of hard-coded color patterns that should be avoided
const FORBIDDEN_COLOR_PATTERNS = [
  // Background colors
  /bg-red-\d+/g,
  /bg-blue-\d+/g,
  /bg-green-\d+/g,
  /bg-yellow-\d+/g,
  /bg-purple-\d+/g,
  /bg-pink-\d+/g,
  /bg-indigo-\d+/g,
  /bg-gray-\d+/g,
  /bg-slate-\d+/g,
  /bg-zinc-\d+/g,
  /bg-neutral-\d+/g,
  /bg-stone-\d+/g,
  
  // Text colors
  /text-red-\d+/g,
  /text-blue-\d+/g,
  /text-green-\d+/g,
  /text-yellow-\d+/g,
  /text-purple-\d+/g,
  /text-pink-\d+/g,
  /text-indigo-\d+/g,
  /text-gray-\d+/g,
  /text-slate-\d+/g,
  /text-zinc-\d+/g,
  /text-neutral-\d+/g,
  /text-stone-\d+/g,
  
  // Border colors
  /border-red-\d+/g,
  /border-blue-\d+/g,
  /border-green-\d+/g,
  /border-yellow-\d+/g,
  /border-purple-\d+/g,
  /border-pink-\d+/g,
  /border-indigo-\d+/g,
  /border-gray-\d+/g,
  /border-slate-\d+/g,
  /border-zinc-\d+/g,
  /border-neutral-\d+/g,
  /border-stone-\d+/g,
];

// Recommended theme alternatives
const THEME_ALTERNATIVES = {
  'bg-red': 'bg-error or bg-error/10',
  'text-red': 'text-error',
  'border-red': 'border-error',
  'bg-green': 'bg-success or bg-success/10',
  'text-green': 'text-success',
  'border-green': 'border-success',
  'bg-blue': 'bg-primary or bg-primary/10',
  'text-blue': 'text-primary',
  'border-blue': 'border-primary',
  'bg-purple': 'bg-secondary or bg-secondary/10',
  'text-purple': 'text-secondary',
  'border-purple': 'border-secondary',
  'bg-yellow': 'bg-warning or bg-warning/10',
  'text-yellow': 'text-warning',
  'border-yellow': 'border-warning',
  'bg-gray': 'bg-base-100, bg-base-200, or bg-base-300',
  'text-gray': 'text-base-content or text-base-content/60',
  'border-gray': 'border-base-300',
};

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hard-coded colors in favor of theme-aware classes',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      hardCodedColor: 'Hard-coded color "{{color}}" detected. Use theme-aware classes instead. Consider: {{suggestion}}',
    },
  },
  
  create(context) {
    function checkForHardCodedColors(node, value) {
      if (typeof value !== 'string') return;
      
      FORBIDDEN_COLOR_PATTERNS.forEach(pattern => {
        const matches = value.match(pattern);
        if (matches) {
          matches.forEach(match => {
            // Extract base color name (e.g., "bg-red" from "bg-red-500")
            const baseColor = match.replace(/-\d+$/, '');
            const suggestion = THEME_ALTERNATIVES[baseColor] || 'a theme-aware class like bg-primary, text-base-content, etc.';
            
            context.report({
              node,
              messageId: 'hardCodedColor',
              data: {
                color: match,
                suggestion,
              },
            });
          });
        }
      });
    }
    
    return {
      // Check class attributes in Svelte files
      Property(node) {
        if (node.key && node.key.name === 'class' && node.value) {
          if (node.value.type === 'Literal') {
            checkForHardCodedColors(node, node.value.value);
          }
        }
      },
      
      // Check template literals and string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          checkForHardCodedColors(node, node.value);
        }
      },
      
      // Check template literals
      TemplateLiteral(node) {
        node.quasis.forEach(quasi => {
          checkForHardCodedColors(node, quasi.value.raw);
        });
      },
    };
  },
};

export default {
  rules: {
    'no-hardcoded-colors': rule,
  },
};
