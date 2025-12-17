// Playwright configuration for QUnit tests
export default {
  testDir: './playwright-tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
  },
  reporter: [['list']],
};
