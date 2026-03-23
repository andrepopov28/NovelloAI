import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';

// Load UAT env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env.uat') });

export default defineConfig({
    testDir: './',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Ensure sequential stable tests mapped to the single seeded user
    reporter: [
        ['html', { outputFolder: '../artifacts/playwright-report' }],
        ['junit', { outputFile: '../artifacts/junit-headed.xml' }]
    ],
    // Force 30s timeout per test
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        }
    ],
});
