/**
 * Constants for WDIO to Playwright migration
 */

export const PLAYWRIGHT_DOCS_VERSION = 'v1.57';

// Complete WDIO to Playwright command mappings
export const COMMAND_MAPPINGS = {
  // Element commands
  'setValue': { method: 'fill', description: 'Clears and fills input' },
  'addValue': { method: 'pressSequentially', description: 'Types without clearing' },
  'clearValue': { method: 'clear', description: 'Clears input field' },
  'getValue': { method: 'inputValue', description: 'Gets input value' },
  'getText': { method: 'textContent', description: 'Gets element text' },
  'getHTML': { method: 'innerHTML', description: 'Gets inner HTML' },
  'getAttribute': { method: 'getAttribute', description: 'Gets attribute value' },
  'click': { method: 'click', description: 'Clicks element' },
  'doubleClick': { method: 'dblclick', description: 'Double clicks element' },
  'moveTo': { method: 'hover', description: 'Hovers over element' },
  'scrollIntoView': { method: 'scrollIntoViewIfNeeded', description: 'Scrolls element into view' },
  'isDisplayed': { method: 'isVisible', description: 'Checks visibility' },
  'isEnabled': { method: 'isEnabled', description: 'Checks if enabled' },
  'isSelected': { method: 'isChecked', description: 'Checks if selected/checked' },
  'isExisting': { method: 'count', description: 'Checks existence (count > 0)' },
  'waitForDisplayed': { method: 'waitFor', options: '{ state: "visible" }', description: 'Waits for visibility' },
  'waitForClickable': { method: 'waitFor', options: '{ state: "visible" }', description: 'Waits for clickable state' },
  'waitForExist': { method: 'waitFor', options: '{ state: "attached" }', description: 'Waits for existence' },
  'waitForEnabled': { method: 'waitFor', options: '{ state: "visible" }', description: 'Waits for enabled state' },
  'selectByVisibleText': { method: 'selectOption', description: 'Selects dropdown option by text' },
  'selectByIndex': { method: 'selectOption', description: 'Selects dropdown option by index' },
  'selectByAttribute': { method: 'selectOption', description: 'Selects dropdown option by attribute' },
  
  // Browser commands
  'browser.url': { method: 'page.goto', description: 'Navigates to URL' },
  'browser.getUrl': { method: 'page.url', description: 'Gets current URL' },
  'browser.getTitle': { method: 'page.title', description: 'Gets page title' },
  'browser.pause': { method: 'page.waitForTimeout', description: 'Pauses execution' },
  'browser.debug': { method: 'page.pause', description: 'Opens Playwright inspector' },
  'browser.execute': { method: 'page.evaluate', description: 'Executes JavaScript' },
  'browser.executeAsync': { method: 'page.evaluate', description: 'Executes async JavaScript' },
  'browser.keys': { method: 'page.keyboard.press', description: 'Presses keyboard keys' },
  'browser.refresh': { method: 'page.reload', description: 'Reloads page' },
  'browser.back': { method: 'page.goBack', description: 'Navigates back' },
  'browser.forward': { method: 'page.goForward', description: 'Navigates forward' },
  'browser.deleteCookies': { method: 'context.clearCookies', description: 'Clears cookies' },
  'browser.getCookies': { method: 'context.cookies', description: 'Gets cookies' },
  'browser.setCookies': { method: 'context.addCookies', description: 'Sets cookies' },
  'browser.newWindow': { method: 'context.newPage', description: 'Opens new window/tab' },
  'browser.switchWindow': { method: 'page.bringToFront', description: 'Switches to window' },
  'browser.closeWindow': { method: 'page.close', description: 'Closes window' },
  'browser.getWindowHandles': { method: 'context.pages', description: 'Gets all page handles' },
  'browser.getWindowHandle': { method: 'page', description: 'Gets current page handle' },
  'browser.switchToFrame': { method: 'page.frameLocator', description: 'Switches to frame' },
  'browser.switchToParentFrame': { method: 'page.mainFrame', description: 'Switches to parent frame' },
  'browser.acceptAlert': { method: 'page.on("dialog")', description: 'Accepts dialog' },
  'browser.dismissAlert': { method: 'page.on("dialog")', description: 'Dismisses dialog' },
  'browser.getAlertText': { method: 'dialog.message', description: 'Gets dialog text' },
  'browser.sendAlertText': { method: 'dialog.accept', description: 'Sends text to dialog' },
  'browser.takeScreenshot': { method: 'page.screenshot', description: 'Takes screenshot' },
  'browser.saveScreenshot': { method: 'page.screenshot', options: '{ path: "..." }', description: 'Saves screenshot' },
  'browser.uploadFile': { method: 'locator.setInputFiles', description: 'Uploads file' },
};

// Selector transformation patterns
export const SELECTOR_PATTERNS = {
  dataTestId: /\[data-test-id=['"]([^'"]+)['"]\]/,
  id: /^#([\w-]+)$/,
  class: /^\.([\w-]+)$/,
  tag: /^(\w+)$/,
  ariaLabel: /\[aria-label=['"]([^'"]+)['"]\]/,
  role: /\[role=['"]([^'"]+)['"]\]/,
  placeholder: /\[placeholder=['"]([^'"]+)['"]\]/,
  name: /\[name=['"]([^'"]+)['"]\]/,
  type: /\[type=['"]([^'"]+)['"]\]/,
};

// Tag patterns for WDIO tests - matches [TAG], @tag, #tag formats
export const TAG_PATTERNS = [
  /\[([A-Z0-9_-]+)\]/g,  // [SMOKE], [REGRESSION], [P1]
  /@(\w+)/g,              // @smoke, @regression
  /#(\w+)/g,              // #smoke, #regression
];
