/**
 * Config Migration Utilities
 * Single Responsibility: Migrate WDIO config to Playwright config
 */

/**
 * Parse WDIO config to extract settings
 * @param {string} content - wdio.conf.js content
 * @returns {Object} Extracted settings
 */
export function parseWdioConfig(content) {
  const settings = {
    baseUrl: null,
    specs: [],
    capabilities: [],
    timeout: null,
    reporters: [],
    framework: null,
  };

  // Extract baseUrl
  const baseUrlMatch = content.match(/baseUrl:\s*['"]([^'"]+)['"]/);
  if (baseUrlMatch) settings.baseUrl = baseUrlMatch[1];

  // Extract specs pattern
  const specsMatch = content.match(/specs:\s*\[([\s\S]*?)\]/);
  if (specsMatch) {
    const specPatterns = specsMatch[1].match(/['"]([^'"]+)['"]/g);
    if (specPatterns) {
      settings.specs = specPatterns.map(s => s.replace(/['"]/g, ''));
    }
  }

  // Extract timeout
  const timeoutMatch = content.match(/waitforTimeout:\s*(\d+)/);
  if (timeoutMatch) settings.timeout = parseInt(timeoutMatch[1]);

  // Extract capabilities (browsers)
  if (content.includes('chrome')) settings.capabilities.push('chromium');
  if (content.includes('firefox')) settings.capabilities.push('firefox');
  if (content.includes('safari') || content.includes('webkit')) settings.capabilities.push('webkit');

  // Extract reporters
  if (content.includes('spec')) settings.reporters.push('list');
  if (content.includes('allure')) settings.reporters.push('html');
  if (content.includes('junit')) settings.reporters.push('junit');

  return settings;
}

/**
 * Generate Playwright config from WDIO settings
 * @param {Object} wdioSettings - Parsed WDIO settings
 * @returns {string} Playwright config content
 */
export function generatePlaywrightConfig(wdioSettings) {
  const capabilities = wdioSettings.capabilities.length > 0 ? wdioSettings.capabilities : ['chromium'];
  
  const projects = capabilities.map(browser => {
    const device = browser === 'chromium' ? 'Desktop Chrome' : 
                   browser === 'firefox' ? 'Desktop Firefox' : 'Desktop Safari';
    return `    {
      name: '${browser}',
      use: { ...devices['${device}'] },
    }`;
  }).join(',\n');

  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: '${wdioSettings.baseUrl || 'http://localhost:3000'}',
    testIdAttribute: 'data-test-id',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ${wdioSettings.timeout ? `actionTimeout: ${wdioSettings.timeout},` : ''}
  },

  projects: [
${projects}
  ],
});
`;
}

/**
 * Merge WDIO settings into existing Playwright config
 * @param {string} existingConfig - Existing playwright.config content
 * @param {Object} wdioSettings - Parsed WDIO settings
 * @returns {string} Merged config content
 */
export function mergePlaywrightConfig(existingConfig, wdioSettings) {
  let merged = existingConfig;

  if (wdioSettings.baseUrl && !existingConfig.includes('baseURL')) {
    merged = merged.replace(
      /use:\s*{/,
      `use: {\n    baseURL: '${wdioSettings.baseUrl}',`
    );
  }

  if (!existingConfig.includes('testIdAttribute')) {
    merged = merged.replace(
      /use:\s*{/,
      `use: {\n    testIdAttribute: 'data-test-id',`
    );
  }

  return merged;
}

/**
 * Parse existing Playwright config
 * @param {string} content - playwright.config content
 * @returns {Object} Parsed config
 */
export function parsePlaywrightConfig(content) {
  const config = {
    testDir: null,
    baseURL: null,
    testIdAttribute: null,
    projects: [],
  };

  const testDirMatch = content.match(/testDir:\s*['"]([^'"]+)['"]/);
  if (testDirMatch) config.testDir = testDirMatch[1];

  const baseURLMatch = content.match(/baseURL:\s*['"]([^'"]+)['"]/);
  if (baseURLMatch) config.baseURL = baseURLMatch[1];

  const testIdMatch = content.match(/testIdAttribute:\s*['"]([^'"]+)['"]/);
  if (testIdMatch) config.testIdAttribute = testIdMatch[1];

  return config;
}
