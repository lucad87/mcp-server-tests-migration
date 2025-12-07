/**
 * Selector transformation utilities
 * Single Responsibility: Transform WDIO selectors to Playwright locators
 */

import { SELECTOR_PATTERNS } from '../constants/mappings.js';

/**
 * Transform a WDIO selector to Playwright locator
 * @param {string} selector - WDIO selector string
 * @returns {Object} Transformation result with code and type
 */
export function transformSelector(selector) {
  // Check for data-test-id (preferred)
  const testIdMatch = selector.match(SELECTOR_PATTERNS.dataTestId);
  if (testIdMatch) {
    return {
      code: `page.getByTestId('${testIdMatch[1]}')`,
      type: 'testId',
      original: selector,
    };
  }

  // Check for aria-label
  const ariaMatch = selector.match(SELECTOR_PATTERNS.ariaLabel);
  if (ariaMatch) {
    return {
      code: `page.getByLabel('${ariaMatch[1]}')`,
      type: 'label',
      original: selector,
    };
  }

  // Check for role
  const roleMatch = selector.match(SELECTOR_PATTERNS.role);
  if (roleMatch) {
    return {
      code: `page.getByRole('${roleMatch[1]}')`,
      type: 'role',
      original: selector,
    };
  }

  // Check for placeholder
  const placeholderMatch = selector.match(SELECTOR_PATTERNS.placeholder);
  if (placeholderMatch) {
    return {
      code: `page.getByPlaceholder('${placeholderMatch[1]}')`,
      type: 'placeholder',
      original: selector,
    };
  }

  // Check for button/link with text
  if (selector.match(/^(button|a)\[.*\]$/) || selector.match(/^(button|a)$/)) {
    return {
      code: `page.getByRole('${selector.startsWith('button') ? 'button' : 'link'}')`,
      type: 'role',
      original: selector,
      note: 'Consider adding { name: "..." } for specificity',
    };
  }

  // Default to locator
  return {
    code: `page.locator('${selector}')`,
    type: 'css',
    original: selector,
    suggestion: 'Consider using data-test-id for more reliable selectors',
  };
}

/**
 * Generate selector suggestions for better Playwright practices
 * @param {Object[]} selectors - Array of selector info objects
 * @returns {Object[]} Suggestions for each selector
 */
export function generateSelectorSuggestions(selectors) {
  return selectors.map(sel => {
    const transformed = transformSelector(sel.selector);
    return {
      original: sel.selector,
      suggested: transformed.code,
      type: transformed.type,
      recommendation: transformed.suggestion || transformed.note || null,
    };
  });
}
