/**
 * AST Parser utilities for code analysis
 * Single Responsibility: Parse and analyze code structure
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { extractTagsFromString } from './tags.js';

/**
 * Parse JavaScript/TypeScript code into AST
 * @param {string} content - Source code
 * @returns {Object} AST
 */
export function parseCode(content) {
  return parser.parse(content, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
    errorRecovery: true,
  });
}

/**
 * Detect which test framework the code uses
 * @param {Object} ast - Parsed AST
 * @returns {Object} Framework detection result
 */
export function detectFramework(ast) {
  let hasWdio = false;
  let hasPlaywright = false;
  let hasMixedContent = false;

  traverse.default(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (t.isIdentifier(callee) && (callee.name === '$' || callee.name === '$$')) {
        hasWdio = true;
      }
      if (t.isMemberExpression(callee) && 
          t.isIdentifier(callee.object) && callee.object.name === 'page') {
        hasPlaywright = true;
      }
    },
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (source === '@playwright/test') {
        hasPlaywright = true;
      }
      if (source.includes('webdriverio') || source.includes('wdio')) {
        hasWdio = true;
      }
    },
    VariableDeclarator(path) {
      if (t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) &&
          path.node.init.callee.name === 'require') {
        const arg = path.node.init.arguments[0];
        if (t.isStringLiteral(arg)) {
          if (arg.value === '@playwright/test') {
            hasPlaywright = true;
          }
          if (arg.value.includes('chai') || arg.value.includes('wdio')) {
            hasWdio = true;
          }
        }
      }
    }
  });

  hasMixedContent = hasWdio && hasPlaywright;

  return {
    isWdio: hasWdio && !hasPlaywright,
    isPlaywright: hasPlaywright && !hasWdio,
    isMixed: hasMixedContent,
    isUnknown: !hasWdio && !hasPlaywright,
  };
}

/**
 * Extract detailed information from AST
 * @param {Object} ast - Parsed AST
 * @returns {Object} Extracted information
 */
export function extractAstInfo(ast) {
  const info = {
    imports: [],
    describes: [],
    tests: [],
    hooks: [],
    selectors: [],
    commands: [],
    assertions: [],
    variables: [],
    pageObjectUsage: [],
    tags: [],
  };

  traverse.default(ast, {
    ImportDeclaration(path) {
      info.imports.push({
        type: 'import',
        source: path.node.source.value,
        specifiers: path.node.specifiers.map(s => {
          if (t.isImportDefaultSpecifier(s)) {
            return { type: 'default', name: s.local.name };
          }
          if (t.isImportSpecifier(s)) {
            return { type: 'named', name: s.local.name, imported: s.imported?.name || s.local.name };
          }
          return { type: 'namespace', name: s.local.name };
        }),
      });
    },
    
    VariableDeclarator(path) {
      if (t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) &&
          path.node.init.callee.name === 'require') {
        const arg = path.node.init.arguments[0];
        if (t.isStringLiteral(arg)) {
          info.imports.push({
            type: 'require',
            source: arg.value,
            variable: t.isIdentifier(path.node.id) ? path.node.id.name : 
                      t.isObjectPattern(path.node.id) ? 
                        path.node.id.properties.map(p => p.value?.name || p.key?.name) : null,
          });
        }
      }
    },

    CallExpression(path) {
      const callee = path.node.callee;
      
      // describe/test.describe blocks
      if ((t.isIdentifier(callee) && callee.name === 'describe') ||
          (t.isMemberExpression(callee) && 
           t.isIdentifier(callee.object) && callee.object.name === 'test' &&
           t.isIdentifier(callee.property) && callee.property.name === 'describe')) {
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) {
          const extractedTags = extractTagsFromString(arg.value);
          info.describes.push({
            name: arg.value,
            tags: extractedTags,
            loc: path.node.loc,
          });
          if (extractedTags.length > 0) {
            info.tags.push(...extractedTags.map(tag => ({ tag, source: 'describe', name: arg.value })));
          }
        }
      }

      // it/test blocks
      if ((t.isIdentifier(callee) && callee.name === 'it') ||
          (t.isIdentifier(callee) && callee.name === 'test' && 
           !t.isMemberExpression(path.parent))) {
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) {
          const extractedTags = extractTagsFromString(arg.value);
          info.tests.push({
            name: arg.value,
            tags: extractedTags,
            loc: path.node.loc,
          });
          if (extractedTags.length > 0) {
            info.tags.push(...extractedTags.map(tag => ({ tag, source: 'test', name: arg.value })));
          }
        }
      }

      // Hooks
      const hookNames = ['before', 'after', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'];
      if (t.isIdentifier(callee) && hookNames.includes(callee.name)) {
        info.hooks.push({ type: callee.name, loc: path.node.loc });
      }
      if (t.isMemberExpression(callee) && 
          t.isIdentifier(callee.object) && callee.object.name === 'test' &&
          hookNames.includes(callee.property?.name)) {
        info.hooks.push({ type: callee.property.name, loc: path.node.loc });
      }

      // WDIO selectors $ and $$
      if (t.isIdentifier(callee) && (callee.name === '$' || callee.name === '$$')) {
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) {
          info.selectors.push({
            type: callee.name === '$' ? 'single' : 'multiple',
            selector: arg.value,
            loc: path.node.loc,
          });
        }
      }

      // WDIO commands
      if (t.isMemberExpression(callee)) {
        const methodName = callee.property?.name;
        if (methodName) {
          if (t.isIdentifier(callee.object) && callee.object.name === 'browser') {
            info.commands.push({
              command: `browser.${methodName}`,
              loc: path.node.loc,
            });
          } else {
            info.commands.push({
              command: methodName,
              loc: path.node.loc,
            });
          }
        }
      }

      // Assertions
      if (t.isIdentifier(callee) && callee.name === 'expect') {
        info.assertions.push({ type: 'expect', loc: path.node.loc });
      }
      if (t.isMemberExpression(callee) && 
          t.isIdentifier(callee.property) && 
          ['toBe', 'toEqual', 'toHaveText', 'toBeVisible'].includes(callee.property.name)) {
        info.assertions.push({ type: callee.property.name, loc: path.node.loc });
      }
    },

    NewExpression(path) {
      if (t.isIdentifier(path.node.callee)) {
        const name = path.node.callee.name;
        if (name.includes('Page') || name.includes('Component')) {
          info.pageObjectUsage.push({
            className: name,
            loc: path.node.loc,
          });
        }
      }
    },
  });

  return info;
}
