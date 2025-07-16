/**
 * Custom ESLint rule to prevent emoji usage in code.
 * This enforces the UI design guideline: "Never use emojis in production UI - they're inconsistent across platforms."
 */

// Unicode ranges for emoji characters
// This covers most standard emoji ranges
const EMOJI_RANGES = [
  // Basic emoji
  [0x1f600, 0x1f64f], // Emoticons
  [0x1f300, 0x1f5ff], // Misc Symbols and Pictographs
  [0x1f680, 0x1f6ff], // Transport and Map
  [0x1f700, 0x1f77f], // Alchemical Symbols
  [0x1f780, 0x1f7ff], // Geometric Shapes
  [0x1f800, 0x1f8ff], // Supplemental Arrows-C
  [0x1f900, 0x1f9ff], // Supplemental Symbols and Pictographs
  [0x1fa00, 0x1fa6f], // Chess Symbols
  [0x1fa70, 0x1faff], // Symbols and Pictographs Extended-A

  // Additional ranges
  [0x2600, 0x26ff], // Miscellaneous Symbols
  [0x2700, 0x27bf], // Dingbats
  [0x2b50, 0x2b59], // Misc symbols (star, heavy heart)
  [0x2328, 0x232b], // Keyboard symbols
  [0x2600, 0x262f], // Misc symbols (Sun, cloud, etc.)
  [0x2638, 0x263a], // Religious symbols and smiley
  [0x2640, 0x2653], // Gender and zodiac symbols
  [0x2660, 0x2668], // Card suits and hot springs
  [0x267b, 0x267f], // Recycling and wheelchair symbols
  [0x2692, 0x269c], // Misc symbols (hammer, anchor, etc.)
  [0x2702, 0x2705], // Scissors and checkmarks
  [0x2708, 0x270d], // Airplane and writing hand
  [0x2733, 0x2734], // Eight-spoked asterisk
  [0x2764, 0x2764], // Heavy heart
  [0x2795, 0x2797], // Plus, minus signs
  [0x1f1e6, 0x1f1ff], // Regional indicator symbols
];

// Test if a character is an emoji
function isEmoji(char) {
  const codePoint = char.codePointAt(0);
  return EMOJI_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

// Find emoji positions in text
function findEmojiPositions(text) {
  const positions = [];

  // Handle surrogate pairs and emoji sequences properly
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    // Check for surrogate pairs (some emojis use 2 code units)
    const isHighSurrogate = char.charCodeAt(0) >= 0xd800 && char.charCodeAt(0) <= 0xdbff;

    if (isHighSurrogate && i + 1 < text.length) {
      const nextChar = text.charAt(i + 1);
      const isLowSurrogate = nextChar.charCodeAt(0) >= 0xdc00 && nextChar.charCodeAt(0) <= 0xdfff;

      if (isLowSurrogate) {
        // Combine surrogate pair to get the full character
        const fullChar = char + nextChar;
        if (isEmoji(fullChar)) {
          positions.push({ index: i, emoji: fullChar });
        }
        i++; // Skip the second half of the surrogate pair
      } else if (isEmoji(char)) {
        positions.push({ index: i, emoji: char });
      }
    } else if (isEmoji(char)) {
      positions.push({ index: i, emoji: char });
    }
  }

  return positions;
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow emoji usage in code',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null, // Can be made fixable if needed
    schema: [],
    messages: {
      noEmoji: 'Emoji detected: "{{emoji}}". UI design guideline prohibits emoji usage as they are inconsistent across platforms. Use Lucide icons instead.',
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();

    function checkTextForEmojis(node, text) {
      if (typeof text !== 'string') return;

      const emojiPositions = findEmojiPositions(text);

      emojiPositions.forEach(({ index, emoji }) => {
        // Calculate the exact position in the source code
        const loc = sourceCode.getLocFromIndex(node.range[0] + index);

        context.report({
          node,
          loc,
          messageId: 'noEmoji',
          data: {
            emoji,
          },
        });
      });
    }

    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          checkTextForEmojis(node, node.value);
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        node.quasis.forEach((quasi) => {
          checkTextForEmojis(quasi, quasi.value.raw);
        });
      },

      // Check JSX text (for React components if any)
      JSXText(node) {
        checkTextForEmojis(node, node.value);
      },

      // Check Svelte text
      SvelteText(node) {
        checkTextForEmojis(node, node.value);
      },

      // Check Svelte attribute values
      SvelteAttribute(node) {
        if (node.value && typeof node.value.value === 'string') {
          checkTextForEmojis(node, node.value.value);
        } else if (node.value && node.value.expression) {
          // For dynamic attributes, we need to traverse the expression
          if (node.value.expression.type === 'Literal' && typeof node.value.expression.value === 'string') {
            checkTextForEmojis(node.value.expression, node.value.expression.value);
          }
        }
      },

      // Check Svelte mustache tags
      SvelteMustacheTag(node) {
        if (node.expression.type === 'Literal' && typeof node.expression.value === 'string') {
          checkTextForEmojis(node.expression, node.expression.value);
        }
      },

      // Check comments
      Program() {
        const comments = sourceCode.getAllComments();
        comments.forEach((comment) => {
          checkTextForEmojis(comment, comment.value);
        });
      },
    };
  },
};

export default {
  rules: {
    'no-emoji': rule,
  },
};
