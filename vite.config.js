import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsxImportSource: '@emotion/react',
  })],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.jsx'),
      name: 'FormBuilderModule',
      fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        /^@babel.*/,
        /^@date-io\/.*/,
        /^@mui\/material.*/,
        /^@mui\/icons-material.*/,
        '@mui/x-date-pickers',
        /^@emotion\/react/,
        /^@emotion\/styled/,
        /^@emotion\/cache/,
        '@mui/styled-engine',
        /^@openimis.*/,
        'classnames',
        'clsx',
        'history',
        /^lodash.*/,
        'moment',
        'prop-types',
        /^react.*/,
        /^redux.*/,
        'react-router',
        'react-router-dom',
        'redux-api-middleware',
      ],
      output: {
        globals: {
          react: 'React',
        },
      },
    },
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
  // Keep test config for vitest inside the module
  test: {
    environment: 'jsdom',
    alias: {
      '@openimis/fe-core': path.resolve(__dirname, '__tests__/dummy-core.js')
    }
  }
});
