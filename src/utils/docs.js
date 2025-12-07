/**
 * Playwright Documentation Provider
 * Single Responsibility: Provide Playwright documentation
 */

import { PLAYWRIGHT_DOCS_VERSION } from '../constants/mappings.js';

const DOCS = {
  selectors: `# Playwright Selectors (${PLAYWRIGHT_DOCS_VERSION})

Playwright supports multiple selector strategies, prioritized by reliability:

## Recommended Selectors (most reliable first):

1. **Test IDs** (data-test-id): \`page.getByTestId('submit-button')\`
   - Configure in playwright.config.ts: \`testIdAttribute: 'data-test-id'\`
   - Most reliable, decoupled from implementation

2. **Role Selectors**: \`page.getByRole('button', { name: 'Submit' })\`
   - Accessibility-friendly, resilient to DOM changes

3. **Label Selectors**: \`page.getByLabel('Email address')\`
   - For form inputs with labels

4. **Placeholder**: \`page.getByPlaceholder('Enter email')\`
   - For inputs with placeholder text

5. **Text Selectors**: \`page.getByText('Welcome')\`
   - For visible text content

6. **CSS Selectors**: \`page.locator('button.submit')\`
   - Fallback, tied to implementation

## Configuration for data-test-id:

\`\`\`typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    testIdAttribute: 'data-test-id',
  },
});
\`\`\`

## Best Practices:
- Prefer data-test-id for elements without semantic meaning
- Use role selectors for interactive elements
- Avoid CSS selectors tied to styling
- Avoid XPath when possible

Reference: https://playwright.dev/docs/locators
`,

  assertions: `# Playwright Assertions (${PLAYWRIGHT_DOCS_VERSION})

## Web-First Assertions (auto-retry):

\`\`\`javascript
// Visibility
await expect(page.locator('.status')).toBeVisible();
await expect(page.locator('.modal')).toBeHidden();

// Text content
await expect(page.locator('.title')).toHaveText('Welcome');
await expect(page.locator('.title')).toContainText('Welcome');

// Input values
await expect(page.locator('#email')).toHaveValue('test@example.com');
await expect(page.locator('#email')).toBeEmpty();

// Attributes
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('input')).toHaveAttribute('type', 'email');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// Page assertions
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle(/Dashboard/);
\`\`\`

## Key Features:
- Auto-wait and retry until condition is met (default 5s)
- No need for explicit waits
- Clear error messages on failure
- Configurable timeout: \`expect(locator).toBeVisible({ timeout: 10000 })\`

Reference: https://playwright.dev/docs/test-assertions
`,

  fixtures: `# Playwright Fixtures (${PLAYWRIGHT_DOCS_VERSION})

## Built-in Fixtures:

\`\`\`javascript
import { test, expect } from '@playwright/test';

test('example', async ({ page, context, browser, request }) => {
  // page - isolated page instance
  // context - browser context (for cookies, storage)
  // browser - browser instance
  // request - API testing
  await page.goto('https://example.com');
});
\`\`\`

## Custom Fixtures:

\`\`\`javascript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user', 'password');
    await use(page);
  },
  
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

test('dashboard test', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.locator('.dashboard')).toBeVisible();
});
\`\`\`

Reference: https://playwright.dev/docs/test-fixtures
`,

  'page-object-model': `# Playwright Page Object Model (${PLAYWRIGHT_DOCS_VERSION})

## Page Object Class:

\`\`\`javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = page.getByTestId('username-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
\`\`\`

## Test Using Page Object:

\`\`\`javascript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login', async ({ page }) => {
    await loginPage.login('user', 'password');
    await expect(page).toHaveURL('/dashboard');
  });
});
\`\`\`

## Best Practices:
- One page object per page/component
- Use descriptive method names
- Keep assertions in tests, not page objects
- Use data-test-id attributes

Reference: https://playwright.dev/docs/pom
`,

  'auto-waiting': `# Playwright Auto-Waiting (${PLAYWRIGHT_DOCS_VERSION})

Playwright automatically waits for elements before performing actions.

## Actions that auto-wait:
- click() - waits for element to be visible and enabled
- fill() - waits for element to be visible and editable
- check() - waits for checkbox to be visible
- selectOption() - waits for select to be visible

## No need for:
\`\`\`javascript
// DON'T DO THIS - Playwright handles it
await page.waitForSelector('#button');
await page.click('#button');

// DO THIS - auto-waits automatically
await page.locator('#button').click();
\`\`\`

## When you still need waits:
\`\`\`javascript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific response
await page.waitForResponse(resp => resp.url().includes('/api/data'));

// Wait for element state (rarely needed)
await page.locator('.loading').waitFor({ state: 'hidden' });
\`\`\`

Reference: https://playwright.dev/docs/actionability
`,

  configuration: `# Playwright Configuration (${PLAYWRIGHT_DOCS_VERSION})

## playwright.config.ts

\`\`\`typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    testIdAttribute: 'data-test-id',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
\`\`\`

Reference: https://playwright.dev/docs/test-configuration
`,
};

/**
 * Get Playwright documentation for a topic
 * @param {string} topic - Documentation topic
 * @returns {string} Documentation content
 */
export function getPlaywrightDocs(topic) {
  const doc = DOCS[topic.toLowerCase()];
  
  if (doc) {
    return doc;
  }
  
  return `Documentation for "${topic}" not found.

Available topics: ${Object.keys(DOCS).join(', ')}

Please refer to official Playwright documentation at: https://playwright.dev/docs/intro`;
}
