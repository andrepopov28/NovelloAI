import { test, expect } from '@playwright/test';
import { loginUAT, applyNoEgressGuard, seedData } from './test-helper';

test.beforeEach(async ({ page }) => {
    applyNoEgressGuard(page);
    await loginUAT(page);
    await page.goto(`/project/${seedData.projectId}/codex`);
    await page.waitForLoadState('networkidle');
});

test.describe('Codex Flow', () => {

    test('loads codex and displays seeded entity', async ({ page }) => {
        await expect(page.locator('text=The UAT AI')).toBeVisible({ timeout: 10000 });
    });

    test('can open add entity modal', async ({ page }) => {
        await page.click('button:has-text("Add Entry")');
        await expect(page.locator('text=New Codex Entry')).toBeVisible();
        await page.fill('input[placeholder="Name"]', 'Test Entity');
        await page.click('button:has-text("Cancel")');
    });

    test('can open entity details drawer', async ({ page }) => {
        // Assuming clicking the entity opens detail drawer
        await page.click('text=The UAT AI');
        await expect(page.locator('text=A strict judge and creator')).toBeVisible();
        await page.click('button[aria-label="Close"]'); // Or similar close action
    });
});
