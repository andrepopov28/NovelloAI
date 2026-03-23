import { test, expect } from '@playwright/test';
import { loginUAT, applyNoEgressGuard, seedData } from './test-helper';

test.beforeEach(async ({ page }) => {
    applyNoEgressGuard(page);
    await loginUAT(page);
});

test.describe('Dashboard Flow', () => {

    test('loads dashboard and displays seeded project', async ({ page }) => {
        // Assert project card exists
        const projectCard = page.locator(`text=${seedData.projectId}`); // Or "The Automated Epic"
        // Wait for firestore sync
        await expect(page.locator('text=The Automated Epic')).toBeVisible({ timeout: 10000 });

        // Assert token monitor section is visible locally
        await expect(page.locator('text=AI Token Usage')).toBeVisible();
        await expect(page.locator('text=Local Tokens')).toBeVisible();
    });

    test('navigates to project editor on click', async ({ page }) => {
        await page.click('text=The Automated Epic');
        await expect(page).toHaveURL(new RegExp(`/project/${seedData.projectId}$`), { timeout: 10000 });
    });

    test('can open add project modal', async ({ page }) => {
        await page.click('button:has-text("New Project")');
        await expect(page.locator('text=Project Title')).toBeVisible();
        await page.click('button:visible:has-text("Cancel")');
    });
});
