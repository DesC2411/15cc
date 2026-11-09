import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const contentDir = fileURLToPath(new URL('../content', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Dữ liệu nội dung dùng chung ở thư mục gốc (CLAUDE.md mục 8).
      '@content': contentDir,
    },
  },
  server: {
    // host: true để mở được trên điện thoại cùng mạng Wi-Fi.
    host: true,
    port: 5173,
    fs: { allow: ['..'] },
    // Cho phép mở qua Tailscale Funnel (https://<máy>.<tailnet>.ts.net).
    allowedHosts: ['.ts.net'],
    // Server Colyseus đi chung địa chỉ với trang (/colyseus → ws://localhost:2567),
    // để chỉ cần mở 1 cổng ra Internet và chạy được qua https.
    proxy: {
      '/colyseus': {
        target: 'http://localhost:2567',
        ws: true,
        rewrite: (path) => path.replace(/^\/colyseus/, '') || '/',
      },
    },
  },
})
