/* Proprietary & Confidential — WRKFLW SaaS Platform
 * Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com
 */

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function wrkflwOwnershipBannerPlugin(): Plugin {
  const banner =
    '/* WRKFLW Proprietary SaaS Platform | Ownership Code: SGSR14061977820DLVR | Proprietor: dtglbw@gmail.com | All Rights Reserved — Copying, distribution, or replication without prior written permission is strictly prohibited. */\n';
  return {
    name: 'wrkflw-ownership-banner',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.fileName.endsWith('.js')) {
          file.code = banner + file.code;
        } else if (
          file.type === 'asset' &&
          file.fileName.endsWith('.css') &&
          typeof file.source === 'string'
        ) {
          file.source = banner + file.source;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), wrkflwOwnershipBannerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
});
