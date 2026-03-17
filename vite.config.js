import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

export default defineConfig({
    base: '/',
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // After build, copy index.html to 404.html for GitHub Pages SPA routing
        // This ensures 404.html has the correct asset paths
        try {
          const indexPath = path.resolve(__dirname, 'dist/index.html');
          const indexContent = readFileSync(indexPath, 'utf-8');
          const four04Path = path.resolve(__dirname, 'dist/404.html');
          writeFileSync(four04Path, indexContent);
          console.log('✓ Copied index.html to 404.html for GitHub Pages SPA routing');
          
          // Create deleteAccount/index.html for GitHub Pages
          // Note: GitHub Pages will redirect /deleteAccount to /deleteAccount/ (301)
          // To avoid the redirect, configure Cloudflare Page Rule or use a different hosting solution
          const deleteAccountDir = path.resolve(__dirname, 'dist/deleteAccount');
          const deleteAccountIndexPath = path.resolve(deleteAccountDir, 'index.html');
          try {
            mkdirSync(deleteAccountDir, { recursive: true });
            writeFileSync(deleteAccountIndexPath, indexContent);
            console.log('✓ Created deleteAccount/index.html (GitHub Pages will redirect /deleteAccount to /deleteAccount/)');
          } catch (dirError) {
            console.error('Error creating deleteAccount directory:', dirError);
          }
        } catch (error) {
          console.error('Error copying index.html to 404.html:', error);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    copyPublicDir: true,
  },
  server: {
    // Handle SPA routing - redirect all routes to index.html
    // This allows direct access to /event/123456 to work
    historyApiFallback: true,
  },
}) 