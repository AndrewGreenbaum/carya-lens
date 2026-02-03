/**
 * esbuild configuration for Chrome Extension
 *
 * Builds:
 * - Background service worker
 * - Popup
 * - Copies manifest and assets to dist/
 */

const esbuild = require('esbuild');
const alias = require('esbuild-plugin-alias');
const fs = require('fs');
const path = require('path');

// Clean dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Build configuration
const buildConfig = {
  bundle: true,
  minify: false, // Keep false for debugging
  sourcemap: 'inline',
  target: 'es2022',
  format: 'esm',
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}',
    'process': '{"env":{}}',
  },
  logLevel: 'info',
  plugins: [
    alias({
      '@': path.resolve(__dirname, './src'),
    }),
  ],
};

// Build background worker (use IIFE format for service worker compatibility)
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/background/index.ts'],
  outfile: 'dist/background.js',
  tsconfig: './tsconfig.json',
  format: 'iife', // Service workers need IIFE, not ESM
}).catch(() => process.exit(1));

// Build popup
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/popup.tsx'],
  outfile: 'dist/popup.js',
  tsconfig: './tsconfig.json',
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
}).catch(() => process.exit(1));

// Build content script (IIFE for injection into pages)
esbuild.build({
  ...buildConfig,
  entryPoints: ['src/content/linkedin-overlay.tsx'],
  outfile: 'dist/content.js',
  tsconfig: './tsconfig.json',
  format: 'iife', // Content scripts need IIFE
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
}).catch(() => process.exit(1));

// Copy manifest
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy assets
const assetsDir = path.join(__dirname, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

if (fs.existsSync(assetsDir)) {
  fs.mkdirSync(distAssetsDir, { recursive: true });

  const files = fs.readdirSync(assetsDir);
  files.forEach(file => {
    fs.copyFileSync(
      path.join(assetsDir, file),
      path.join(distAssetsDir, file)
    );
  });
}

// Create popup.html
const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 300px;
      min-height: 200px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./popup.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'popup.html'), popupHtml);

console.log('\n✅ Build complete! Output: dist/');
console.log('\nTo load in Chrome:');
console.log('1. Open chrome://extensions');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log('4. Select the dist/ folder\n');
