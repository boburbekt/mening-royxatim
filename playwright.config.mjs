import { defineConfig } from '@playwright/test';

const phone = (name, width, height) => ({
  name,
  testMatch: /mobile-.*\.spec/,
  use: { viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
});

export default defineConfig({
  testDir: './tests',
  passWithNoTests: true,
  use: { baseURL: 'http://localhost:5179' },
  webServer: {
    command: 'python3 -m http.server 5179',
    url: 'http://localhost:5179',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  projects: [
    phone('phone-320', 320, 640),
    phone('phone-375', 375, 812),
    phone('phone-414', 414, 896),
    { name: 'desktop', testMatch: /(baseline|desktop-.*)\.spec/, use: { viewport: { width: 1200, height: 800 } } },
    {
      name: 'pwa',
      testMatch: /pwa\.spec/,
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
});
