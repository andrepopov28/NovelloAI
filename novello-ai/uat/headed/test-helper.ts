import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const seedData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../.seed.json'), 'utf8'));

export async function loginUAT(page: Page) {
    await page.goto('/login');
    await page.waitForSelector('#uat-token', { state: 'visible' });
    await page.fill('#uat-token', seedData.customToken);
    await page.click('#uat-login-btn');
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
}

export function applyNoEgressGuard(page: Page) {
    page.route('**/*', (route) => {
        const urlStr = route.request().url();
        if (urlStr.startsWith('blob:') || urlStr.startsWith('data:')) {
            return route.continue();
        }

        const url = new URL(urlStr);
        const allowedHosts = [
            'localhost',
            '127.0.0.1',
            'host.docker.internal'
        ];

        if (allowedHosts.includes(url.hostname)) {
            return route.continue();
        }

        console.error(`[Playwright No-Egress Guard] Blocked external request to: ${url.href}`);
        return route.abort('blockedbyclient');
    });

    page.on('console', msg => {
        if (msg.type() === 'error') {
            if (msg.text().includes('404')) return;
            if (msg.text().includes('No-Egress')) return;
            if (msg.text().includes('ERR_BLOCKED_BY_CLIENT')) return;
            console.error(`[Console Error Fail Gate] ${msg.text()}`);
        }
    });
}
