const { expect } = require('chai');

describe('Contact Form Tests', () => {
  before(async () => {
    await browser.url('https://example.com/contact');
  });

  it('should submit contact form successfully', async () => {
    const nameInput = await $('#name');
    const emailInput = await $('#email');
    const messageInput = await $('#message');
    const submitButton = await $('button[type="submit"]');
    
    await nameInput.setValue('John Doe');
    await emailInput.setValue('john.doe@example.com');
    await messageInput.setValue('This is a test message for the contact form.');
    
    await submitButton.click();
    
    await $('.success-notification').waitForDisplayed({ timeout: 3000 });
    
    const successText = await $('.success-notification').getText();
    expect(successText).to.contain('Thank you for your message');
  });

  it('should validate email format', async () => {
    await $('#email').setValue('invalid-email');
    await $('button[type="submit"]').click();
    
    const emailError = await $('#email-error');
    await emailError.waitForDisplayed();
    
    expect(await emailError.getText()).to.equal('Please enter a valid email address');
  });

  it('should clear form when reset button is clicked', async () => {
    await $('#name').setValue('Test Name');
    await $('#email').setValue('test@example.com');
    await $('#message').setValue('Test message');
    
    await $('button[type="reset"]').click();
    
    expect(await $('#name').getValue()).to.equal('');
    expect(await $('#email').getValue()).to.equal('');
    expect(await $('#message').getValue()).to.equal('');
  });
});
