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
  },
})
