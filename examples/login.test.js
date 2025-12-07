const { expect } = require('chai');

describe('Login Page Tests', () => {
  beforeEach(async () => {
    await browser.url('https://example.com/login');
  });

  it('should login with valid credentials', async () => {
    await $('#username').setValue('testuser@example.com');
    await $('#password').setValue('SecurePass123!');
    await $('button[type="submit"]').click();

    await $('[data-test-id="dashboard"]').waitForDisplayed({ timeout: 5000 });

    const welcomeText = await $('.welcome-message').getText();
    expect(welcomeText).to.include('Welcome back');
  });

  it('should show error with invalid credentials', async () => {
    await $('#username').setValue('invalid@example.com');
    await $('#password').setValue('wrongpassword');
    await $('button[type="submit"]').click();
    
    await $('.error-message').waitForDisplayed();
    
    const errorText = await $('.error-message').getText();
    expect(errorText).to.equal('Invalid username or password');
  });

  it('should validate required fields', async () => {
    await $('button[type="submit"]').click();
    
    const usernameError = await $('#username-error').getText();
    const passwordError = await $('#password-error').getText();
    
    expect(usernameError).to.equal('Username is required');
    expect(passwordError).to.equal('Password is required');
  });
});
