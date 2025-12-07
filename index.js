#!/usr/bin/env node

/**
 * MCP Test Migration Server
 * Entry point for CLI usage
 * 
 * This server helps migrate WebDriverIO tests to Playwright
 * using AST-based transformations.
 */

import { TestMigrationServer, createServer } from './src/index.js';

// Export for HTTP server and programmatic usage
export { TestMigrationServer, createServer };

// Re-export utilities for direct usage
export * from './src/index.js';

// Run as CLI if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const server = new TestMigrationServer();
  server.run().catch(console.error);
}
