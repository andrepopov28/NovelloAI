import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

describe('AI Routes & Auth Smoke Tests', () => {

    it('1. POST /api/ai/inline requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/inline`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status), 'Expected 401/403 for unauthorized request');
    });

    it('2. POST /api/ai/brainstorm requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/brainstorm`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status), 'Expected 401/403 for unauthorized request');
    });

    it('3. POST /api/ai/audiobook requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/audiobook`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status), 'Expected 401/403 for unauthorized request');
    });

    it('4. POST /api/ai/cover requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/cover`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status), 'Expected 401/403 for unauthorized request');
    });

    it('5. POST /api/ai/generate requires exact prompt or write_chapter action', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/generate`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer fake-token' },
            body: JSON.stringify({ action: 'expand' })
        });
        assert.ok([401, 403].includes(res.status), 'Expected 401/403 for fake token');
    });

    it('6. POST /api/export/epub requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/export/epub`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status));
    });

    it('7. POST /api/export/pdf requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/export/pdf`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status));
    });

    it('8. GET /api/ollama/ping returns 200 or 500 cleanly', async () => {
        const res = await fetch(`${BASE_URL}/api/ollama/ping`);
        assert.ok([200, 500].includes(res.status));
    });

    it('9. POST /api/ai/continuity requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/continuity`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status));
    });

    it('10. POST /api/ai/trace requires Authorization', async () => {
        const res = await fetch(`${BASE_URL}/api/ai/trace`, { method: 'POST', body: JSON.stringify({}) });
        assert.ok([401, 403].includes(res.status));
    });
});
