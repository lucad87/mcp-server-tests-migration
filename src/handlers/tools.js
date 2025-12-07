/**
 * Tool Definitions
 * Single Responsibility: Define MCP tool schemas
 */

export const TOOL_DEFINITIONS = [
  {
    name: 'analyze_wdio_test',
    description: 'Analyzes a WebDriverIO test file using AST parsing and extracts detailed information about its structure, selectors, commands, and dependencies. Detects if test is already partially migrated to Playwright.',
    inputSchema: {
      type: 'object',
      properties: {
        testContent: {
          type: 'string',
          description: 'The complete content of the WDIO test file to analyze',
        },
        filePath: {
          type: 'string',
          description: 'Optional file path for context',
        },
      },
      required: ['testContent'],
    },
  },
  {
    name: 'migrate_to_playwright',
    description: 'Migrates a WebDriverIO test to Playwright syntax using AST transformation. Supports partial migrations and preserves already-migrated code. Uses modern Playwright locators (getByRole, getByLabel, getByTestId with data-test-id). Supports TypeScript output.',
    inputSchema: {
      type: 'object',
      properties: {
        testContent: {
          type: 'string',
          description: 'The WDIO test content to migrate',
        },
        analysisResult: {
          type: 'string',
          description: 'Optional JSON string of previous analysis result to use as context',
        },
        filePath: {
          type: 'string',
          description: 'Original file path for naming reference',
        },
        outputFormat: {
          type: 'string',
          enum: ['javascript', 'typescript'],
          description: 'Output format: javascript (default) or typescript',
        },
      },
      required: ['testContent'],
    },
  },
  {
    name: 'refactor_to_pom',
    description: 'Refactors a migrated Playwright test to use Page Object Model pattern. Extracts actual selectors and creates proper page object classes with methods.',
    inputSchema: {
      type: 'object',
      properties: {
        testContent: {
          type: 'string',
          description: 'The migrated Playwright test content to refactor',
        },
        filePath: {
          type: 'string',
          description: 'File path for generating appropriate page object names',
        },
        existingPageObjects: {
          type: 'string',
          description: 'Optional JSON string of existing page objects to extend or reuse',
        },
      },
      required: ['testContent'],
    },
  },
  {
    name: 'get_playwright_docs',
    description: 'Retrieves relevant Playwright documentation for specific features, commands, or concepts. Useful for understanding migration patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The Playwright feature or concept to get documentation for (e.g., "selectors", "assertions", "fixtures", "page-object-model")',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'compare_frameworks',
    description: 'Compares WDIO and Playwright commands/concepts side by side. Helps understand equivalent functionality.',
    inputSchema: {
      type: 'object',
      properties: {
        wdioCommand: {
          type: 'string',
          description: 'The WDIO command or pattern to find Playwright equivalent for',
        },
      },
      required: ['wdioCommand'],
    },
  },
  {
    name: 'detect_project_state',
    description: 'Analyzes project structure to detect existing Playwright configuration, migrated tests, page objects, and WDIO setup. Helps understand current migration state.',
    inputSchema: {
      type: 'object',
      properties: {
        projectFiles: {
          type: 'string',
          description: 'JSON string containing file paths and their contents to analyze',
        },
      },
      required: ['projectFiles'],
    },
  },
  {
    name: 'migrate_config',
    description: 'Migrates wdio.conf.js to playwright.config.ts. Preserves existing Playwright config if present.',
    inputSchema: {
      type: 'object',
      properties: {
        wdioConfig: {
          type: 'string',
          description: 'Content of wdio.conf.js file',
        },
        existingPlaywrightConfig: {
          type: 'string',
          description: 'Optional existing playwright.config.ts content to merge with',
        },
      },
      required: ['wdioConfig'],
    },
  },
  {
    name: 'register_custom_commands',
    description: 'Registers custom WDIO commands with their Playwright equivalents for migration. Allows handling project-specific custom commands.',
    inputSchema: {
      type: 'object',
      properties: {
        commands: {
          type: 'string',
          description: 'JSON string of custom command mappings: { "customCommand": { "method": "playwrightMethod", "description": "..." } }',
        },
      },
      required: ['commands'],
    },
  },
  {
    name: 'generate_migration_report',
    description: 'Generates a comprehensive migration report as a markdown file. Includes test files, tags, migration status, and statistics.',
    inputSchema: {
      type: 'object',
      properties: {
        migratedTests: {
          type: 'string',
          description: 'JSON string array of migrated test information with file paths, tags, and status',
        },
        projectName: {
          type: 'string',
          description: 'Name of the project for the report header',
        },
      },
      required: ['migratedTests'],
    },
  },
];
