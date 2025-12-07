# MCP Client Configuration Examples

This document shows how to configure various MCP clients to connect to the Test Migration Server.

## Local Mode (stdio)

For running the server locally on the same machine.

### Claude Desktop / GitHub Copilot

Add to your MCP configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tests-migration": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-tests-migration/index.js"],
      "env": {}
    }
  }
}
```

### Using npx (if published to npm)

```json
{
  "mcpServers": {
    "tests-migration": {
      "command": "npx",
      "args": ["-y", "mcp-server-tests-migration"]
    }
  }
}
```

### Using Docker with stdio

```json
{
  "mcpServers": {
    "tests-migration": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "mcp-server-tests-migration:2.1.0",
        "node",
        "index.js"
      ]
    }
  }
}
```

---

## Remote Mode (HTTP - Streamable HTTP Transport)

For connecting to a remote server running in Docker or on another machine.

### HTTP Transport Configuration (Recommended)

For MCP clients that support Streamable HTTP transport:

```json
{
  "mcpServers": {
    "tests-migration": {
      "transport": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Remote Server (replace with your server address)

```json
{
  "mcpServers": {
    "tests-migration": {
      "transport": "http",
      "url": "http://your-server.example.com:3000/mcp"
    }
  }
}
```

### With Authentication (if behind a proxy)

```json
{
  "mcpServers": {
    "tests-migration": {
      "transport": "http",
      "url": "https://your-server.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-api-token"
      }
    }
  }
}
```

### Legacy SSE Transport

For older MCP clients that only support SSE:

```json
{
  "mcpServers": {
    "tests-migration": {
      "transport": "sse",
      "url": "http://localhost:3000/sse"
    }
  }
}
```
```

---

## Environment-Specific Examples

### Development (Local)

```json
{
  "mcpServers": {
    "tests-migration-dev": {
      "command": "node",
      "args": ["/home/user/projects/mcp-server-tests-migration/index.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Production (Docker on remote server)

```json
{
  "mcpServers": {
    "tests-migration-prod": {
      "transport": "http",
      "url": "https://mcp-migration.yourcompany.com/mcp"
    }
  }
}
```

### Multiple Environments

```json
{
  "mcpServers": {
    "tests-migration-local": {
      "command": "node",
      "args": ["/path/to/mcp-server-tests-migration/index.js"]
    },
    "tests-migration-remote": {
      "transport": "http",
      "url": "http://migration-server:3000/mcp"
    }
  }
}
```

---

## Docker Deployment Commands

### Start the server

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or using docker directly
docker run -d \
  --name mcp-migration \
  -p 3000:3000 \
  --restart unless-stopped \
  mcp-server-tests-migration:2.1.0
```

### Verify it's running

```bash
curl http://localhost:3000/health
# {"status":"healthy","version":"2.1.0","service":"mcp-server-tests-migration"}
```

### View logs

```bash
docker logs mcp-migration
```

### Stop the server

```bash
docker-compose down
# or
docker stop mcp-migration
```

---

## Testing the Connection

### Test stdio mode

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node index.js
```

### Test HTTP mode

```bash
# Health check
curl http://localhost:3000/health

# List available endpoints
curl http://localhost:3000/

# Test analyze endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "testContent": "describe(\"Test\", () => { it(\"works\", async () => { await $(\"#btn\").click(); }); });"
  }'
```

---

## Troubleshooting

### Connection refused
- Ensure the server is running: `docker ps` or check process
- Verify port is not blocked by firewall
- Check the correct port (default: 3000)

### SSE connection drops
- Check network stability
- Verify no proxy is timing out the connection
- Increase timeout settings if available

### Permission denied (Docker)
- Ensure Docker socket permissions
- Run with appropriate user permissions

### Module not found
- Run `npm install` in the project directory
- Ensure Node.js 18+ is installed
