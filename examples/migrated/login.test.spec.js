import { test, expect } from '@playwright/test';

test.describe('Login Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.locator('#username').fill('testuser@example.com');
    await page.locator('#password').fill('SecurePass123!');
    await page.locator('button[type="submit"]').click();

    await page.getByTestId('dashboard').waitFor({ state: 'visible', timeout: 5000 });

    await expect(page.locator('.welcome-message')).toContainText('Welcome back');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.locator('#username').fill('invalid@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await page.locator('.error-message').waitFor({ state: 'visible' });

    await expect(page.locator('.error-message')).toHaveText('Invalid username or password');
  });

  test('should validate required fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('#username-error')).toHaveText('Username is required');
    await expect(page.locator('#password-error')).toHaveText('Password is required');
  });
});
