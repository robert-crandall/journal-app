/**
 * ESLint rule to enforce proper date handling
 *
 * This rule prevents direct Date conversion for date-only fields and encourages
 * the use of utility functions to avoid timezone issues.
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using utility functions for date handling instead of direct Date conversion',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      dateOnlyConversion: 'Avoid direct Date conversion for date-only fields (YYYY-MM-DD). Use the formatDate utility function instead.',
      dateConversionWarning: 'Check if this is a date-only field. If so, use formatDate utility instead of direct Date conversion.',
      dateMethodWarning: 'Use appropriate date formatting utilities instead of native Date methods to avoid timezone issues.',
    },
  },
  create: function (context) {
    return {
      // Detect new Date() with string argument that looks like a date-only string
      'NewExpression[callee.name="Date"][arguments.length=1]': function (node) {
        const arg = node.arguments[0];
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          // Check if it looks like a date-only string (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(arg.value)) {
            context.report({
              node,
              messageId: 'dateOnlyConversion',
              fix: function (fixer) {
                return fixer.replaceText(node, `formatDate('${arg.value}')`);
              },
            });
          }
        } else if (arg.type === 'Identifier') {
          // For variables, we can't determine content statically, so just warn
          context.report({
            node,
            messageId: 'dateConversionWarning',
          });
        }
      },

      // Detect .toLocaleDateString() or similar methods on potential date-only variables
      'CallExpression[callee.property.name=/to(Local|UTC|ISO)?(Date|Time)String/]': function (node) {
        const objectName = node.callee.object?.name;

        // Skip if this is already a known utility call
        if (objectName === 'formatDate' || objectName === 'formatDateTime') {
          return;
        }

        context.report({
          node,
          messageId: 'dateMethodWarning',
        });
      },
    };
  },
};
