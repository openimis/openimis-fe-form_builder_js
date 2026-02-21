import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    esbuild: {
        loader: 'jsx',
        include: [
            /src\/.*\.jsx?$/,
            /src\/.*\.js$/,
            /__tests__\/.*\.jsx?$/,
        ],
        exclude: [],
    },
    test: {
        environment: 'jsdom',
        alias: {
            '@openimis/fe-core': path.resolve(__dirname, '__tests__/dummy-core.js')
        }
    }
});
