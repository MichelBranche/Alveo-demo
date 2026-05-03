import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import 'lenis/dist/lenis.css'
import './index.css'
import App from './App.tsx'
import { bootstrapNativeShell } from './nativeBootstrap.ts'

void bootstrapNativeShell()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <Analytics />
      <App />
    </>
  </StrictMode>,
)
