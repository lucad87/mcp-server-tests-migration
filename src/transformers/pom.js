/**
 * Page Object Model Transformer
 * Single Responsibility: Refactor tests to use Page Object Model pattern
 */

import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { parseCode } from '../utils/parser.js';

/**
 * Extract page-related info from test for POM
 * @param {string} testContent - Test content to analyze
 * @returns {Object} Extracted page info
 */
export function extractPageInfo(testContent) {
  const ast = parseCode(testContent);
  const pageInfo = {
    urls: [],
    locators: [],
    actions: [],
    assertions: [],
  };

  traverse.default(ast, {
    CallExpression: (path) => {
      const callee = path.node.callee;

      // Extract page.goto URLs
      if (t.isMemberExpression(callee) &&
          t.isIdentifier(callee.property) && callee.property.name === 'goto') {
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) {
          pageInfo.urls.push(arg.value);
        }
      }

      // Extract locators
      if (t.isMemberExpression(callee) &&
          t.isIdentifier(callee.object) && callee.object.name === 'page') {
        const method = callee.property?.name;
        
        if (method === 'locator' || method?.startsWith('getBy')) {
          const arg = path.node.arguments[0];
          if (t.isStringLiteral(arg)) {
            pageInfo.locators.push({
              method,
              selector: arg.value,
              loc: path.node.loc,
            });
          } else if (t.isObjectExpression(arg)) {
            pageInfo.locators.push({
              method,
              options: arg,
              loc: path.node.loc,
            });
          }
        }
      }

      // Extract actions (click, fill, etc.)
      if (t.isMemberExpression(callee)) {
        const actionMethods = ['click', 'fill', 'type', 'check', 'uncheck', 'selectOption', 'hover', 'focus'];
        if (t.isIdentifier(callee.property) && actionMethods.includes(callee.property.name)) {
          pageInfo.actions.push({
            action: callee.property.name,
            loc: path.node.loc,
          });
        }
      }

      // Extract assertions
      if (t.isIdentifier(callee) && callee.name === 'expect') {
        pageInfo.assertions.push({ loc: path.node.loc });
      }
    },
  });

  return pageInfo;
}

/**
 * Generate a Page Object class from extracted info
 * @param {string} pageName - Name for the page class
 * @param {Object} pageInfo - Extracted page info
 * @returns {string} Generated page object class code
 */
export function generatePageObjectClass(pageName, pageInfo) {
  const locatorDefs = pageInfo.locators.map((loc, index) => {
    const varName = generateLocatorName(loc, index);
    if (loc.method === 'locator') {
      return `    this.${varName} = page.locator('${loc.selector}');`;
    } else if (loc.method === 'getByTestId') {
      return `    this.${varName} = page.getByTestId('${loc.selector}');`;
    } else if (loc.method === 'getByRole') {
      return `    this.${varName} = page.getByRole('${loc.selector}');`;
    } else if (loc.method === 'getByLabel') {
      return `    this.${varName} = page.getByLabel('${loc.selector}');`;
    } else if (loc.method === 'getByPlaceholder') {
      return `    this.${varName} = page.getByPlaceholder('${loc.selector}');`;
    } else if (loc.method === 'getByText') {
      return `    this.${varName} = page.getByText('${loc.selector}');`;
    }
    return `    this.${varName} = page.${loc.method}('${loc.selector}');`;
  }).join('\n');

  const gotoUrl = pageInfo.urls[0] || '/';

  return `export class ${pageName} {
  constructor(page) {
    this.page = page;
${locatorDefs}
  }

  async goto() {
    await this.page.goto('${gotoUrl}');
  }
}
`;
}

/**
 * Generate a meaningful name for a locator
 */
function generateLocatorName(locator, index) {
  if (locator.selector) {
    // Try to extract a meaningful name from the selector
    const selector = locator.selector;
    
    // data-test-id value
    const testIdMatch = selector.match(/data-test-id=['"]?([^'">\s]+)/);
    if (testIdMatch) {
      return toCamelCase(testIdMatch[1]);
    }
    
    // ID selector
    const idMatch = selector.match(/^#([\w-]+)/);
    if (idMatch) {
      return toCamelCase(idMatch[1]);
    }
    
    // aria-label
    const labelMatch = selector.match(/aria-label=['"]([^'"]+)/);
    if (labelMatch) {
      return toCamelCase(labelMatch[1]) + 'Element';
    }
    
    // Class name
    const classMatch = selector.match(/^\.([\w-]+)/);
    if (classMatch) {
      return toCamelCase(classMatch[1]);
    }
  }
  
  return `element${index + 1}`;
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^./, c => c.toLowerCase());
}

/**
 * Refactor a test to use Page Object Model
 * @param {string} testContent - Original test content
 * @param {string} filePath - File path for naming
 * @returns {Object} Refactored test and page object
 */
export function refactorToPom(testContent, filePath = 'test.spec.js') {
  const pageInfo = extractPageInfo(testContent);
  const pageName = generatePageName(filePath);
  const pageObjectClass = generatePageObjectClass(pageName, pageInfo);
  
  return {
    pageObject: {
      className: pageName,
      fileName: `${pageName}.js`,
      content: pageObjectClass,
    },
    pageInfo,
  };
}

/**
 * Generate page class name from file path
 */
function generatePageName(filePath) {
  const baseName = filePath
    .replace(/.*\//, '')
    .replace(/\.(spec|test)\.(js|ts)$/, '')
    .replace(/[-_]/g, ' ');
  
  return baseName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Page';
}
