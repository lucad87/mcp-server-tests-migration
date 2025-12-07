/**
 * AST Migration Transformer
 * Single Responsibility: Transform WDIO AST to Playwright AST
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { COMMAND_MAPPINGS } from '../constants/mappings.js';
import { parseCode, detectFramework } from '../utils/parser.js';
import { transformSelector } from './selectors.js';
import { extractTagsFromString, removeTagsFromString } from '../utils/tags.js';

/**
 * Perform AST-based migration from WDIO to Playwright
 * @param {string} testContent - Original test content
 * @param {Object} analysis - Optional analysis result
 * @param {boolean} isTypeScript - Output TypeScript
 * @returns {Object} Migration result with code, notes, changes
 */
export function performAstMigration(testContent, analysis, isTypeScript = false) {
  const ast = parseCode(testContent);
  const framework = detectFramework(ast);

  if (framework.isPlaywright) {
    return {
      code: testContent,
      notes: ['File is already using Playwright syntax'],
      changes: [],
      tags: [],
    };
  }

  const changes = [];
  const migratedTags = [];
  let hasPlaywrightImport = false;

  traverse.default(ast, {
    // Transform imports
    ImportDeclaration: (path) => {
      const source = path.node.source.value;
      if (source === 'chai' || source.includes('chai')) {
        path.node.source.value = '@playwright/test';
        path.node.specifiers = [
          t.importSpecifier(t.identifier('test'), t.identifier('test')),
          t.importSpecifier(t.identifier('expect'), t.identifier('expect')),
        ];
        hasPlaywrightImport = true;
        changes.push('Replaced chai import with @playwright/test');
      }
    },

    // Transform require statements
    VariableDeclaration: (path) => {
      path.node.declarations.forEach((decl, index) => {
        if (t.isCallExpression(decl.init) &&
            t.isIdentifier(decl.init.callee) &&
            decl.init.callee.name === 'require') {
          const arg = decl.init.arguments[0];
          if (t.isStringLiteral(arg) && (arg.value === 'chai' || arg.value.includes('chai'))) {
            const importDecl = t.importDeclaration(
              [
                t.importSpecifier(t.identifier('test'), t.identifier('test')),
                t.importSpecifier(t.identifier('expect'), t.identifier('expect')),
              ],
              t.stringLiteral('@playwright/test')
            );
            path.insertBefore(importDecl);
            path.node.declarations.splice(index, 1);
            if (path.node.declarations.length === 0) {
              path.remove();
            }
            hasPlaywrightImport = true;
            changes.push('Replaced chai require with @playwright/test import');
          }
        }
      });
    },

    CallExpression: (path) => {
      const callee = path.node.callee;

      // Transform describe to test.describe
      if (t.isIdentifier(callee) && callee.name === 'describe') {
        path.node.callee = t.memberExpression(
          t.identifier('test'),
          t.identifier('describe')
        );
        changes.push('Transformed describe to test.describe');
      }

      // Transform it to test with tag migration
      if (t.isIdentifier(callee) && callee.name === 'it') {
        const testNameArg = path.node.arguments[0];
        
        if (t.isStringLiteral(testNameArg)) {
          const originalName = testNameArg.value;
          const extractedTags = extractTagsFromString(originalName);
          
          if (extractedTags.length > 0) {
            const cleanName = removeTagsFromString(originalName);
            testNameArg.value = cleanName;
            
            const callback = path.node.arguments[1];
            const tagArray = t.arrayExpression(
              extractedTags.map(tag => t.stringLiteral(`@${tag}`))
            );
            const tagOptions = t.objectExpression([
              t.objectProperty(t.identifier('tag'), tagArray)
            ]);
            
            path.node.arguments = [testNameArg, tagOptions, callback];
            migratedTags.push(...extractedTags);
            changes.push(`Migrated tags [${extractedTags.join(', ')}] to Playwright tag annotation`);
          }
        }
        
        path.node.callee = t.identifier('test');
        
        const callbackIndex = path.node.arguments.length - 1;
        const callback = path.node.arguments[callbackIndex];
        if (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback)) {
          if (callback.params.length === 0) {
            callback.params = [t.objectPattern([
              t.objectProperty(t.identifier('page'), t.identifier('page'), false, true)
            ])];
          }
        }
        changes.push('Transformed it to test with page fixture');
      }

      // Transform hooks
      const hookMap = {
        'before': 'beforeAll',
        'after': 'afterAll',
        'beforeEach': 'beforeEach',
        'afterEach': 'afterEach',
      };
      if (t.isIdentifier(callee) && hookMap[callee.name]) {
        path.node.callee = t.memberExpression(
          t.identifier('test'),
          t.identifier(hookMap[callee.name])
        );
        
        const callback = path.node.arguments[0];
        if (t.isArrowFunctionExpression(callback) || t.isFunctionExpression(callback)) {
          if (callback.params.length === 0) {
            callback.params = [t.objectPattern([
              t.objectProperty(t.identifier('page'), t.identifier('page'), false, true)
            ])];
          }
        }
        changes.push(`Transformed ${callee.name} to test.${hookMap[callee.name]}`);
      }

      // Transform $ and $$ selectors
      if (t.isIdentifier(callee) && (callee.name === '$' || callee.name === '$$')) {
        const arg = path.node.arguments[0];
        if (t.isStringLiteral(arg)) {
          const selector = arg.value;
          const transformed = transformSelector(selector);
          
          const newAst = parser.parseExpression(transformed.code);
          path.replaceWith(newAst);
          
          changes.push(`Transformed ${callee.name}('${selector}') to ${transformed.code}`);
        }
      }

      // Transform WDIO commands
      if (t.isMemberExpression(callee)) {
        const methodName = callee.property?.name;
        
        if (methodName && COMMAND_MAPPINGS[methodName]) {
          const mapping = COMMAND_MAPPINGS[methodName];
          callee.property.name = mapping.method;
          changes.push(`Transformed .${methodName}() to .${mapping.method}()`);
        }

        // browser.url -> page.goto
        if (t.isIdentifier(callee.object) && callee.object.name === 'browser') {
          const browserCmd = `browser.${methodName}`;
          if (COMMAND_MAPPINGS[browserCmd]) {
            const mapping = COMMAND_MAPPINGS[browserCmd];
            const [obj, method] = mapping.method.split('.');
            callee.object.name = obj;
            callee.property.name = method;
            changes.push(`Transformed ${browserCmd} to ${mapping.method}`);
          }
        }
      }
    },
  });

  // Add Playwright import if not present
  if (!hasPlaywrightImport) {
    const importDecl = t.importDeclaration(
      [
        t.importSpecifier(t.identifier('test'), t.identifier('test')),
        t.importSpecifier(t.identifier('expect'), t.identifier('expect')),
      ],
      t.stringLiteral('@playwright/test')
    );
    ast.program.body.unshift(importDecl);
    changes.push('Added @playwright/test import');
  }

  // Add Page type import for TypeScript
  if (isTypeScript) {
    ast.program.body.forEach(node => {
      if (t.isImportDeclaration(node) && node.source.value === '@playwright/test') {
        const hasPage = node.specifiers.some(s => s.local?.name === 'Page');
        if (!hasPage) {
          node.specifiers.push(
            t.importSpecifier(t.identifier('Page'), t.identifier('Page'))
          );
        }
      }
    });
    changes.push('Added Page type import for TypeScript');
  }

  const output = generate.default(ast, {
    retainLines: true,
    compact: false,
  });

  let finalCode = output.code;
  if (isTypeScript) {
    finalCode = finalCode.replace(
      /\(\{\s*page\s*\}\)/g,
      '({ page }: { page: Page })'
    );
    changes.push('Added TypeScript type annotations');
  }

  return {
    code: finalCode,
    notes: generateMigrationNotes(changes, isTypeScript),
    changes,
    tags: migratedTags,
  };
}

/**
 * Generate migration notes summary
 */
function generateMigrationNotes(changes, isTypeScript = false) {
  const notes = [
    'Migration completed with the following transformations:',
    '',
    ...changes.map((c, i) => `${i + 1}. ${c}`),
    '',
    'Manual review recommended for:',
    '- Custom assertions that may need adjustment',
    '- Complex selectors that could use better Playwright locators',
    '- Async/await patterns',
    '- Explicit waits (Playwright auto-waits)',
  ];
  
  if (isTypeScript) {
    notes.push('- TypeScript type definitions');
    notes.push('- Generic type parameters if needed');
  }
  
  return notes;
}
