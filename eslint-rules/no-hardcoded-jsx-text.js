'use strict'

// Matches any Latin letter, including accented Latin-1 characters used by
// the app's supported locales (en, es, fr, pt).
const LETTER_PATTERN = /[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/

function truncate(text) {
  const trimmed = text.trim()
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}...` : trimmed
}

/**
 * Disallow hardcoded, letter-containing text as direct JSX children.
 * User-facing copy must come from i18n `t()` (react-i18next) so every
 * string is translatable, per the design system's localization rule.
 *
 * Scoped to JSX children only (JSXText and a JSXExpressionContainer whose
 * expression is a plain string/template literal), not JSX attributes,
 * to avoid flagging non-copy values like testID, accessibilityRole,
 * route names, or style keywords.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded user-facing strings as JSX children. Use i18n t() from react-i18next instead.',
    },
    schema: [],
    messages: {
      hardcoded:
        'Hardcoded user-facing string "{{text}}" in JSX. Use t() from react-i18next instead of a literal.',
    },
  },
  create(context) {
    function report(node, text) {
      context.report({ node, messageId: 'hardcoded', data: { text: truncate(text) } })
    }

    return {
      JSXText(node) {
        if (LETTER_PATTERN.test(node.value)) {
          report(node, node.value)
        }
      },
      JSXExpressionContainer(node) {
        const parent = node.parent
        if (!parent || (parent.type !== 'JSXElement' && parent.type !== 'JSXFragment')) {
          return
        }
        const expr = node.expression
        if (expr.type === 'Literal' && typeof expr.value === 'string' && LETTER_PATTERN.test(expr.value)) {
          report(node, expr.value)
        }
        if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
          const text = expr.quasis.map((quasi) => quasi.value.raw).join('')
          if (LETTER_PATTERN.test(text)) {
            report(node, text)
          }
        }
      },
    }
  },
}
