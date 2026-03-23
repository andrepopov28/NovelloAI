import { test, expect } from '@playwright/test';
import { loginUAT, applyNoEgressGuard, seedData } from './test-helper';

test.beforeEach(async ({ page }) => {
    applyNoEgressGuard(page);
    await loginUAT(page);
});

test.describe('Audiobook & Settings Flows', () => {

    test('loads Audiobook generation panel', async ({ page }) => {
        await page.goto(`/project/${seedData.projectId}/audiobook`);
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=Generate Audiobook')).toBeVisible({ timeout: 10000 });
        // Make sure no external TTS calls fire on load by implicit assert through error gate
    });

    test('loads Global AI Settings and Token Monitor', async ({ page }) => {
        await page.goto(`/settings/ai`);
        await page.waitForLoadState('networkidle');

        // Assert token monitor
        await expect(page.locator('text=Local Models (Open Source)')).toBeVisible();
        await expect(page.locator('text=Dollar Amount Saved')).toBeVisible();
    });

    test('loads Global Agentic AI Team settings', async ({ page }) => {
        await page.goto(`/settings/ai-team`);
        await page.waitForLoadState('networkidle');

        // Assert the persona listed
        await expect(page.locator('text=Story Architect')).toBeVisible();
    });

    test('loads Voice Library settings & allows opening Add Voice Wizard', async ({ page }) => {
        await page.goto(`/settings/voices`);
        await page.waitForLoadState('networkidle');

        // Check add clone button
        const addBtn = page.locator('button:has-text("Clone Voice")');
        await expect(addBtn).toBeVisible();

        await addBtn.click();
        await expect(page.locator('text=Name Your Voice')).toBeVisible();
    });
});
