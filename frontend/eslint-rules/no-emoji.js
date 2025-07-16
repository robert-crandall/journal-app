/**
 * Custom ESLint rule to prevent emoji usage in code.
 * This enforces the UI design guideline: "Never use emojis in production UI - they're inconsistent across platforms."
 */

// Unicode ranges for emoji characters
// This covers most standard emoji ranges
const EMOJI_RANGES = [
  // Basic emoji
  [0x1F600, 0x1F64F], // Emoticons
  [0x1F300, 0x1F5FF], // Misc Symbols and Pictographs
  [0x1F680, 0x1F6FF], // Transport and Map
  [0x1F700, 0x1F77F], // Alchemical Symbols
  [0x1F780, 0x1F7FF], // Geometric Shapes
  [0x1F800, 0x1F8FF], // Supplemental Arrows-C
  [0x1F900, 0x1F9FF], // Supplemental Symbols and Pictographs
  [0x1FA00, 0x1FA6F], // Chess Symbols
  [0x1FA70, 0x1FAFF], // Symbols and Pictographs Extended-A
  
  // Additional ranges
  [0x2600, 0x26FF],   // Miscellaneous Symbols
  [0x2700, 0x27BF],   // Dingbats
  [0x2B50, 0x2B59],   // Misc symbols (star, heavy heart)
  [0x2328, 0x232B],   // Keyboard symbols
  [0x2600, 0x262F],   // Misc symbols (Sun, cloud, etc.)
  [0x2638, 0x263A],   // Religious symbols and smiley
  [0x2640, 0x2653],   // Gender and zodiac symbols
  [0x2660, 0x2668],   // Card suits and hot springs
  [0x267B, 0x267F],   // Recycling and wheelchair symbols
  [0x2692, 0x269C],   // Misc symbols (hammer, anchor, etc.)
  [0x2702, 0x2705],   // Scissors and checkmarks
  [0x2708, 0x270D],   // Airplane and writing hand
  [0x2733, 0x2734],   // Eight-spoked asterisk
  [0x2764, 0x2764],   // Heavy heart
  [0x2795, 0x2797],   // Plus, minus signs
  [0x1F1E6, 0x1F1FF], // Regional indicator symbols
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
    const isHighSurrogate = char.charCodeAt(0) >= 0xD800 && char.charCodeAt(0) <= 0xDBFF;
    
    if (isHighSurrogate && i + 1 < text.length) {
      const nextChar = text.charAt(i + 1);
      const isLowSurrogate = nextChar.charCodeAt(0) >= 0xDC00 && nextChar.charCodeAt(0) <= 0xDFFF;
      
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
