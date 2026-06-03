import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static SPA cho web học tiếng Trung. Output ra dist/ để deploy Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
});
