import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // 개발 중 /api 요청을 Spring(8080)으로 넘긴다. VITE_API_BASE_URL을 비워두면 이 프록시를 탄다.
      proxy: {
        '/api': { target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
      },
    },
  }
})
