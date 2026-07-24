'use strict'

// Built via fromCharCode (not a literal) so this rule's own source never
// contains the character it forbids, which would otherwise flag itself.
const EM_DASH = String.fromCharCode(0x2014)

/**
 * Disallow the em dash character anywhere in source: comments, string
 * literals, template literals, and JSX text. Part of the design system
 * house style (Section 8): no em dashes anywhere in the product.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow the em dash character. Rewrite using a period, comma, colon, or parentheses instead.',
    },
    schema: [],
    messages: {
      emDash:
        'Em dash character is not allowed. Rewrite using a period, comma, colon, or parentheses instead.',
    },
  },
  create(context) {
    function checkText(node, text) {
      if (typeof text === 'string' && text.indexOf(EM_DASH) !== -1) {
        context.report({ node, messageId: 'emDash' })
      }
    }

    return {
      Program() {
        const sourceCode = context.sourceCode ?? context.getSourceCode()
        for (const comment of sourceCode.getAllComments()) {
          checkText(comment, comment.value)
        }
      },
      Literal(node) {
        if (typeof node.value === 'string') checkText(node, node.value)
      },
      TemplateElement(node) {
        checkText(node, node.value.raw)
      },
      JSXText(node) {
        checkText(node, node.value)
      },
    }
  },
}
