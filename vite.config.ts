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
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          // 브라우저는 같은 origin이어도 POST에 Origin 헤더를 붙인다. 그대로 넘기면 백엔드 CORS가
          // 개발 서버 주소(:5173)를 몰라 403(Invalid CORS request)을 낸다. 프록시 경유는 서버 간 요청이므로 뺀다.
          configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
        },
      },
    },
  }
})
