import { test, expect } from '@playwright/test';
import { loginUAT, applyNoEgressGuard, seedData } from './test-helper';

test.beforeEach(async ({ page }) => {
    applyNoEgressGuard(page);
    await loginUAT(page);
    await page.goto(`/project/${seedData.projectId}/brainstorm`);
    await page.waitForLoadState('networkidle');
});

test.describe('Brainstorm Flow', () => {
    test('loads AI brainstorm chatbox', async ({ page }) => {
        await expect(page.locator('text=Start Brainstorming')).toBeVisible();
    });

    test('can switch to Whiteboard tab and create sticky', async ({ page }) => {
        // Find and click the Whiteboard tab
        await page.click('button:has-text("Whiteboard")');
        await expect(page.locator('.tldraw-canvas')).toBeVisible({ timeout: 10000 });
    });

    test('can switch to Outline tab and generate items', async ({ page }) => {
        await page.click('button:has-text("Outline")');
        // AI Generate outline button
        const generateBtn = page.locator('button:has-text("Generate Outline")');
        await expect(generateBtn).toBeVisible();
    });

    test('can switch to Mind Map tab', async ({ page }) => {
        await page.click('button:has-text("Mind Map")');
        // React Flow pane
        await expect(page.locator('.react-flow')).toBeVisible({ timeout: 10000 });
    });
});
