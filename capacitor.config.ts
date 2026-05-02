import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.alveo.app',
  appName: 'Alveo',
  webDir: 'dist',
  /** Riduce perdite nei log nei build di release (la console JS resta soggetta alla piattaforma). */
  loggingBehavior: 'debug',
  server: {
    /** Caricamenti non cifrati nella WebView: solo sviluppo con live reload, mai in prod. */
    cleartext: false,
    androidScheme: 'https',
  },
};

export default config;
