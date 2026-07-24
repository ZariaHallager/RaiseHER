'use strict'

/**
 * Local ESLint plugin enforcing two design system house rules (Section 8):
 *   - no-em-dash: no em dash characters anywhere in source
 *   - no-hardcoded-jsx-text: no hardcoded user-facing strings in JSX
 */
module.exports = {
  rules: {
    'no-em-dash': require('./no-em-dash'),
    'no-hardcoded-jsx-text': require('./no-hardcoded-jsx-text'),
  },
}
