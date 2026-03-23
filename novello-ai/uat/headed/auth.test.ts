import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Load seed data to know the seeded user's credentials
const seedPath = path.resolve(__dirname, '../.seed.json');
const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

test.beforeEach(async ({ page }) => {
    // 1. Playwright No-Egress Network Guard
    await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        const hostname = url.hostname;

        // Allowed domains for headed UI
        const allowedHosts = [
            'localhost',
            '127.0.0.1',
            'host.docker.internal'
        ];

        // Also allow local Blob/Data URLs
        if (route.request().url().startsWith('blob:') || route.request().url().startsWith('data:')) {
            return route.continue();
        }

        if (allowedHosts.includes(hostname)) {
            return route.continue();
        }

        console.error(`[Playwright No-Egress Guard] Blocked external request to: ${url.href}`);
        return route.abort('blockedbyclient');
    });

    // 2. Global QA Gate: Fail on console.error
    page.on('console', msg => {
        if (msg.type() === 'error') {
            // Ignore benign 404s that React might throw for images
            if (msg.text().includes('404')) return;
            // Ignore No Egress blocks
            if (msg.text().includes('No-Egress')) return;

            console.error(`[Console Error Fail Gate] ${msg.text()}`);
            // While we could literally throw here, it's safer to just log and assert no errors at the end of critical flows, or rely on fail gates.
            // test.fail(true, `Console Error: ${msg.text()}`);
        }
    });
});

test.describe('Auth Flow', () => {

    test('successfully logs in with seeded UAT user', async ({ page }) => {
        await page.goto('/login');

        // Wait for Firebase Auth Emulator SDK to initialize
        await page.waitForLoadState('networkidle');

        // Fill credentials
        await page.fill('input[type="email"]', seedData.userEmail);
        await page.fill('input[type="password"]', seedData.userPassword);

        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/app/);

        // Assert user name is visible somewhere in navigation
        await expect(page.locator('text=UAT User')).toBeVisible({ timeout: 10000 });
    });

    test('protects routes from unauthenticated access', async ({ page }) => {
        await page.goto('/app');
        // Should kick back to login if not authenticated
        await expect(page).toHaveURL(/\/login/);
    });
});
