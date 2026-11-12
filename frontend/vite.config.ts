/// <reference types="vitest/config" />

import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import packageJson from './package.json' with { type: 'json' };

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // https://vite.dev/config/#using-environment-variables-in-config
  const env = loadEnv(mode, import.meta.dirname);
  const usePyodide = mode === 'pyodide';

  // Experimental -->
  //
  // const useBundled =
  //   env.VITE_USE_BUNDLED_MONACO === 'true' || env.VITE_USE_BUNDLED_MONACO === 'True';
  //
  // <-- Experimental

  return {
    root: 'src',
    envDir: import.meta.dirname,
    base: usePyodide ? './' : '/',
    plugins: [react()],
    worker: { format: usePyodide ? 'es' : 'iife' },
    build: {
      outDir: resolve(import.meta.dirname, usePyodide ? 'dist-pyodide' : 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      rolldownOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@primary-parser': resolve(
          import.meta.dirname,
          'src/features/textfsm',
          usePyodide ? 'primaryPyodide.ts' : 'primaryBackend.ts',
        ),
        // Experimental -->
        //
        // Dynamically set alias for the Monaco initialization module
        // Bundling Monaco adds 15MB to the size
        //
        // '@/features/editor/initializeEditor': useBundled
        //   ? resolve(import.meta.dirname, 'src/features/editor/initializeEditorBundledMonaco.ts')
        //   : resolve(import.meta.dirname, 'src/features/editor/initializeEditor.ts'),
        //
        // <-- Experimental
        '@/': `${import.meta.dirname}/src/`,
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __API_ENTRYPOINT__: JSON.stringify(
        command === 'build'
          ? env.VITE_API_ENTRYPOINT_PROD || ''
          : env.VITE_API_ENTRYPOINT_DEV || 'http://localhost:8000',
      ),
    },
    // Using Vite on WSL2
    // refer to https://vite.dev/config/server-options
    //  uncomment the following lines to enable polling
    // server: {
    //   watch: {
    //     usePolling: true,
    //     interval: 1200, // default 100
    //     binaryInterval: 3600, // default 300
    //   },
    // },
    test: {
      dir: 'tests',
      exclude: ['**/*.local*'],
      reporters: ['json', 'default'],
      outputFile: '../.coverage/test-output.json',
    },
  };
});
