/**
 * Tool Handlers
 * Single Responsibility: Handle MCP tool invocations
 * Open/Closed: Open for extension via new handlers
 */

import { COMMAND_MAPPINGS } from '../constants/mappings.js';
import { parseCode, detectFramework, extractAstInfo } from '../utils/parser.js';
import { transformSelector, generateSelectorSuggestions } from '../transformers/selectors.js';
import { performAstMigration } from '../transformers/migration.js';
import { extractPageInfo, refactorToPom, generatePageObjectClass } from '../transformers/pom.js';
import { getPlaywrightDocs } from '../utils/docs.js';
import { generateMigrationReport } from '../utils/report.js';
import { parseWdioConfig, generatePlaywrightConfig, mergePlaywrightConfig, parsePlaywrightConfig } from '../utils/config.js';

/**
 * Analyze WDIO test file
 */
export async function handleAnalyzeWdioTest(args) {
  const { testContent, filePath = 'unknown.js' } = args;

  const ast = parseCode(testContent);
  const framework = detectFramework(ast);
  const astInfo = extractAstInfo(ast);
  const selectorSuggestions = generateSelectorSuggestions(astInfo.selectors);

  const analysis = {
    filePath,
    framework,
    structure: {
      imports: astInfo.imports,
      describes: astInfo.describes,
      tests: astInfo.tests,
      hooks: astInfo.hooks,
    },
    selectors: {
      found: astInfo.selectors,
      suggestions: selectorSuggestions,
    },
    commands: astInfo.commands,
    assertions: astInfo.assertions,
    pageObjects: astInfo.pageObjectUsage,
    tags: astInfo.tags,
    complexity: calculateComplexity(astInfo),
    recommendations: generateRecommendations(framework, astInfo),
  };

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(analysis, null, 2),
    }],
  };
}

/**
 * Migrate WDIO test to Playwright
 */
export async function handleMigrateToPlaywright(args) {
  const { testContent, analysisResult, filePath = 'test.spec.js', outputFormat = 'javascript' } = args;

  let analysis = null;
  if (analysisResult) {
    try {
      analysis = JSON.parse(analysisResult);
    } catch (e) {
      // Continue without analysis
    }
  }

  const isTypeScript = outputFormat === 'typescript' || filePath.endsWith('.ts');
  const migration = performAstMigration(testContent, analysis, isTypeScript);
  
  let targetFile = filePath;
  if (isTypeScript) {
    targetFile = filePath.replace(/\.(js|ts)$/, '.spec.ts');
  } else {
    targetFile = filePath.replace(/\.(js|ts)$/, '.spec.js');
  }

  const codeLanguage = isTypeScript ? 'typescript' : 'javascript';

  return {
    content: [{
      type: 'text',
      text: `# Migrated Playwright Test

## Original File: ${filePath}
## Target: ${targetFile}
## Format: ${isTypeScript ? 'TypeScript' : 'JavaScript'}

### Migration Summary:
${migration.notes.join('\n')}

### Migrated Code:

\`\`\`${codeLanguage}
${migration.code}
\`\`\`

### Next Steps:
1. Review the migrated test for any manual adjustments needed
2. Run \`npx playwright test ${targetFile}\` to verify functionality
3. Use 'refactor_to_pom' tool to apply Page Object Model pattern
4. Consider replacing CSS selectors with data-test-id attributes
${isTypeScript ? '5. Ensure tsconfig.json is properly configured for Playwright' : ''}
`,
    }],
  };
}

/**
 * Refactor test to use Page Object Model
 */
export async function handleRefactorToPom(args) {
  const { testContent, filePath = 'test.spec.js' } = args;

  const result = refactorToPom(testContent, filePath);

  return {
    content: [{
      type: 'text',
      text: `# Page Object Model Refactoring

## Generated Page Object: ${result.pageObject.className}

### File: ${result.pageObject.fileName}

\`\`\`javascript
${result.pageObject.content}
\`\`\`

### Extracted Information:
- URLs: ${result.pageInfo.urls.length}
- Locators: ${result.pageInfo.locators.length}
- Actions: ${result.pageInfo.actions.length}

### Next Steps:
1. Create file: \`pages/${result.pageObject.fileName}\`
2. Import the page object in your test
3. Replace direct page interactions with page object methods
4. Add additional methods as needed for your test scenarios
`,
    }],
  };
}

/**
 * Get Playwright documentation
 */
export async function handleGetPlaywrightDocs(args) {
  const { topic } = args;
  const docs = getPlaywrightDocs(topic);

  return {
    content: [{
      type: 'text',
      text: docs,
    }],
  };
}

/**
 * Compare WDIO and Playwright commands
 */
export async function handleCompareFrameworks(args) {
  const { wdioCommand } = args;

  const mapping = COMMAND_MAPPINGS[wdioCommand];
  
  let playwrightEquivalent;
  if (mapping) {
    playwrightEquivalent = `**${mapping.method}**${mapping.options ? ` with options: ${mapping.options}` : ''}\n\n${mapping.description}`;
  } else {
    const partialMatch = Object.entries(COMMAND_MAPPINGS).find(([key]) => 
      key.toLowerCase().includes(wdioCommand.toLowerCase()) ||
      wdioCommand.toLowerCase().includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      const [key, val] = partialMatch;
      playwrightEquivalent = `Did you mean **${key}**?\n\nPlaywright: **${val.method}**\n\n${val.description}`;
    } else {
      playwrightEquivalent = `No direct mapping found for "${wdioCommand}". 

Common unmapped commands may need custom implementation.
Check Playwright documentation: https://playwright.dev/docs/api/class-page`;
    }
  }

  const relatedCommands = Object.entries(COMMAND_MAPPINGS)
    .filter(([key]) => {
      const category = wdioCommand.split('.')[0];
      return key.startsWith(category) || key.includes(wdioCommand.slice(0, 4));
    })
    .slice(0, 10);

  let relatedTable = '';
  if (relatedCommands.length > 0) {
    relatedTable = `\n\n## Related Commands:\n\n| WDIO | Playwright | Description |\n|------|------------|-------------|\n`;
    relatedCommands.forEach(([wdio, pw]) => {
      relatedTable += `| ${wdio} | ${pw.method} | ${pw.description} |\n`;
    });
  }

  return {
    content: [{
      type: 'text',
      text: `# WDIO to Playwright Command Comparison

## WDIO: \`${wdioCommand}\`

## Playwright Equivalent:
${playwrightEquivalent}
${relatedTable}

## Key Differences:
- Playwright has built-in auto-waiting for most actions
- Playwright uses Locators with strict mode by default
- Playwright assertions have built-in retry logic
- No need for explicit waits in most cases
- Use \`page.getByTestId()\` with \`data-test-id\` attribute for reliable selectors

Reference: https://playwright.dev/docs/api/class-locator
`,
    }],
  };
}

/**
 * Detect project state
 */
export async function handleDetectProjectState(args) {
  const { projectFiles } = args;

  let files = {};
  try {
    files = JSON.parse(projectFiles);
  } catch (e) {
    return {
      content: [{
        type: 'text',
        text: 'Error: projectFiles must be a valid JSON object with file paths as keys and contents as values',
      }],
      isError: true,
    };
  }

  const state = {
    hasPlaywrightConfig: false,
    hasWdioConfig: false,
    playwrightConfigPath: null,
    wdioConfigPath: null,
    playwrightTests: [],
    wdioTests: [],
    mixedTests: [],
    pageObjects: [],
    existingStructure: {
      testsDir: null,
      pagesDir: null,
      fixturesDir: null,
    },
    packageJson: null,
    recommendations: [],
  };

  for (const [filePath, content] of Object.entries(files)) {
    const lowerPath = filePath.toLowerCase();

    if (lowerPath.includes('playwright.config')) {
      state.hasPlaywrightConfig = true;
      state.playwrightConfigPath = filePath;
      state.existingConfig = parsePlaywrightConfig(content);
    }
    
    if (lowerPath.includes('wdio.conf')) {
      state.hasWdioConfig = true;
      state.wdioConfigPath = filePath;
    }

    if (lowerPath.match(/\.(spec|test)\.(js|ts)$/)) {
      const ast = parseCode(content);
      const framework = detectFramework(ast);

      if (framework.isPlaywright) {
        state.playwrightTests.push(filePath);
      } else if (framework.isWdio) {
        state.wdioTests.push(filePath);
      } else if (framework.isMixed) {
        state.mixedTests.push(filePath);
      }
    }

    if (lowerPath.includes('page') && lowerPath.match(/\.(js|ts)$/)) {
      if (content.includes('export class') && content.includes('constructor(page)')) {
        state.pageObjects.push(filePath);
      }
    }

    if (lowerPath.includes('/tests/') || lowerPath.includes('/test/')) {
      state.existingStructure.testsDir = filePath.split('/tests/')[0] + '/tests/' ||
                                          filePath.split('/test/')[0] + '/test/';
    }
    if (lowerPath.includes('/pages/')) {
      state.existingStructure.pagesDir = filePath.split('/pages/')[0] + '/pages/';
    }
    if (lowerPath.includes('/fixtures/')) {
      state.existingStructure.fixturesDir = filePath.split('/fixtures/')[0] + '/fixtures/';
    }

    if (lowerPath.endsWith('package.json')) {
      try {
        state.packageJson = JSON.parse(content);
      } catch (e) {
        // Ignore
      }
    }
  }

  // Generate recommendations
  if (state.hasPlaywrightConfig && state.wdioTests.length > 0) {
    state.recommendations.push('Playwright already configured. Migrate remaining WDIO tests.');
  }
  if (!state.hasPlaywrightConfig && state.hasWdioConfig) {
    state.recommendations.push('Use migrate_config tool to convert wdio.conf to playwright.config');
  }
  if (state.mixedTests.length > 0) {
    state.recommendations.push(`${state.mixedTests.length} tests have mixed WDIO/Playwright code - complete migration`);
  }
  if (state.pageObjects.length > 0) {
    state.recommendations.push(`${state.pageObjects.length} existing page objects found - can be reused or extended`);
  }
  if (state.existingStructure.pagesDir) {
    state.recommendations.push(`Use existing pages directory: ${state.existingStructure.pagesDir}`);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(state, null, 2),
    }],
  };
}

/**
 * Migrate WDIO config to Playwright config
 */
export async function handleMigrateConfig(args) {
  const { wdioConfig, existingPlaywrightConfig } = args;

  const wdioSettings = parseWdioConfig(wdioConfig);

  let playwrightConfig;
  if (existingPlaywrightConfig) {
    playwrightConfig = mergePlaywrightConfig(existingPlaywrightConfig, wdioSettings);
  } else {
    playwrightConfig = generatePlaywrightConfig(wdioSettings);
  }

  return {
    content: [{
      type: 'text',
      text: `# Playwright Configuration Migration

## Original WDIO Settings Detected:
${JSON.stringify(wdioSettings, null, 2)}

## Generated playwright.config.ts:

\`\`\`typescript
${playwrightConfig}
\`\`\`

## Migration Notes:
1. Review baseURL and adjust if needed
2. Update testDir to point to your migrated tests
3. The testIdAttribute is set to 'data-test-id' by default
4. Adjust browser projects based on your needs
5. Configure webServer if running local dev server

## Next Steps:
1. Save as \`playwright.config.ts\` in project root
2. Install Playwright: \`npm install -D @playwright/test\`
3. Install browsers: \`npx playwright install\`
4. Run tests: \`npx playwright test\`
`,
    }],
  };
}

/**
 * Register custom WDIO commands
 */
export async function handleRegisterCustomCommands(args) {
  const { commands } = args;

  let customCommands = {};
  try {
    customCommands = JSON.parse(commands);
  } catch (e) {
    return {
      content: [{
        type: 'text',
        text: 'Error: commands must be a valid JSON object',
      }],
      isError: true,
    };
  }

  const addedCommands = [];
  for (const [wdioCmd, mapping] of Object.entries(customCommands)) {
    if (!COMMAND_MAPPINGS[wdioCmd]) {
      COMMAND_MAPPINGS[wdioCmd] = mapping;
      addedCommands.push(wdioCmd);
    }
  }

  return {
    content: [{
      type: 'text',
      text: `# Custom Commands Registered

## Added Commands:
${addedCommands.length > 0 ? addedCommands.map(cmd => `- ${cmd} → ${COMMAND_MAPPINGS[cmd].method}`).join('\n') : 'No new commands added (already exist)'}

## Total Command Mappings: ${Object.keys(COMMAND_MAPPINGS).length}

## Usage:
These commands will now be automatically migrated when using \`migrate_to_playwright\`.
`,
    }],
  };
}

/**
 * Generate migration report
 */
export async function handleGenerateMigrationReport(args) {
  const { migratedTests, projectName = 'Test Migration' } = args;

  let tests = [];
  try {
    tests = JSON.parse(migratedTests);
  } catch (e) {
    return {
      content: [{
        type: 'text',
        text: 'Error: migratedTests must be a valid JSON array',
      }],
      isError: true,
    };
  }

  const report = generateMigrationReport(tests, projectName);

  return {
    content: [{
      type: 'text',
      text: report,
    }],
  };
}

// Helper functions
function calculateComplexity(astInfo) {
  const factors = {
    selectors: astInfo.selectors.length,
    commands: astInfo.commands.length,
    assertions: astInfo.assertions.length,
    hooks: astInfo.hooks.length,
    pageObjects: astInfo.pageObjectUsage.length,
  };
  
  const score = factors.selectors * 2 + factors.commands + factors.assertions + factors.hooks * 3 + factors.pageObjects * 5;
  
  return {
    score,
    level: score < 10 ? 'low' : score < 30 ? 'medium' : 'high',
    factors,
  };
}

function generateRecommendations(framework, astInfo) {
  const recommendations = [];
  
  if (framework.isPlaywright) {
    recommendations.push('✅ Already using Playwright - no migration needed');
    return recommendations;
  }

  if (framework.isMixed) {
    recommendations.push('⚠️ Mixed WDIO/Playwright code detected - complete the migration');
  }

  if (framework.isWdio) {
    recommendations.push('📦 Run migrate_to_playwright to convert this test');
  }

  const waitCommands = astInfo.commands.filter(c => 
    c.command.includes('wait') || c.command.includes('pause')
  );
  if (waitCommands.length > 0) {
    recommendations.push(`🕐 ${waitCommands.length} explicit waits found - Playwright auto-waits, most can be removed`);
  }

  const complexSelectors = astInfo.selectors.filter(s => 
    s.selector && (s.selector.includes('//') || s.selector.includes(':nth-child'))
  );
  if (complexSelectors.length > 0) {
    recommendations.push(`🎯 ${complexSelectors.length} complex selectors found - consider using data-test-id attributes`);
  }

  if (astInfo.pageObjectUsage.length > 0) {
    recommendations.push('📄 Page Objects detected - they need migration too');
  }

  if (astInfo.tags && astInfo.tags.length > 0) {
    const uniqueTags = [...new Set(astInfo.tags.map(t => t.tag))];
    recommendations.push(`🏷️ ${astInfo.tags.length} tags found [${uniqueTags.join(', ')}] - will be migrated to Playwright tag annotations`);
  }

  return recommendations;
}
