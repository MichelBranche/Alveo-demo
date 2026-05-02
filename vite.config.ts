import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'alveo-security-csp-meta',
      transformIndexHtml(html) {
        if (mode !== 'production') return html
        const tag = `\n    <meta http-equiv="Content-Security-Policy" content="${PROD_CSP}" />\n`
        return html.replace(/<\/head>/i, `${tag}</head>`)
      },
    },
  ],
}))
