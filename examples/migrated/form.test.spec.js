import { test, expect } from '@playwright/test';

test.describe('Contact Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com/contact');
  });

  test('should submit contact form successfully', async ({ page }) => {
    await page.locator('#name').fill('John Doe');
    await page.locator('#email').fill('john.doe@example.com');
    await page.locator('#message').fill('This is a test message for the contact form.');

    await page.locator('button[type="submit"]').click();

    await page.locator('.success-notification').waitFor({ state: 'visible', timeout: 3000 });

    await expect(page.locator('.success-notification')).toContainText('Thank you for your message');
  });

  test('should validate email format', async ({ page }) => {
    await page.locator('#email').fill('invalid-email');
    await page.locator('button[type="submit"]').click();

    await page.locator('#email-error').waitFor({ state: 'visible' });

    await expect(page.locator('#email-error')).toHaveText('Please enter a valid email address');
  });

  test('should clear form when reset button is clicked', async ({ page }) => {
    await page.locator('#name').fill('Test Name');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#message').fill('Test message');

    await page.locator('button[type="reset"]').click();

    await expect(page.locator('#name')).toHaveValue('');
    await expect(page.locator('#email')).toHaveValue('');
    await expect(page.locator('#message')).toHaveValue('');
  });
});
