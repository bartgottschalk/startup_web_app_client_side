import { test, expect } from '@playwright/test';

/**
 * Helper function to run QUnit tests in a page
 */
async function runQUnitTests(page, testFile, testName) {
  await page.goto(`/unittests/${testFile}`);

  // Wait for QUnit to finish
  await page.waitForSelector('#qunit-testresult', { timeout: 30000 });

  // Get test results
  const result = await page.evaluate(() => {
    const banner = document.querySelector('#qunit-banner');
    const testResult = document.querySelector('#qunit-testresult .total');
    const failed = document.querySelector('#qunit-testresult .failed');
    const passed = document.querySelector('#qunit-testresult .passed');

    return {
      success: banner?.className === 'qunit-pass',
      total: testResult?.textContent || '0',
      failed: failed?.textContent || '0',
      passed: passed?.textContent || '0',
      details: document.querySelector('#qunit-testresult')?.textContent || ''
    };
  });

  // Get failed test details if any
  if (!result.success) {
    const failedTests = await page.evaluate(() => {
      const failed = Array.from(document.querySelectorAll('#qunit-tests > li.fail'));
      return failed.map(test => {
        const name = test.querySelector('.test-name')?.textContent || 'Unknown test';
        const message = test.querySelector('.test-message')?.textContent || 'No message';
        return `  - ${name}: ${message}`;
      }).join('\n');
    });

    console.error(`\n${testName} FAILED:\n${result.details}\n\nFailed tests:\n${failedTests}`);
  } else {
    console.log(`✓ ${testName}: ${result.passed} passed, ${result.failed} failed`);
  }

  expect(result.success).toBe(true);
}

test('QUnit: Checkout Confirm Tests', async ({ page }) => {
  await runQUnitTests(page, 'checkout_confirm_tests.html', 'Checkout Confirm Tests');
});

test('QUnit: Index Tests', async ({ page }) => {
  await runQUnitTests(page, 'index_tests.html', 'Index Tests');
});
