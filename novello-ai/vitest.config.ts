import { defineConfig } from 'vitest/config';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        environment: 'node',
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        include: ['uat/headless/**/*.test.ts', 'src/**/*.test.ts'],
        setupFiles: ['./uat/headless/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
    },
});
