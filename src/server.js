/**
 * MCP Test Migration Server
 * 
 * Main server class following SOLID principles:
 * - Single Responsibility: Server setup and routing only
 * - Open/Closed: Extensible via handlers
 * - Dependency Inversion: Depends on abstractions (handlers)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { TOOL_DEFINITIONS } from './handlers/tools.js';
import {
  handleAnalyzeWdioTest,
  handleMigrateToPlaywright,
  handleRefactorToPom,
  handleGetPlaywrightDocs,
  handleCompareFrameworks,
  handleDetectProjectState,
  handleMigrateConfig,
  handleRegisterCustomCommands,
  handleGenerateMigrationReport,
} from './handlers/toolHandlers.js';

const VERSION = '2.1.0';

/**
 * MCP Test Migration Server
 */
export class TestMigrationServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-server-tests-migration',
        version: VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }));

    // Handle tool invocations
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await this.routeToolCall(name, args);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}\n\nStack: ${error.stack}`,
          }],
          isError: true,
        };
      }
    });
  }

  /**
   * Route tool calls to appropriate handlers
   * Open/Closed: Add new tools by adding cases
   */
  async routeToolCall(name, args) {
    const handlers = {
      'analyze_wdio_test': handleAnalyzeWdioTest,
      'migrate_to_playwright': handleMigrateToPlaywright,
      'refactor_to_pom': handleRefactorToPom,
      'get_playwright_docs': handleGetPlaywrightDocs,
      'compare_frameworks': handleCompareFrameworks,
      'detect_project_state': handleDetectProjectState,
      'migrate_config': handleMigrateConfig,
      'register_custom_commands': handleRegisterCustomCommands,
      'generate_migration_report': handleGenerateMigrationReport,
    };

    const handler = handlers[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await handler(args);
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Test Migration Server v${VERSION} running on stdio`);
  }
}

/**
 * Factory function for creating server instances
 */
export function createServer() {
  return new TestMigrationServer();
}
