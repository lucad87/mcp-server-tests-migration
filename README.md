# MCP Server - Test Migration (WDIO to Playwright)

An MCP (Model Context Protocol) server that helps migrate test automation projects from WebDriverIO to Playwright test framework using AST-based transformations.

## Features

This MCP server provides specialized tools for a complete migration workflow:

### 1. **analyze_wdio_test**
Analyzes WebDriverIO test files using AST parsing and extracts:
- Import statements and dependencies
- Test structure (describe blocks, test cases)
- Selectors used (CSS, XPath, data-test-id, etc.)
- WDIO commands and patterns
- Assertions libraries
- Hooks (before, after, etc.)
- Page Object usage detection
- Framework detection (WDIO, Playwright, or mixed)
- Migration complexity assessment
- Modern selector suggestions (getByTestId, getByRole, etc.)

### 2. **migrate_to_playwright**
Migrates WDIO tests to Playwright using AST transformation:
- Converts WDIO syntax to Playwright syntax
- Updates selectors to use Playwright locators
- Suggests modern locators (getByTestId with `data-test-id`)
- Replaces WDIO commands with Playwright equivalents
- Uses latest Playwright v1.57 best practices
- Removes unnecessary explicit waits (leverages auto-waiting)
- Converts assertions to Playwright's expect
- Preserves already-migrated code (supports partial migrations)

### 3. **refactor_to_pom**
Refactors migrated tests to use Page Object Model:
- Extracts page interactions into page classes
- Generates actual locator properties from test code
- Creates reusable page object files
- Applies Playwright POM patterns
- Supports existing page objects

### 4. **get_playwright_docs**
Retrieves relevant Playwright documentation:
- Selectors and locators (with data-test-id examples)
- Assertions
- Fixtures
- Page Object Model
- Auto-waiting behavior
- Configuration

### 5. **compare_frameworks**
Provides side-by-side comparison:
- 50+ WDIO commands → Playwright equivalents
- Syntax differences
- Best practice recommendations
- Related commands table

### 6. **detect_project_state** (NEW)
Analyzes project structure to detect:
- Existing Playwright configuration
- Existing WDIO configuration
- Already migrated tests
- Partially migrated tests
- Existing page objects
- Project directory structure
- Recommendations for migration strategy

### 7. **migrate_config**
Migrates wdio.conf.js to playwright.config.ts:
- Extracts baseUrl, specs, capabilities
- Generates proper Playwright config
- Sets `testIdAttribute: 'data-test-id'`
- Merges with existing Playwright config if present

### 8. **register_custom_commands** (NEW)
Registers project-specific custom WDIO commands:
- Add custom command → Playwright mappings
- Commands are used in subsequent migrations
- Persists during server session

### 9. **generate_migration_report** (NEW)
Generates comprehensive migration report as markdown:
- Migration statistics (total, migrated, pending, failed)
- Tags summary with Playwright grep commands
- File-by-file status
- Detailed test list with tags

## Tag Migration

The tool automatically migrates test tags from WDIO to Playwright format:

**WDIO (tags in description):**
```javascript
it('should login successfully [SMOKE] [P1]', async () => { ... });
it('should validate form @regression', async () => { ... });
```

**Playwright (tag annotations):**
```javascript
test('should login successfully', { tag: ['@smoke', '@p1'] }, async ({ page }) => { ... });
test('should validate form', { tag: ['@regression'] }, async ({ page }) => { ... });
```

Run tests by tag: `npx playwright test --grep @smoke`

## Installation

```bash
npm install
```

## Usage

### As MCP Server (stdio - Local)

Add to your MCP client configuration (e.g., Claude Desktop, GitHub Copilot):

```json
{
  "mcpServers": {
    "tests-migration": {
      "command": "node",
      "args": ["/path/to/mcp-server-tests-migration/index.js"]
    }
  }
}
```

### Standalone (stdio)

```bash
npm start
```

### HTTP Server (Remote/Docker)

Run the HTTP server for remote access:

```bash
npm run start:http
```

The server will be available at `http://localhost:3000`

### Docker Deployment

Build and run with Docker:

```bash
# Build image
npm run docker:build
# or
docker build -t mcp-server-tests-migration:2.1.0 .

# Run container
npm run docker:run
# or
docker run -p 3000:3000 mcp-server-tests-migration:2.1.0

# Using docker-compose
npm run docker:compose
# or
docker-compose up -d
```

### HTTP API Endpoints

When running in HTTP mode, the following endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API documentation |
| `/health` | GET | Health check |
| `/mcp` | POST | MCP Streamable HTTP (recommended) |
| `/mcp` | GET | MCP SSE stream for responses |
| `/mcp` | DELETE | Close MCP session |
| `/sse` | GET | Legacy SSE connection |
| `/api/analyze` | POST | Analyze WDIO test |
| `/api/migrate` | POST | Migrate to Playwright |
| `/api/refactor-pom` | POST | Refactor to Page Object Model |
| `/api/compare` | POST | Compare WDIO/Playwright commands |
| `/api/docs/:topic` | GET | Get Playwright documentation |
| `/api/detect-project` | POST | Detect project state |
| `/api/migrate-config` | POST | Migrate wdio.conf.js |
| `/api/register-commands` | POST | Register custom commands |
| `/api/generate-report` | POST | Generate migration report |

### HTTP API Examples

```bash
# Analyze a test
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"testContent": "const { expect } = require(\"chai\");\ndescribe(\"Test\", () => { it(\"works\", async () => { await $(\"#btn\").click(); }); });"}'

# Migrate a test
curl -X POST http://localhost:3000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"testContent": "...", "outputFormat": "typescript"}'

# Get Playwright docs
curl http://localhost:3000/api/docs/selectors
```

### Connecting MCP Clients to HTTP Server

For MCP clients that support Streamable HTTP transport (recommended):

```
http://your-server:3000/mcp
```

For legacy clients using SSE transport:

```
http://your-server:3000/sse
```

### Example Configuration Files

See the `examples/` directory for ready-to-use configuration files:

- `mcp-config-local.json` - Local stdio mode
- `mcp-config-http-local.json` - Local HTTP/SSE mode  
- `mcp-config-http-remote.json` - Remote HTTP/SSE mode
- `mcp-config-docker-stdio.json` - Docker with stdio

For detailed configuration options, see [docs/client-configuration.md](docs/client-configuration.md)

## Migration Workflow

### Step 0: Detect Project State (Recommended)
```javascript
// Use detect_project_state tool to understand current migration status
// Provides insights on existing Playwright config, migrated tests, page objects
```

### Step 1: Analyze
```javascript
// Use analyze_wdio_test tool with your WDIO test content
// This provides insights into the test structure and complexity
// Detects if test is already partially migrated
```

### Step 2: Migrate Config (if needed)
```javascript
// Use migrate_config tool to convert wdio.conf.js to playwright.config.ts
// Preserves existing Playwright config if present
```

### Step 3: Migrate Tests
```javascript
// Use migrate_to_playwright tool to convert to Playwright
// AST-based transformation preserves already-migrated code
// Tests will use direct page interactions (no POM yet)
```

### Step 4: Refactor to POM
```javascript
// Use refactor_to_pom tool to apply Page Object Model
// This creates maintainable, reusable page classes
// Reuses existing page objects if present
```

### Step 5: Verify
```javascript
// Use get_playwright_docs and compare_frameworks for reference
// Review and adjust generated code as needed
// Run tests: npx playwright test
```

## Example

**Original WDIO Test:**
```javascript
describe('Login Test', () => {
  it('should login successfully', async () => {
    await browser.url('https://example.com/login');
    await $('#username').setValue('testuser');
    await $('#password').setValue('testpass');
    await $('#login-button').click();
    await $('#dashboard').waitForDisplayed();
    expect(await $('#welcome-message').getText()).to.equal('Welcome!');
  });
});
```

**After Migration (Step 2):**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Login Test', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('https://example.com/login');
    await page.locator('#username').fill('testuser');
    await page.locator('#password').fill('testpass');
    await page.locator('#login-button').click();
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page.locator('#welcome-message')).toHaveText('Welcome!');
  });
});
```

**After POM Refactoring (Step 3):**
```javascript
// login.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login Test', () => {
  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser', 'testpass');
    await expect(loginPage.dashboardSection).toBeVisible();
    await expect(loginPage.welcomeMessage).toHaveText('Welcome!');
  });
});

// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.dashboardSection = page.locator('#dashboard');
    this.welcomeMessage = page.locator('#welcome-message');
  }

  async goto() {
    await this.page.goto('https://example.com/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## Key Migration Concepts

### WDIO → Playwright Mapping

| WDIO | Playwright |
|------|------------|
| `$('selector')` | `page.locator('selector')` or `page.getByTestId('id')` |
| `$$('selector')` | `page.locator('selector').all()` |
| `.setValue()` | `.fill()` |
| `.addValue()` | `.pressSequentially()` |
| `.click()` | `.click()` |
| `.getText()` | `.textContent()` |
| `.getValue()` | `.inputValue()` |
| `.waitForDisplayed()` | `.waitFor({ state: 'visible' })` or auto-waiting |
| `.moveTo()` | `.hover()` |
| `.scrollIntoView()` | `.scrollIntoViewIfNeeded()` |
| `.selectByVisibleText()` | `.selectOption()` |
| `browser.url()` | `page.goto()` |
| `browser.pause()` | `page.waitForTimeout()` |
| `browser.execute()` | `page.evaluate()` |
| `browser.keys()` | `page.keyboard.press()` |
| `browser.refresh()` | `page.reload()` |
| `browser.takeScreenshot()` | `page.screenshot()` |

### Playwright Advantages

1. **Auto-waiting**: No need for explicit waits in most cases
2. **Web-first assertions**: Built-in retry logic
3. **Modern selectors**: getByRole, getByText, getByLabel, getByTestId
4. **data-test-id support**: Configure with `testIdAttribute: 'data-test-id'`
5. **Better debugging**: Playwright Inspector, trace viewer
6. **Parallel execution**: Built-in support
7. **Multiple browsers**: Chromium, Firefox, WebKit
8. **AST-based migration**: Accurate code transformation

## Key Improvements in v2.0

- **AST-based parsing**: Uses Babel parser for accurate code analysis and transformation
- **Complete command mappings**: 50+ WDIO commands mapped to Playwright equivalents
- **Modern locator suggestions**: Recommends getByTestId, getByRole, getByLabel
- **data-test-id support**: Uses `data-test-id` attribute (configurable)
- **Partial migration support**: Detects and preserves already-migrated code
- **Project state detection**: Understands existing Playwright setup
- **Config migration**: Converts wdio.conf.js to playwright.config.ts
- **Smart POM generation**: Extracts actual selectors into page object classes
- **TypeScript output**: Full TypeScript support with type annotations
- **Tag migration**: Converts `[TAG]`, `@tag`, `#tag` to Playwright annotations
- **Custom commands**: Register project-specific WDIO commands
- **Migration reports**: Generate comprehensive markdown reports

## Requirements

- Node.js 18+
- @modelcontextprotocol/sdk
- @babel/parser, @babel/traverse, @babel/generator (for AST)
- express (for HTTP server)

## Project Structure

```
mcp-server-tests-migration/
├── index.js              # CLI entry point
├── server-http.js        # HTTP server (Docker/remote)
├── src/
│   ├── index.js          # Module exports
│   ├── server.js         # MCP server class
│   ├── constants/
│   │   └── mappings.js   # WDIO→Playwright command mappings
│   ├── handlers/
│   │   ├── tools.js      # Tool definitions (schema)
│   │   └── toolHandlers.js # Tool implementations
│   ├── transformers/
│   │   ├── migration.js  # AST-based migration
│   │   ├── pom.js        # Page Object Model
│   │   └── selectors.js  # Selector transformation
│   └── utils/
│       ├── config.js     # Config file parsing
│       ├── docs.js       # Playwright documentation
│       ├── parser.js     # AST parsing utilities
│       ├── report.js     # Migration report generation
│       └── tags.js       # Tag extraction utilities
├── examples/             # Example configs and tests
├── docs/                 # Documentation
├── Dockerfile
└── docker-compose.yml
```

## License

MIT

## Author

Luca Donnaloia

## Contributing

Contributions welcome! Please feel free to submit pull requests or open issues.

## Roadmap

- [x] AST-based parsing and transformation
- [x] Complete command mappings (50+)
- [x] Modern locator suggestions
- [x] Project state detection
- [x] Config migration
- [x] Partial migration support
- [x] TypeScript output support
- [x] Custom WDIO commands handling
- [x] Migrate tests tag `[TAG]`, `@tag`, `#tag` to Playwright tag annotations
- [x] Migration report generation with tags summary
- [x] SOLID principles refactoring
- [ ] WDIO services migration (custom services)
- [ ] Visual comparison of test coverage by tags
- [ ] Batch file processing
