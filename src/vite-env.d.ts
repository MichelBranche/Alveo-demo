/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Inietta Vite (`/` in dev di solito); se assente nel runtime usare fallback nell’audio locale. */
  readonly BASE?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
