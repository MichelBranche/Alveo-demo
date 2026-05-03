/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Inietta Vite (`/` in dev di solito); se assente nel runtime usare fallback nell’audio locale. */
  readonly BASE?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** URL checkout / pagina sostegno (Stripe, Ko-fi, ecc.) per la sezione home. */
  readonly VITE_ALVEO_SUPPORT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
