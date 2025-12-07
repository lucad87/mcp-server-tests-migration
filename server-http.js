#!/usr/bin/env node

/**
 * HTTP Server wrapper for MCP Test Migration Server
 * Allows remote access via HTTP for Docker deployment
 * 
 * Supports both:
 * - /mcp - Streamable HTTP transport (recommended)
 * - /sse - SSE transport (legacy compatibility)
 */

import express from 'express';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

// Import handlers for REST API
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
} from './src/handlers/toolHandlers.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Store active transports for session management
const transports = {};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '2.1.0',
    service: 'mcp-server-tests-migration'
  });
});

// =============================================================================
// MCP Streamable HTTP Transport (recommended - /mcp endpoint)
// =============================================================================

app.post('/mcp', async (req, res) => {
  console.log('MCP request received');
  
  try {
    // Check for existing session
    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session - create transport
      const newSessionId = randomUUID();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
      });
      transports[newSessionId] = transport;

      // Create and connect server
      const { TestMigrationServer } = await import('./index.js');
      const server = new TestMigrationServer();
      await server.server.connect(transport);

      console.log(`New MCP session: ${newSessionId}`);
    } else if (!sessionId) {
      // No session and not initialize request
      res.status(400).json({ 
        error: 'Bad Request',
        message: 'Missing mcp-session-id header for non-initialize request'
      });
      return;
    } else {
      // Session ID provided but not found
      res.status(404).json({
        error: 'Session not found',
        message: 'Invalid or expired session ID'
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle GET for SSE stream on /mcp (for streaming responses)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Handle DELETE to close session
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  
  if (sessionId && transports[sessionId]) {
    const transport = transports[sessionId];
    await transport.close();
    delete transports[sessionId];
    console.log(`Session closed: ${sessionId}`);
    res.status(200).json({ message: 'Session closed' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// =============================================================================
// SSE Transport (legacy compatibility - /sse endpoint)
// =============================================================================

app.get('/sse', async (req, res) => {
  console.log('New SSE connection');
  
  const transport = new SSEServerTransport('/messages', res);
  const sessionId = randomUUID();
  transports[sessionId] = transport;

  const { TestMigrationServer } = await import('./index.js');
  const server = new TestMigrationServer();
  
  await server.server.connect(transport);
  
  req.on('close', () => {
    console.log('SSE connection closed');
    delete transports[sessionId];
  });
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  
  if (transport && transport.handlePostMessage) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// =============================================================================
// Direct REST API (alternative to MCP protocol)
// =============================================================================

app.post('/api/analyze', async (req, res) => {
  try {
    const { testContent, filePath } = req.body;
    if (!testContent) {
      return res.status(400).json({ error: 'testContent is required' });
    }
    
    const result = await handleAnalyzeWdioTest({ testContent, filePath });
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/migrate', async (req, res) => {
  try {
    const { testContent, filePath, outputFormat, analysisResult } = req.body;
    if (!testContent) {
      return res.status(400).json({ error: 'testContent is required' });
    }
    
    const result = await handleMigrateToPlaywright({ 
      testContent, 
      filePath, 
      outputFormat,
      analysisResult 
    });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/refactor-pom', async (req, res) => {
  try {
    const { testContent, filePath, existingPageObjects } = req.body;
    if (!testContent) {
      return res.status(400).json({ error: 'testContent is required' });
    }
    
    const result = await handleRefactorToPom({ testContent, filePath, existingPageObjects });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/compare', async (req, res) => {
  try {
    const { wdioCommand } = req.body;
    if (!wdioCommand) {
      return res.status(400).json({ error: 'wdioCommand is required' });
    }
    
    const result = await handleCompareFrameworks({ wdioCommand });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docs/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    
    const result = await handleGetPlaywrightDocs({ topic });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/detect-project', async (req, res) => {
  try {
    const { projectFiles } = req.body;
    if (!projectFiles) {
      return res.status(400).json({ error: 'projectFiles is required' });
    }
    
    const result = await handleDetectProjectState({ 
      projectFiles: typeof projectFiles === 'string' ? projectFiles : JSON.stringify(projectFiles) 
    });
    res.json(JSON.parse(result.content[0].text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/migrate-config', async (req, res) => {
  try {
    const { wdioConfig, existingPlaywrightConfig } = req.body;
    if (!wdioConfig) {
      return res.status(400).json({ error: 'wdioConfig is required' });
    }
    
    const result = await handleMigrateConfig({ wdioConfig, existingPlaywrightConfig });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/register-commands', async (req, res) => {
  try {
    const { commands } = req.body;
    if (!commands) {
      return res.status(400).json({ error: 'commands is required' });
    }
    
    const result = await handleRegisterCustomCommands({ 
      commands: typeof commands === 'string' ? commands : JSON.stringify(commands) 
    });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { migratedTests, projectName } = req.body;
    if (!migratedTests) {
      return res.status(400).json({ error: 'migratedTests is required' });
    }
    
    const result = await handleGenerateMigrationReport({ 
      migratedTests: typeof migratedTests === 'string' ? migratedTests : JSON.stringify(migratedTests),
      projectName 
    });
    res.json({ result: result.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'MCP Test Migration Server',
    version: '2.1.0',
    description: 'HTTP API for migrating WebDriverIO tests to Playwright',
    endpoints: {
      health: 'GET /health',
      mcp: {
        description: 'MCP Streamable HTTP transport (recommended)',
        initialize: 'POST /mcp - Send initialize request to start session',
        request: 'POST /mcp with mcp-session-id header',
        stream: 'GET /mcp with mcp-session-id header (for SSE streaming)',
        close: 'DELETE /mcp with mcp-session-id header',
      },
      sse: {
        description: 'Legacy SSE transport',
        connect: 'GET /sse',
        message: 'POST /messages?sessionId=...',
      },
      api: {
        description: 'Direct REST API (no MCP protocol needed)',
        analyze: 'POST /api/analyze { testContent, filePath? }',
        migrate: 'POST /api/migrate { testContent, filePath?, outputFormat?, analysisResult? }',
        refactorPom: 'POST /api/refactor-pom { testContent, filePath?, existingPageObjects? }',
        compare: 'POST /api/compare { wdioCommand }',
        docs: 'GET /api/docs/:topic',
        detectProject: 'POST /api/detect-project { projectFiles }',
        migrateConfig: 'POST /api/migrate-config { wdioConfig, existingPlaywrightConfig? }',
        registerCommands: 'POST /api/register-commands { commands }',
        generateReport: 'POST /api/generate-report { migratedTests, projectName? }',
      }
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`MCP Test Migration Server v2.1.0 (HTTP) running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp (recommended)`);
  console.log(`SSE endpoint: http://${HOST}:${PORT}/sse (legacy)`);
  console.log(`API docs: http://${HOST}:${PORT}/`);
});
