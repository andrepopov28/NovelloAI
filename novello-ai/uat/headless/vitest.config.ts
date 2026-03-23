import { defineConfig } from 'vitest/config';
import * as dotenv from 'dotenv';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// Load UAT env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env.uat') });

export default defineConfig({
    root: path.resolve(__dirname, '../../'),
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./uat/headless/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        include: ['uat/headless/**/*.test.ts'],
        reporters: ['default', ['junit', { outputFile: 'uat/artifacts/junit-headless.xml' }]],
    }
});
